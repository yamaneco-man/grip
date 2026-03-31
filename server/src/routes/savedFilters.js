const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// 保存済みフィルタ一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('saved_filters')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フィルタ保存
router.post('/', authenticate, async (req, res) => {
  const { name, filter_conditions } = req.body;
  if (!name || !filter_conditions) return res.status(400).json({ error: '名前と条件は必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('saved_filters')
      .insert({ user_id: req.user.id, name, filter_conditions })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フィルタ更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, filter_conditions } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (filter_conditions !== undefined) updates.filter_conditions = filter_conditions;
    const { data, error } = await supabaseAdmin
      .from('saved_filters').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フィルタ削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('saved_filters').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フィルタ実行（友だちリスト取得）
router.post('/:id/execute', authenticate, async (req, res) => {
  try {
    const { data: filter } = await supabaseAdmin
      .from('saved_filters').select('*')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!filter) return res.status(404).json({ error: 'フィルタが見つかりません' });

    const conditions = filter.filter_conditions;
    let query = supabaseAdmin
      .from('line_followers')
      .select('*, follower_tags(tag_id)')
      .eq('user_id', req.user.id);

    if (conditions.is_blocked !== undefined) query = query.eq('is_blocked', conditions.is_blocked);
    if (conditions.source_channel) query = query.eq('source_channel', conditions.source_channel);
    if (conditions.registered_after) query = query.gte('registered_at', conditions.registered_after);
    if (conditions.registered_before) query = query.lte('registered_at', conditions.registered_before);

    const { data, error } = await query.order('registered_at', { ascending: false });
    if (error) throw error;

    let results = data || [];

    // タグフィルタ（後処理）
    if (conditions.tag_ids?.length) {
      results = results.filter(f => {
        const fTagIds = (f.follower_tags || []).map(t => t.tag_id);
        return conditions.match_all
          ? conditions.tag_ids.every(id => fTagIds.includes(id))
          : conditions.tag_ids.some(id => fTagIds.includes(id));
      });
    }

    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
