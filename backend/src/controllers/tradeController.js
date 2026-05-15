const { purchaseSchema } = require('../validation/tradeSchema');

function makeTradeController(prisma, io) {
  async function purchaseProduct(req, res) {
    try {
      const data = purchaseSchema.parse(req.body);
      const productId = data.productId;
      const quantity = data.quantity ?? 1;

      const buyerId = req.user && req.user.userId;
      if (!buyerId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw { status: 404, message: 'Product not found' };
        if (product.ownerId === buyerId) throw { status: 400, message: 'Cannot buy your own product' };
        if (product.stock < quantity) throw { status: 400, message: 'Not enough stock' };
        if (product.price <= 0n) throw { status: 400, message: 'Invalid product price' };

        const buyer = await tx.user.findUnique({ where: { id: buyerId } });
        if (!buyer) throw { status: 404, message: 'Buyer not found' };

        const seller = await tx.user.findUnique({ where: { id: product.ownerId } });
        if (!seller) throw { status: 404, message: 'Seller not found' };

        const totalPrice = product.price * BigInt(quantity);
        if (buyer.goldBalance < totalPrice) throw { status: 400, message: 'Insufficient funds' };

        // Update buyer and seller balances and reputation
        await tx.user.update({ where: { id: buyerId }, data: { goldBalance: buyer.goldBalance - totalPrice, reputationScore: buyer.reputationScore + 1 } });
        await tx.user.update({ where: { id: seller.id }, data: { goldBalance: seller.goldBalance + totalPrice, reputationScore: seller.reputationScore + 1 } });

        // Decrement stock
        await tx.product.update({ where: { id: productId }, data: { stock: product.stock - quantity } });

        // Log transaction
        const createdTx = await tx.transaction.create({ data: { senderId: buyerId, receiverId: seller.id, amount: totalPrice, type: 'TRADE' } });

        // Emit canonical transaction event for admin/monitoring
        try {
          if (io && io.emit) io.emit('transaction_created', {
            id: createdTx.id,
            type: createdTx.type,
            amount: createdTx.amount.toString(),
            senderId: createdTx.senderId,
            receiverId: createdTx.receiverId,
            timestamp: createdTx.timestamp
          });
        } catch (e) {
          console.warn('Failed to emit transaction_created', e.message || e);
        }

        return { product, totalPrice, buyerId, sellerId: seller.id };
      });

      // Broadcast high-value trades
      const threshold = BigInt(process.env.HIGH_VALUE_THRESHOLD_MG || '10000');
      if (result.totalPrice >= threshold && io && io.emit) {
        io.emit('new_trade_occurred', {
          productId: result.product.id,
          totalPrice: result.totalPrice.toString(),
          buyerId: result.buyerId,
          sellerId: result.sellerId,
        });
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
