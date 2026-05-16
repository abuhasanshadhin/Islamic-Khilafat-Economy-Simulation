const express = require('express');
const router = express.Router();
const { ResourcePriceEntity } = require('../entities/ResourcePrice');
const { ProductEntity } = require('../entities/Product');
const { UserEntity } = require('../entities/User');
const authenticateToken = require('../middleware/authenticateToken');
const { OwnedItemEntity } = require('../entities/OwnedItem');
const { SaleLogEntity } = require('../entities/SaleLog');

function makeMarketRoutes(dataSource, io) {
  router.get('/prices', async (req, res) => {
    try {
      const prices = await dataSource.getRepository(ResourcePriceEntity).find();
      return res.json(prices.map(p => ({ resource: p.resource, priceInGoldMg: p.priceInGoldMg, updatedAt: p.updatedAt })));
    } catch (err) {
      console.error('[marketRoutes] error', err);
      res.status(500).json({ error: 'Failed to fetch prices' });
    }
  });

  router.get('/products', async (req, res) => {
    try {
      const products = await dataSource.getRepository(ProductEntity).find({
        relations: ['owner'],
        where: {},
        order: { id: 'DESC' },
      });
      return res.json(products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price ? p.price.toString() : '0',
        stock: p.stock,
        ownerId: p.ownerId,
        sellerName: p.owner ? p.owner.username : 'Unknown',
        sellerReputation: p.owner ? p.owner.reputationScore : 0,
      })));
    } catch (err) {
      console.error('[marketRoutes] products error', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  router.get('/my-products', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const repo = dataSource.getRepository(ProductEntity);

      const [products, total] = await repo.findAndCount({
        where: { ownerId: userId },
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const items = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price ? p.price.toString() : '0',
        stock: p.stock,
      }));

      const totalPages = Math.max(1, Math.ceil(total / limit));
      const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
      const rangeEnd = Math.min(total, page * limit);

      return res.json({
        items,
        meta: { page, limit, total, totalPages, rangeStart, rangeEnd },
      });
    } catch (err) {
      console.error('[marketRoutes] my-products error', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  router.delete('/product/:id', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const productId = parseInt(req.params.id, 10);
      const product = await dataSource.getRepository(ProductEntity).findOneBy({ id: productId });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.ownerId !== userId) return res.status(403).json({ error: 'Not your product' });
      await dataSource.getRepository(ProductEntity).delete({ id: productId });
      return res.json({ success: true });
    } catch (err) {
      console.error('[marketRoutes] delete product error', err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  router.post('/list', authenticateToken, async (req, res) => {
    try {
      const user = await dataSource.getRepository(UserEntity).findOneBy({ id: req.user.userId });
      if (!user) return res.status(401).json({ error: 'User not found' });
      if (user.reputationScore < 40) {
        return res.status(403).json({ error: 'Reputation score must be at least 40 to list items' });
      }

      const { name, description, price, stock } = req.body;
      if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

      const priceBig = BigInt(price);
      if (priceBig <= 0n) return res.status(400).json({ error: 'price must be > 0' });

      const product = await dataSource.getRepository(ProductEntity).save({
        name,
        description: description || null,
        price: priceBig,
        stock: Number(stock) || 1,
        ownerId: req.user.userId,
      });

      if (io) io.emit('market:new-listing', { id: product.id, name: product.name });

      return res.status(201).json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock,
        ownerId: product.ownerId,
      });
    } catch (err) {
      console.error('[marketRoutes] list error', err);
      res.status(500).json({ error: 'Failed to list product' });
    }
  });

  // Resell an owned item: create a new product listing from user's OwnedItem
  router.post('/resell', authenticateToken, async (req, res) => {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { ownedItemId, price, quantity, name } = req.body;
      if (!ownedItemId || !price || !quantity) return res.status(400).json({ error: 'ownedItemId, price and quantity are required' });

      const qty = Number(quantity) || 0;
      if (qty <= 0) return res.status(400).json({ error: 'quantity must be > 0' });

      const oiRepo = dataSource.getRepository(OwnedItemEntity);
      const owned = await oiRepo.findOneBy({ id: Number(ownedItemId) });
      if (!owned) return res.status(404).json({ error: 'Owned item not found' });
      if (owned.userId !== userId) return res.status(403).json({ error: 'Not your owned item' });
      if ((owned.quantity || 0) < qty) return res.status(400).json({ error: 'Not enough quantity to resell' });

      const priceBig = BigInt(price);
      const product = await dataSource.getRepository(ProductEntity).save({
        name: name || owned.productName || 'Resold item',
        description: null,
        price: priceBig,
        stock: qty,
        ownerId: userId,
      });

      // decrement owned quantity
      owned.quantity = owned.quantity - qty;
      await oiRepo.save(owned);

      // create sale log entry
      await dataSource.getRepository(SaleLogEntity).save({ sellerId: userId, productId: product.id, ownedItemId: owned.id, action: 'LISTED', price: priceBig, quantity: qty });

      if (io) io.emit('market:new-listing', { id: product.id, name: product.name });

      return res.status(201).json({ id: product.id, name: product.name, price: product.price.toString(), stock: product.stock });
    } catch (err) {
      console.error('[marketRoutes] resell error', err);
      res.status(500).json({ error: 'Failed to create resell listing' });
    }
  });

  return router;
}

module.exports = makeMarketRoutes;
