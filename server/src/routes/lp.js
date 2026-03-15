const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createLP, getLPs, getLP, serveLPHtml } = require('../services/lp/generator');

// LP一覧取得（認証必須）
router.get('/', authenticate, async (req, res) => {
  try {
    const lps = await getLPs(req.user.id);
    res.json(lps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LP生成（認証必須）
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { productName, price, target, strengths, reviews, lineUrl } = req.body;
    if (!productName || !target) {
      return res.status(400).json({ error: '商品名とターゲットは必須です' });
    }
    const lp = await createLP(req.user.id, { productName, price, target, strengths, reviews, lineUrl });
    res.json(lp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LP HTML公開ページ（認証不要）
router.get('/view/:id', async (req, res) => {
  try {
    const html = await serveLPHtml(req.params.id);
    if (!html) return res.status(404).send('LPが見つかりません');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(404).send('LPが見つかりません');
  }
});

// LP詳細（認証必須）
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lp = await getLP(req.params.id);
    res.json(lp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
