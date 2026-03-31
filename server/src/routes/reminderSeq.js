const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// リマインダ一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reminder_sequences')
      .select('*, events(title)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// リマインダ作成
router.post('/', authenticate, async (req, res) => {
  const { name, event_id, steps } = req.body;
  if (!name || !steps?.length) return res.status(400).json({ error: '名前とステップは必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('reminder_sequences')
      .insert({ user_id: req.user.id, name, event_id, steps })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// リマインダ更新
router.put('/:id', authenticate, async (req, res) => {
  const { name, event_id, steps, is_active } = req.body;
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (event_id !== undefined) updates.event_id = event_id;
    if (steps !== undefined) updates.steps = steps;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('reminder_sequences').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// リマインダ削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('reminder_sequences').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// リマインダ実行（スケジューラーから呼ばれる）
router.post('/execute', async (req, res) => {
  const schedulerKey = req.headers['x-scheduler-key'];
  if (!process.env.SCHEDULER_KEY || schedulerKey !== process.env.SCHEDULER_KEY) {
    return res.status(401).json({ error: '認証エラー' });
  }

  try {
    const { data: sequences } = await supabaseAdmin
      .from('reminder_sequences')
      .select('*, events(start_date)')
      .eq('is_active', true);

    if (!sequences?.length) return res.json({ processed: 0 });

    let totalSent = 0;
    const now = new Date();

    for (const seq of sequences) {
      const eventDate = seq.events?.start_date ? new Date(seq.events.start_date) : null;
      if (!eventDate) continue;

      for (let i = 0; i < seq.steps.length; i++) {
        const step = seq.steps[i];
        const daysBeforeEvent = step.days_before || 0;
        const sendDate = new Date(eventDate);
        sendDate.setDate(sendDate.getDate() - daysBeforeEvent);

        if (sendDate.toDateString() !== now.toDateString()) continue;

        // イベント予約者を取得
        const { data: bookings } = await supabaseAdmin
          .from('event_bookings')
          .select('follower_id, line_followers(line_user_id)')
          .eq('event_id', seq.event_id)
          .eq('status', 'confirmed');

        if (!bookings?.length) continue;

        const { data: user } = await supabaseAdmin
          .from('users').select('line_channel_access_token').eq('id', seq.user_id).single();
        if (!user?.line_channel_access_token) continue;

        const { Client: LineClient } = require('@line/bot-sdk');
        const lineClient = new LineClient({ channelAccessToken: user.line_channel_access_token });

        for (const booking of bookings) {
          if (!booking.follower_id || !booking.line_followers?.line_user_id) continue;

          // 送信済みチェック
          const { data: existing } = await supabaseAdmin
            .from('reminder_logs')
            .select('id')
            .eq('sequence_id', seq.id)
            .eq('follower_id', booking.follower_id)
            .eq('step_index', i)
            .single();
          if (existing) continue;

          try {
            const msg = step.message.replace('{event_name}', seq.name).replace('{days}', daysBeforeEvent);
            await lineClient.pushMessage(booking.line_followers.line_user_id, { type: 'text', text: msg });
            await supabaseAdmin.from('reminder_logs').insert({ sequence_id: seq.id, follower_id: booking.follower_id, step_index: i });
            totalSent++;
          } catch (e) { console.error('リマインダ送信エラー:', e.message); }
        }
      }
    }
    res.json({ processed: sequences.length, sent: totalSent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
