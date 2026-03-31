const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// 通知設定取得
router.get('/settings', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 通知設定更新（upsert）
router.put('/settings', authenticate, async (req, res) => {
  const { settings } = req.body;
  if (!Array.isArray(settings)) return res.status(400).json({ error: '設定配列が必要です' });
  try {
    const rows = settings.map(s => ({ user_id: req.user.id, event_type: s.event_type, channel: s.channel || 'email', is_enabled: s.is_enabled !== false, destination: s.destination }));
    const { data, error } = await supabaseAdmin
      .from('notification_settings')
      .upsert(rows, { onConflict: 'user_id,event_type' })
      .select();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 通知ログ取得
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 全通知を既読（/:id/readより前に配置 — Expressのルートマッチ順序）
router.put('/logs/read-all', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('notification_logs').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 通知を既読にする
router.put('/logs/:id/read', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('notification_logs').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 未読数取得
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('notification_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 通知送信ヘルパー
async function sendNotification(userId, eventType, title, body) {
  try {
    const { data: settings } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId).eq('event_type', eventType).eq('is_enabled', true).single();

    await supabaseAdmin.from('notification_logs').insert({
      user_id: userId, event_type: eventType, channel: settings?.channel || 'email', title, body,
    });
  } catch {}
}

module.exports = router;
module.exports.sendNotification = sendNotification;
