const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// アクション一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('scheduled_actions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// アクション作成
router.post('/', authenticate, async (req, res) => {
  const { name, action_type, action_config, trigger_type, trigger_config, target_type, target_config } = req.body;
  if (!name || !action_type) return res.status(400).json({ error: '名前とアクションタイプは必須です' });

  let next_execution_at = null;
  if (trigger_type === 'datetime' && trigger_config?.datetime) {
    next_execution_at = trigger_config.datetime;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('scheduled_actions')
      .insert({ user_id: req.user.id, name, action_type, action_config: action_config || {}, trigger_type: trigger_type || 'datetime', trigger_config: trigger_config || {}, target_type: target_type || 'all', target_config: target_config || {}, next_execution_at })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// アクション更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, action_type, action_config, trigger_type, trigger_config, target_type, target_config, status } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (action_type !== undefined) updates.action_type = action_type;
    if (action_config !== undefined) updates.action_config = action_config;
    if (trigger_type !== undefined) updates.trigger_type = trigger_type;
    if (trigger_config !== undefined) updates.trigger_config = trigger_config;
    if (target_type !== undefined) updates.target_type = target_type;
    if (target_config !== undefined) updates.target_config = target_config;
    if (status !== undefined) updates.status = status;
    const { data, error } = await supabaseAdmin
      .from('scheduled_actions').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// アクション削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('scheduled_actions').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// アクションログ取得
router.get('/:id/logs', authenticate, async (req, res) => {
  try {
    const { data: action } = await supabaseAdmin.from('scheduled_actions').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!action) return res.status(404).json({ error: 'アクションが見つかりません' });

    const { data, error } = await supabaseAdmin
      .from('action_logs').select('*')
      .eq('action_id', req.params.id)
      .order('executed_at', { ascending: false }).limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// スケジューラーからの実行エンドポイント
router.post('/execute', async (req, res) => {
  const schedulerKey = req.headers['x-scheduler-key'];
  if (!process.env.SCHEDULER_KEY || schedulerKey !== process.env.SCHEDULER_KEY) {
    return res.status(401).json({ error: '認証エラー' });
  }

  try {
    const now = new Date();
    const { data: actions } = await supabaseAdmin
      .from('scheduled_actions')
      .select('*')
      .eq('status', 'active')
      .lte('next_execution_at', now.toISOString());

    if (!actions?.length) return res.json({ executed: 0 });

    let executed = 0;
    for (const action of actions) {
      try {
        // ターゲットフォロワー取得
        let followers = [];
        if (action.target_type === 'all') {
          const { data } = await supabaseAdmin.from('line_followers').select('id, line_user_id').eq('user_id', action.user_id).eq('is_blocked', false);
          followers = data || [];
        } else if (action.target_type === 'tag' && action.target_config?.tag_ids?.length) {
          const { data: tagged } = await supabaseAdmin.from('follower_tags').select('follower_id').in('tag_id', action.target_config.tag_ids);
          const ids = [...new Set((tagged || []).map(t => t.follower_id))];
          if (ids.length) {
            const { data } = await supabaseAdmin.from('line_followers').select('id, line_user_id').eq('user_id', action.user_id).eq('is_blocked', false).in('id', ids);
            followers = data || [];
          }
        }

        let successCount = 0, errorCount = 0;

        // アクション実行
        switch (action.action_type) {
          case 'send_message': {
            const { data: user } = await supabaseAdmin.from('users').select('line_channel_access_token').eq('id', action.user_id).single();
            if (user?.line_channel_access_token) {
              const { Client: LineClient } = require('@line/bot-sdk');
              const lineClient = new LineClient({ channelAccessToken: user.line_channel_access_token });
              for (const f of followers) {
                try {
                  await lineClient.pushMessage(f.line_user_id, { type: 'text', text: action.action_config.message });
                  successCount++;
                } catch { errorCount++; }
              }
            }
            break;
          }
          case 'add_tag': {
            const tagId = action.action_config.tag_id;
            for (const f of followers) {
              try {
                await supabaseAdmin.from('follower_tags').insert({ follower_id: f.id, tag_id: tagId }).catch(() => {});
                successCount++;
              } catch { errorCount++; }
            }
            break;
          }
          case 'remove_tag': {
            const tagId = action.action_config.tag_id;
            for (const f of followers) {
              try {
                await supabaseAdmin.from('follower_tags').delete().eq('follower_id', f.id).eq('tag_id', tagId);
                successCount++;
              } catch { errorCount++; }
            }
            break;
          }
        }

        // ログ記録
        await supabaseAdmin.from('action_logs').insert({
          action_id: action.id, target_count: followers.length, success_count: successCount, error_count: errorCount,
        });

        // 次回実行日時の計算
        let nextExec = null;
        if (action.trigger_type === 'cron' && action.trigger_config?.interval_hours) {
          nextExec = new Date(now.getTime() + action.trigger_config.interval_hours * 3600000).toISOString();
        }

        await supabaseAdmin.from('scheduled_actions').update({
          last_executed_at: now.toISOString(),
          execution_count: (action.execution_count || 0) + 1,
          next_execution_at: nextExec,
          status: nextExec ? 'active' : 'completed',
        }).eq('id', action.id);

        executed++;
      } catch (e) {
        console.error(`アクション実行エラー (${action.id}):`, e.message);
        await supabaseAdmin.from('action_logs').insert({ action_id: action.id, errors: [{ error: e.message }] });
      }
    }

    res.json({ executed, total: actions.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
