const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// === 予約枠管理 ===

// 予約枠一覧
router.get('/slots', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('calendar_slots')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_time');
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 予約枠作成
router.post('/slots', authenticate, async (req, res) => {
  const { title, day_of_week, specific_date, start_time, end_time, max_bookings } = req.body;
  if (!start_time || !end_time) return res.status(400).json({ error: '開始時間と終了時間は必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('calendar_slots')
      .insert({ user_id: req.user.id, title: title || '予約枠', day_of_week, specific_date, start_time, end_time, max_bookings: max_bookings || 1 })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 予約枠更新
router.put('/slots/:id', authenticate, async (req, res) => {
  try {
    const { title, day_of_week, specific_date, start_time, end_time, max_bookings, is_active } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (day_of_week !== undefined) updates.day_of_week = day_of_week;
    if (specific_date !== undefined) updates.specific_date = specific_date;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (max_bookings !== undefined) updates.max_bookings = max_bookings;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabaseAdmin
      .from('calendar_slots').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 予約枠削除
router.delete('/slots/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('calendar_slots').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// === 予約管理 ===

// 予約一覧
router.get('/bookings', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('calendar_bookings')
      .select('*, calendar_slots(title, start_time, end_time), line_followers(display_name)')
      .eq('user_id', req.user.id)
      .order('booking_date', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 空き状況確認（公開エンドポイント）
router.get('/availability/:userId', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: '日付を指定してください' });
  try {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const { data: slots } = await supabaseAdmin
      .from('calendar_slots')
      .select('*')
      .eq('user_id', req.params.userId)
      .eq('is_active', true)
      .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${date}`);

    const available = [];
    for (const slot of (slots || [])) {
      const { count } = await supabaseAdmin
        .from('calendar_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('slot_id', slot.id)
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if ((count || 0) < slot.max_bookings) {
        available.push({ ...slot, remaining: slot.max_bookings - (count || 0) });
      }
    }
    res.json(available);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 予約作成（公開エンドポイント）
router.post('/book/:userId', async (req, res) => {
  const { slot_id, booking_date, guest_name, guest_email, guest_phone, follower_id, notes } = req.body;
  if (!slot_id || !booking_date) return res.status(400).json({ error: '予約枠IDと日付は必須です' });
  if (guest_name && guest_name.length > 100) return res.status(400).json({ error: '名前は100文字以内です' });
  if (guest_email && (guest_email.length > 254 || !guest_email.includes('@'))) return res.status(400).json({ error: 'メールアドレスの形式が不正です' });
  if (guest_phone && guest_phone.length > 20) return res.status(400).json({ error: '電話番号は20文字以内です' });
  if (notes && notes.length > 1000) return res.status(400).json({ error: '備考は1000文字以内です' });
  try {
    const { data: slot } = await supabaseAdmin
      .from('calendar_slots').select('*')
      .eq('id', slot_id).eq('user_id', req.params.userId).eq('is_active', true).single();
    if (!slot) return res.status(404).json({ error: '予約枠が見つかりません' });

    const { count } = await supabaseAdmin
      .from('calendar_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('slot_id', slot_id).eq('booking_date', booking_date).neq('status', 'cancelled');
    if ((count || 0) >= slot.max_bookings) return res.status(409).json({ error: 'この枠は満席です' });

    const { data, error } = await supabaseAdmin
      .from('calendar_bookings')
      .insert({ slot_id, user_id: req.params.userId, follower_id, booking_date, guest_name, guest_email, guest_phone, notes })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 予約ステータス更新
router.put('/bookings/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  try {
    const { data, error } = await supabaseAdmin
      .from('calendar_bookings').update({ status })
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
