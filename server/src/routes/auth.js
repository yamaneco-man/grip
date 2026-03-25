const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ログイン専用レート制限（5回/15分 — ブルートフォース対策）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'ログイン試行回数の上限に達しました。15分後にお試しください。' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ユーザー登録（レート制限付き — 大量アカウント作成防止）
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'アカウント作成の上限に達しました。1時間後にお試しください。' },
});
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // usersテーブルにもレコード作成（roleは常にuser — 昇格はadmin APIのみ）
    if (data.user) {
      await supabaseAdmin.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        plan: 'free',
        role: 'user',
      });
    }

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ログイン（レート制限付き）
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }
});

// プロフィール取得
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
