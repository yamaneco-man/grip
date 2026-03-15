const express = require('express');
const router = express.Router();

// LP一覧取得
router.get('/', async (req, res) => {
  // TODO: Supabaseからユーザーに紐づくLP一覧を取得
  res.json({ message: 'LP一覧' });
});

// LP生成（Claude APIでHTML生成）
router.post('/generate', async (req, res) => {
  // TODO: 商品情報を受け取りClaude APIでLP HTMLを生成
  res.json({ message: 'LP生成エンドポイント' });
});

// LP詳細取得
router.get('/:id', async (req, res) => {
  // TODO: 指定IDのLP情報を取得
  res.json({ message: `LP詳細: ${req.params.id}` });
});

// LP削除
router.delete('/:id', async (req, res) => {
  // TODO: LP削除処理
  res.json({ message: `LP削除: ${req.params.id}` });
});

module.exports = router;
