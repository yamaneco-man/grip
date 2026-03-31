const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// テンプレート一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .select('*')
      .eq('user_id', req.user.id)
      .order('usage_count', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// テンプレート作成
router.post('/', authenticate, async (req, res) => {
  const { name, category, message_type, content } = req.body;
  if (!name || !content) return res.status(400).json({ error: '名前と内容は必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .insert({ user_id: req.user.id, name, category: category || 'general', message_type: message_type || 'text', content })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// テンプレート更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, category, message_type, content } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (message_type !== undefined) updates.message_type = message_type;
    if (content !== undefined) updates.content = content;
    const { data, error } = await supabaseAdmin
      .from('message_templates').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// テンプレート削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('message_templates').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// テンプレート使用（カウント増加）
router.post('/:id/use', authenticate, async (req, res) => {
  try {
    const { data: tpl } = await supabaseAdmin.from('message_templates').select('usage_count').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!tpl) return res.status(404).json({ error: 'テンプレートが見つかりません' });
    const { data, error } = await supabaseAdmin
      .from('message_templates')
      .update({ usage_count: (tpl.usage_count || 0) + 1 })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
