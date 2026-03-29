const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const commerce = require('../services/commerce/orderManager');

// ── 商品管理 ──

router.get('/products', authenticate, async (req, res) => {
  try { res.json(await commerce.getProducts(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/products', authenticate, async (req, res) => {
  try { res.status(201).json(await commerce.createProduct(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/products/:id', authenticate, async (req, res) => {
  try { res.json(await commerce.updateProduct(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/products/:id', authenticate, async (req, res) => {
  try { await commerce.deleteProduct(req.user.id, req.params.id); res.json({ success: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── オーダーバンプ ──

router.get('/products/:productId/bumps', authenticate, async (req, res) => {
  try {
    // 商品の所有権チェック
    const product = await commerce.getProduct ? await commerce.getProduct(req.user.id, req.params.productId) : null;
    if (!product) {
      const products = await commerce.getProducts(req.user.id);
      if (!products.find(p => p.id === req.params.productId)) return res.status(403).json({ error: '商品へのアクセス権がありません' });
    }
    res.json(await commerce.getOrderBumps(req.params.productId));
  }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/products/:productId/bumps', authenticate, async (req, res) => {
  try {
    // 商品の所有権チェック
    const products = await commerce.getProducts(req.user.id);
    if (!products.find(p => p.id === req.params.productId)) return res.status(403).json({ error: '商品へのアクセス権がありません' });
    res.status(201).json(await commerce.setOrderBump(req.params.productId, req.body));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── アップセル ──

router.get('/upsells', authenticate, async (req, res) => {
  try { res.json(await commerce.getUpsells(req.user.id, req.query.triggerProductId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/upsells', authenticate, async (req, res) => {
  try { res.status(201).json(await commerce.setUpsell(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── 注文管理 ──

router.get('/orders', authenticate, async (req, res) => {
  try { res.json(await commerce.getOrders(req.user.id, { status: req.query.status, limit: Number(req.query.limit) || 50 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', authenticate, async (req, res) => {
  // 注意: 金額はreq.bodyから受け取らず、サービス層でproduct_idから再計算する（改ざん防止）
  try { res.status(201).json(await commerce.createOrder(req.user.id, { ...req.body, ipAddress: req.ip })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/orders/:id/complete', authenticate, async (req, res) => {
  try {
    // 注文の所有権チェック（user_idで検証）
    const orders = await commerce.getOrders(req.user.id, { limit: 1000 });
    if (!orders.find(o => o.id === req.params.id)) return res.status(403).json({ error: '注文へのアクセス権がありません' });
    res.json(await commerce.completeOrder(req.params.id, req.body.paymentId));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/orders/:id/refund', authenticate, async (req, res) => {
  try { res.json(await commerce.refundOrder(req.user.id, req.params.id)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── 請求書・領収書 ──

router.post('/orders/:id/invoice', authenticate, async (req, res) => {
  try { res.json(await commerce.generateInvoice(req.user.id, req.params.id, req.body.type || 'receipt')); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── ファネル管理 ──

router.get('/funnels', authenticate, async (req, res) => {
  try { res.json(await commerce.getFunnels(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/funnels', authenticate, async (req, res) => {
  try { res.status(201).json(await commerce.createFunnel(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/funnels/:id', authenticate, async (req, res) => {
  try { res.json(await commerce.updateFunnel(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── 広告コンバージョン ──

router.post('/ad-conversion', authenticate, async (req, res) => {
  try { res.json(await commerce.trackAdConversion(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
