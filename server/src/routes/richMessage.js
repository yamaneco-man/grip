const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendMessages, sendConditionalMessage, buildMessage } = require('../services/line/richMessage');
const { supabaseAdmin } = require('../config/supabase');

// リッチメッセージ送信（個別）
router.post('/send', authenticate, async (req, res) => {
  try {
    const { followerId, messages } = req.body;
    if (!followerId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'followerId と messages（配列）が必要です' });
    }

    const { data: follower } = await supabaseAdmin
      .from('line_followers')
      .select('follower_line_id')
      .eq('id', followerId)
      .eq('user_id', req.user.id)
      .single();
    if (!follower) return res.status(404).json({ error: 'フォロワーが見つかりません' });

    const sent = await sendMessages(follower.follower_line_id, messages);

    // メッセージログ
    for (const msg of messages) {
      await supabaseAdmin.from('messages').insert({
        follower_id: followerId,
        direction: 'out',
        content: JSON.stringify(msg),
      });
    }

    res.json({ sent: sent.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// リッチメッセージ一斉配信
router.post('/broadcast', authenticate, async (req, res) => {
  try {
    const { messages, tagIds, matchAll } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages（配列）が必要です' });
    }

    let query = supabaseAdmin
      .from('line_followers')
      .select('id, follower_line_id')
      .eq('user_id', req.user.id)
      .eq('is_blocked', false);

    const { data: followers } = await query;

    // タグフィルタ
    let targetFollowers = followers || [];
    if (tagIds && tagIds.length > 0) {
      const { data: taggedFollowers } = await supabaseAdmin
        .from('follower_tags')
        .select('follower_id')
        .in('tag_id', tagIds);
      const taggedIds = new Set((taggedFollowers || []).map(t => t.follower_id));
      targetFollowers = targetFollowers.filter(f => taggedIds.has(f.id));
    }

    let sentCount = 0;
    for (const follower of targetFollowers) {
      try {
        await sendMessages(follower.follower_line_id, messages);
        sentCount++;
      } catch (e) {
        console.error(`送信失敗: ${follower.follower_line_id}`, e.message);
      }
      // レート制限対策
      await new Promise(r => setTimeout(r, 50));
    }

    res.json({ sent: sentCount, total: targetFollowers.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 条件分岐メッセージ CRUD
router.get('/conditional', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('conditional_messages')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/conditional', authenticate, async (req, res) => {
  try {
    const { name, conditions, default_message, is_active } = req.body;
    if (!name) return res.status(400).json({ error: 'name は必須です' });
    const { data, error } = await supabaseAdmin
      .from('conditional_messages')
      .insert({ user_id: req.user.id, name, conditions: conditions || [], default_message: default_message || {}, is_active: is_active !== false })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/conditional/:id', authenticate, async (req, res) => {
  try {
    const { name, conditions, default_message, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (conditions !== undefined) updates.conditions = conditions;
    if (default_message !== undefined) updates.default_message = default_message;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabaseAdmin
      .from('conditional_messages')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/conditional/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin
      .from('conditional_messages')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 条件分岐メッセージ送信
router.post('/conditional/:id/send', authenticate, async (req, res) => {
  try {
    const result = await sendConditionalMessage(req.body.followerId, req.params.id, req.user.id);
    res.json({ sent: true, message: result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// メッセージプレビュー
router.post('/preview', authenticate, async (req, res) => {
  try {
    const built = buildMessage(req.body);
    res.json(built);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
