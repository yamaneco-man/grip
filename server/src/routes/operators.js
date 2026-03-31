const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
}

// オペレーター一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('operators')
      .select('id, name, email, permissions, is_active, last_login_at, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// オペレーター作成
router.post('/', authenticate, async (req, res) => {
  const { name, email, password, permissions } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: '名前・メール・パスワードは必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('operators')
      .insert({ user_id: req.user.id, name, email, password_hash: hashPassword(password), permissions: permissions || ['chat', 'booking'] })
      .select('id, name, email, permissions, is_active, created_at').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '同じメールのオペレーターが既に存在します' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// オペレーター更新
router.put('/:id', authenticate, async (req, res) => {
  const { name, permissions, is_active, password } = req.body;
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (permissions !== undefined) updates.permissions = permissions;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) updates.password_hash = hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from('operators').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id)
      .select('id, name, email, permissions, is_active').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// オペレーター削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('operators').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// オペレーターログイン
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'ログイン試行回数の上限です。15分後に再試行してください' } });
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password, owner_id } = req.body;
  if (!email || !password || !owner_id) return res.status(400).json({ error: 'メール・パスワード・オーナーIDは必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('operators')
      .select('*')
      .eq('user_id', owner_id).eq('email', email).eq('is_active', true).single();
    if (error || !data) return res.status(401).json({ error: '認証に失敗しました' });
    if (!verifyPassword(password, data.password_hash)) return res.status(401).json({ error: '認証に失敗しました' });

    await supabaseAdmin.from('operators').update({ last_login_at: new Date().toISOString() }).eq('id', data.id);
    res.json({ id: data.id, name: data.name, permissions: data.permissions, owner_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
