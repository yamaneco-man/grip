const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkLPLimit } = require('../middleware/planLimit');
const { createLP, getLPs, getLP, serveLPHtml, updateLP, deleteLP } = require('../services/lp/generator');

// LP一覧取得（認証必須）
router.get('/', authenticate, async (req, res) => {
  try {
    const lps = await getLPs(req.user.id);
    res.json(lps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LP生成（認証必須・プラン制限チェック）
router.post('/generate', authenticate, checkLPLimit, async (req, res) => {
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

// LP更新（認証必須・メタ情報のみ、HTML再生成なし）
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { productName, price, target, strengths, reviews, lineUrl } = req.body;
    const lp = await updateLP(req.params.id, req.user.id, { productName, price, target, strengths, reviews, lineUrl });
    res.json(lp);
  } catch (err) {
    const status = err.message.includes('権限') ? 403 : err.message.includes('見つかりません') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// LP削除（認証必須・自分のLPのみ）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await deleteLP(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('権限') ? 403 : err.message.includes('見つかりません') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
