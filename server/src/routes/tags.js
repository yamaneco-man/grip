const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// タグ一覧取得
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('*, follower_tags(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tags = (data || []).map(t => ({
      ...t,
      follower_count: t.follower_tags?.[0]?.count || 0,
    }));
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// タグ作成
router.post('/', authenticate, async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'タグ名は必須です' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .insert({ user_id: req.user.id, name: name.trim(), color: color || '#6366f1' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '同名のタグが既に存在します' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// タグ更新
router.put('/:id', authenticate, async (req, res) => {
  const { name, color } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .update({ name, color })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'タグが見つかりません' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// タグ削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('tags')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// フォロワーにタグ付与
router.post('/assign', authenticate, async (req, res) => {
  const { followerId, tagId } = req.body;
  if (!followerId || !tagId) {
    return res.status(400).json({ error: 'followerId と tagId は必須です' });
  }

  try {
    // 所有権チェック
    const { data: tag } = await supabaseAdmin
      .from('tags').select('id').eq('id', tagId).eq('user_id', req.user.id).single();
    if (!tag) return res.status(404).json({ error: 'タグが見つかりません' });

    const { data: follower } = await supabaseAdmin
      .from('line_followers').select('id').eq('id', followerId).eq('user_id', req.user.id).single();
    if (!follower) return res.status(404).json({ error: 'フォロワーが見つかりません' });

    const { data, error } = await supabaseAdmin
      .from('follower_tags')
      .insert({ follower_id: followerId, tag_id: tagId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: '既にタグが付与されています' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// フォロワーからタグ解除
router.delete('/assign/:followerId/:tagId', authenticate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('follower_tags')
      .delete()
      .eq('follower_id', req.params.followerId)
      .eq('tag_id', req.params.tagId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// フォロワーのタグ一覧取得
router.get('/follower/:followerId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('follower_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('follower_id', req.params.followerId);

    if (error) throw error;
    res.json((data || []).map(ft => ft.tags));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// セグメント配信: タグ条件でフォロワーを絞り込みメッセージ送信
router.post('/segment-send', authenticate, async (req, res) => {
  const { tagIds, message, matchAll } = req.body;
  if (!tagIds?.length || !message) {
    return res.status(400).json({ error: 'tagIds と message は必須です' });
  }

  try {
    // タグの所有権チェック
    const { data: ownedTags } = await supabaseAdmin
      .from('tags').select('id').eq('user_id', req.user.id).in('id', tagIds);
    if (!ownedTags || ownedTags.length !== tagIds.length) {
      return res.status(403).json({ error: '指定されたタグの一部が見つかりません' });
    }

    // タグ条件に合致するフォロワーを取得
    const { data: taggedFollowers } = await supabaseAdmin
      .from('follower_tags')
      .select('follower_id, tag_id')
      .in('tag_id', tagIds);

    if (!taggedFollowers?.length) {
      return res.json({ sent: 0, message: '該当するフォロワーがいません' });
    }

    // matchAll: 全タグを持つフォロワーのみ / false: いずれかのタグ
    const followerTagMap = {};
    taggedFollowers.forEach(ft => {
      if (!followerTagMap[ft.follower_id]) followerTagMap[ft.follower_id] = new Set();
      followerTagMap[ft.follower_id].add(ft.tag_id);
    });

    const targetFollowerIds = Object.entries(followerTagMap)
      .filter(([, tags]) => matchAll ? tagIds.every(id => tags.has(id)) : true)
      .map(([id]) => id);

    if (!targetFollowerIds.length) {
      return res.json({ sent: 0, message: '該当するフォロワーがいません' });
    }

    // フォロワーのLINE IDを取得
    const { data: followers } = await supabaseAdmin
      .from('line_followers')
      .select('id, line_user_id')
      .eq('user_id', req.user.id)
      .eq('is_blocked', false)
      .in('id', targetFollowerIds);

    if (!followers?.length) {
      return res.json({ sent: 0, message: 'アクティブなフォロワーがいません' });
    }

    // ユーザーのLINE設定を取得
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('line_channel_access_token')
      .eq('id', req.user.id)
      .single();

    if (!user?.line_channel_access_token) {
      return res.status(400).json({ error: 'LINE公式アカウントが連携されていません' });
    }

    // LINE Messaging APIで送信
    const { Client: LineClient } = require('@line/bot-sdk');
    const lineClient = new LineClient({ channelAccessToken: user.line_channel_access_token });

    let sent = 0;
    for (const follower of followers) {
      try {
        await lineClient.pushMessage(follower.line_user_id, { type: 'text', text: message });
        sent++;

        // メッセージログ保存
        await supabaseAdmin.from('messages').insert({
          follower_id: follower.id,
          direction: 'outgoing',
          content: message,
        });
      } catch (e) {
        console.error(`セグメント配信エラー (${follower.line_user_id}):`, e.message);
      }
    }

    res.json({ sent, total: followers.length, message: `${sent}名に送信しました` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
