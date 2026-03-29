const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const eventService = require('../services/event/eventManager');
const { supabaseAdmin } = require('../config/supabase');

// イベント CRUD
router.get('/', authenticate, async (req, res) => {
  try { res.json(await eventService.getEvents(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try { res.status(201).json(await eventService.createEvent(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await eventService.getEvent(req.user.id, req.params.id);
    if (!event) return res.status(404).json({ error: 'イベントが見つかりません' });
    res.json(event);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try { res.json(await eventService.updateEvent(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try { await eventService.deleteEvent(req.user.id, req.params.id); res.json({ success: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// 予約管理
router.get('/:id/bookings', authenticate, async (req, res) => {
  try { res.json(await eventService.getBookings(req.user.id, req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/book', authenticate, async (req, res) => {
  try { res.status(201).json(await eventService.createBooking(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/bookings/:bookingId/status', authenticate, async (req, res) => {
  try { res.json(await eventService.updateBookingStatus(req.user.id, req.params.bookingId, req.body.status)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// リマインド設定
router.get('/reminders', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('reminders')
      .select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reminders', authenticate, async (req, res) => {
  try {
    const { event_id, name, message, remind_before_minutes, channel, is_active } = req.body;
    const { data, error } = await supabaseAdmin.from('reminders')
      .insert({ user_id: req.user.id, event_id, name, message, remind_before_minutes, channel, is_active }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/reminders/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('reminders').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
