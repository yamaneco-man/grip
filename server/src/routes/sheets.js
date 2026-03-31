const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// 連携一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sheet_connections')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 連携作成
router.post('/', authenticate, async (req, res) => {
  const { name, spreadsheet_id, sheet_name, data_type, sync_frequency } = req.body;
  if (!name || !spreadsheet_id) return res.status(400).json({ error: '名前とスプレッドシートIDは必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('sheet_connections')
      .insert({ user_id: req.user.id, name, spreadsheet_id, sheet_name: sheet_name || 'Sheet1', data_type: data_type || 'followers', sync_frequency: sync_frequency || 'daily' })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 連携更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, spreadsheet_id, sheet_name, data_type, sync_frequency, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (spreadsheet_id !== undefined) updates.spreadsheet_id = spreadsheet_id;
    if (sheet_name !== undefined) updates.sheet_name = sheet_name;
    if (data_type !== undefined) updates.data_type = data_type;
    if (sync_frequency !== undefined) updates.sync_frequency = sync_frequency;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabaseAdmin
      .from('sheet_connections').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 連携削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('sheet_connections').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 手動同期実行
router.post('/:id/sync', authenticate, async (req, res) => {
  try {
    const { data: conn } = await supabaseAdmin
      .from('sheet_connections').select('*')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!conn) return res.status(404).json({ error: '連携が見つかりません' });

    // データ取得
    let exportData = [];
    switch (conn.data_type) {
      case 'followers': {
        const { data } = await supabaseAdmin.from('line_followers')
          .select('display_name, follower_line_id, source_channel, registered_at, is_blocked')
          .eq('user_id', req.user.id);
        exportData = data || [];
        break;
      }
      case 'messages': {
        const { data: myFollowers } = await supabaseAdmin.from('line_followers')
          .select('id').eq('user_id', req.user.id);
        const followerIds = (myFollowers || []).map(f => f.id);
        const { data } = followerIds.length
          ? await supabaseAdmin.from('messages')
              .select('follower_id, direction, content, emotion_score, created_at')
              .in('follower_id', followerIds)
              .limit(5000)
          : { data: [] };
        exportData = data || [];
        break;
      }
      case 'orders': {
        const { data } = await supabaseAdmin.from('orders')
          .select('*').eq('user_id', req.user.id);
        exportData = data || [];
        break;
      }
      default:
        exportData = [];
    }

    await supabaseAdmin.from('sheet_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', conn.id);

    res.json({ synced: true, rows: exportData.length, data: exportData, message: `${exportData.length}行のデータを取得しました。スプレッドシートへの書き込みはGoogle Sheets APIの設定が必要です。` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
