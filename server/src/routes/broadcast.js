const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// 一斉配信一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('broadcasts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 一斉配信作成
router.post('/', authenticate, async (req, res) => {
  const { title, message_type, content, target_type, target_tag_ids, target_match_all, scheduled_at } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'タイトルと内容は必須です' });
  try {
    const status = scheduled_at ? 'scheduled' : 'draft';
    const { data, error } = await supabaseAdmin
      .from('broadcasts')
      .insert({ user_id: req.user.id, title, message_type: message_type || 'text', content, target_type: target_type || 'all', target_tag_ids, target_match_all, scheduled_at, status })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 一斉配信実行
router.post('/:id/send', authenticate, async (req, res) => {
  try {
    const { data: broadcast } = await supabaseAdmin
      .from('broadcasts').select('*')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!broadcast) return res.status(404).json({ error: '配信が見つかりません' });
    if (broadcast.status === 'sent') return res.status(400).json({ error: '既に送信済みです' });

    await supabaseAdmin.from('broadcasts').update({ status: 'sending' }).eq('id', broadcast.id);

    // ターゲット取得
    let followerQuery = supabaseAdmin
      .from('line_followers')
      .select('id, line_user_id')
      .eq('user_id', req.user.id)
      .eq('is_blocked', false);

    if (broadcast.target_type === 'tag' && broadcast.target_tag_ids?.length) {
      const { data: tagged } = await supabaseAdmin
        .from('follower_tags').select('follower_id, tag_id')
        .in('tag_id', broadcast.target_tag_ids);
      if (tagged?.length) {
        const followerMap = {};
        tagged.forEach(t => {
          if (!followerMap[t.follower_id]) followerMap[t.follower_id] = new Set();
          followerMap[t.follower_id].add(t.tag_id);
        });
        const ids = Object.entries(followerMap)
          .filter(([, tags]) => broadcast.target_match_all
            ? broadcast.target_tag_ids.every(id => tags.has(id)) : true)
          .map(([id]) => id);
        followerQuery = followerQuery.in('id', ids);
      }
    }

    const { data: followers } = await followerQuery;
    if (!followers?.length) {
      await supabaseAdmin.from('broadcasts').update({ status: 'sent', sent_count: 0, sent_at: new Date().toISOString() }).eq('id', broadcast.id);
      return res.json({ sent: 0, message: '対象フォロワーがいません' });
    }

    const { data: user } = await supabaseAdmin
      .from('users').select('line_channel_access_token').eq('id', req.user.id).single();
    if (!user?.line_channel_access_token) {
      return res.status(400).json({ error: 'LINE公式アカウントが連携されていません' });
    }

    const { Client: LineClient } = require('@line/bot-sdk');
    const lineClient = new LineClient({ channelAccessToken: user.line_channel_access_token });

    let sent = 0, failed = 0;
    const messageContent = broadcast.content;
    const messages = broadcast.message_type === 'text'
      ? [{ type: 'text', text: messageContent.text || messageContent }]
      : Array.isArray(messageContent) ? messageContent : [messageContent];

    for (const f of followers) {
      try {
        await lineClient.pushMessage(f.line_user_id, messages);
        sent++;
        await supabaseAdmin.from('messages').insert({
          follower_id: f.id, direction: 'outgoing',
          content: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
        });
      } catch { failed++; }
    }

    await supabaseAdmin.from('broadcasts').update({
      status: 'sent', sent_count: sent, failed_count: failed, sent_at: new Date().toISOString(),
    }).eq('id', broadcast.id);

    res.json({ sent, failed, total: followers.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 配信削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('broadcasts').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
