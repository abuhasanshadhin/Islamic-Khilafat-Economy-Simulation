const { purchaseSchema } = require('../validation/tradeSchema');
const { ProductEntity } = require('../entities/Product');
const { UserEntity } = require('../entities/User');
const { TransactionEntity } = require('../entities/Transaction');

function makeTradeController(dataSource, io) {
  async function purchaseProduct(req, res) {
    try {
      const data = purchaseSchema.parse(req.body);
      const productId = data.productId;
      const quantity = data.quantity ?? 1;

      const buyerId = req.user && req.user.userId;
      if (!buyerId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await dataSource.transaction(async (manager) => {
        const product = await manager.findOneBy(ProductEntity, { id: productId });
        if (!product) throw { status: 404, message: 'Product not found' };
        if (product.ownerId === buyerId) throw { status: 400, message: 'Cannot buy your own product' };
        if (product.stock < quantity) throw { status: 400, message: 'Not enough stock' };
        if (product.price <= 0n) throw { status: 400, message: 'Invalid product price' };

        const buyer = await manager.findOneBy(UserEntity, { id: buyerId });
        if (!buyer) throw { status: 404, message: 'Buyer not found' };

        const seller = await manager.findOneBy(UserEntity, { id: product.ownerId });
        if (!seller) throw { status: 404, message: 'Seller not found' };

        const totalPrice = product.price * BigInt(quantity);
        if (buyer.goldBalance < totalPrice) throw { status: 400, message: 'Insufficient funds' };

        await manager.update(UserEntity, { id: buyerId }, {
          goldBalance: (buyer.goldBalance - totalPrice).toString(),
          reputationScore: buyer.reputationScore + 1,
        });
        await manager.update(UserEntity, { id: seller.id }, {
          goldBalance: (seller.goldBalance + totalPrice).toString(),
          reputationScore: seller.reputationScore + 1,
        });

        await manager.update(ProductEntity, { id: productId }, { stock: product.stock - quantity });

        const createdTx = await manager.save(TransactionEntity, {
          senderId: buyerId,
          receiverId: seller.id,
          amount: totalPrice,
          type: 'TRADE',
        });

        return {
          product,
          totalPrice,
          buyerId,
          sellerId: seller.id,
          createdTx,
          newBuyerBalance: (buyer.goldBalance - totalPrice).toString(),
          newSellerBalance: (seller.goldBalance + totalPrice).toString(),
        };
      });

      const threshold = BigInt(process.env.HIGH_VALUE_THRESHOLD_MG || '10000');

      try {
        if (io) {
          const txPayload = {
            id: result.createdTx.id,
            type: result.createdTx.type,
            amount: result.createdTx.amount.toString(),
            senderId: result.createdTx.senderId,
            receiverId: result.createdTx.receiverId,
            timestamp: result.createdTx.timestamp,
          };
          io.to(`user:${result.buyerId}`).emit('transaction_created', txPayload);
          io.to(`user:${result.sellerId}`).emit('transaction_created', txPayload);
          io.to(`user:${result.buyerId}`).emit('balance_updated', { goldBalance: result.newBuyerBalance });
          io.to(`user:${result.sellerId}`).emit('balance_updated', { goldBalance: result.newSellerBalance });
          if (result.totalPrice >= threshold) {
            io.emit('new_trade_occurred', {
              productId: result.product.id,
              totalPrice: result.totalPrice.toString(),
              buyerId: result.buyerId,
              sellerId: result.sellerId,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to emit trade events', e.message || e);
      }

      return res.json({ success: true, productId: result.product.id, totalPrice: result.totalPrice.toString() });
    } catch (err) {
      if (err && err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      if (err && err.status) return res.status(err.status).json({ error: err.message });
      console.error('[tradeController] error', err);
      return res.status(500).json({ error: 'Purchase failed' });
    }
  }

  return { purchaseProduct };
}

module.exports = makeTradeController;
