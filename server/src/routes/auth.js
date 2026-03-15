const express = require('express');
const router = express.Router();

// ユーザー登録
router.post('/signup', async (req, res) => {
  // TODO: Supabase Authでユーザー登録
  res.json({ message: 'ユーザー登録' });
});

// ログイン
router.post('/login', async (req, res) => {
  // TODO: Supabase Authでログイン
  res.json({ message: 'ログイン' });
});

// プロフィール取得
router.get('/profile', async (req, res) => {
  // TODO: 認証済みユーザーのプロフィール取得
  res.json({ message: 'プロフィール取得' });
});

module.exports = router;
