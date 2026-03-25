const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// 全ルートに認証 + admin権限を要求
router.use(authenticate, requireRole('admin'));

// 全契約者一覧
router.get('/contracts', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, plan, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// 全代理店一覧
router.get('/agencies', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at')
      .eq('role', 'partner')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// ユーザーのrole変更（adminのみ）
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!role || !['user', 'admin', 'partner'].includes(role)) {
    return res.status(400).json({ error: '有効なroleを指定してください（user, admin, partner）' });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'role変更に失敗しました' });
  }
});

module.exports = router;
