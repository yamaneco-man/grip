const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// CVゴール一覧
router.get('/goals', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversion_goals')
      .select('*, conversion_events(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(g => ({ ...g, event_count: g.conversion_events?.[0]?.count || 0 })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CVゴール作成
router.post('/goals', authenticate, async (req, res) => {
  const { name, goal_type, conditions, auto_tag_id } = req.body;
  if (!name) return res.status(400).json({ error: 'ゴール名は必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('conversion_goals')
      .insert({ user_id: req.user.id, name, goal_type: goal_type || 'url', conditions: conditions || {}, auto_tag_id })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CVゴール削除
router.delete('/goals/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('conversion_goals').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CVイベント記録
router.post('/track', authenticate, async (req, res) => {
  const { goal_id, follower_id, source_broadcast_id, source_type } = req.body;
  if (!goal_id) return res.status(400).json({ error: 'goal_idは必須です' });
  try {
    const { data: goal } = await supabaseAdmin.from('conversion_goals').select('*').eq('id', goal_id).eq('user_id', req.user.id).single();
    if (!goal) return res.status(404).json({ error: 'ゴールが見つかりません' });

    const { data, error } = await supabaseAdmin
      .from('conversion_events')
      .insert({ goal_id, follower_id, source_broadcast_id, source_type })
      .select().single();
    if (error) throw error;

    // 自動タグ付与
    if (follower_id && goal.auto_tag_id) {
      await supabaseAdmin.from('follower_tags').insert({ follower_id, tag_id: goal.auto_tag_id }).catch(() => {});
    }
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CV統計
router.get('/stats', authenticate, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: goals } = await supabaseAdmin
      .from('conversion_goals').select('id, name, goal_type').eq('user_id', req.user.id);

    const stats = [];
    for (const goal of (goals || [])) {
      const { count } = await supabaseAdmin
        .from('conversion_events')
        .select('id', { count: 'exact', head: true })
        .eq('goal_id', goal.id)
        .gte('converted_at', since.toISOString());
      stats.push({ ...goal, conversions: count || 0 });
    }
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CVイベント一覧
router.get('/events', authenticate, async (req, res) => {
  const goalId = req.query.goal_id;
  try {
    let query = supabaseAdmin
      .from('conversion_events')
      .select('*, conversion_goals!inner(name, user_id), line_followers(display_name)')
      .eq('conversion_goals.user_id', req.user.id)
      .order('converted_at', { ascending: false })
      .limit(200);
    if (goalId) query = query.eq('goal_id', goalId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
