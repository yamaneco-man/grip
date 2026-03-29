const { supabaseAdmin } = require('../../config/supabase');

/**
 * イベント・予約管理サービス
 */

async function createEvent(userId, data) {
  const { data: event, error } = await supabaseAdmin
    .from('events')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      event_type: data.eventType || 'seminar',
      location_type: data.locationType || 'online',
      location_url: data.locationUrl,
      location_address: data.locationAddress,
      start_at: data.startAt,
      end_at: data.endAt,
      max_participants: data.maxParticipants,
      price: data.price || 0,
      registration_page_html: data.registrationPageHtml,
    })
    .select()
    .single();
  if (error) throw error;
  return event;
}

async function getEvents(userId) {
  const { data } = await supabaseAdmin
    .from('events')
    .select('*, event_bookings(id, status)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('start_at', { ascending: true });
  return (data || []).map(e => ({
    ...e,
    booking_count: (e.event_bookings || []).filter(b => b.status !== 'cancelled').length,
    event_bookings: undefined,
  }));
}

async function getEvent(userId, eventId) {
  const { data } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single();
  return data;
}

async function updateEvent(userId, eventId, updates) {
  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteEvent(userId, eventId) {
  await supabaseAdmin.from('events').update({ is_active: false }).eq('id', eventId).eq('user_id', userId);
}

// 予約作成
// TODO: PostgreSQL関数化して定員チェックとINSERTを原子的に処理する（TOCTOU対策）
async function createBooking(userId, eventId, data) {
  // 定員チェック
  const { data: event } = await supabaseAdmin
    .from('events').select('max_participants').eq('id', eventId).single();
  if (event?.max_participants) {
    const { count } = await supabaseAdmin
      .from('event_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'cancelled');
    if (count >= event.max_participants) throw new Error('定員に達しました');
  }

  const { data: booking, error } = await supabaseAdmin
    .from('event_bookings')
    .insert({
      event_id: eventId,
      user_id: userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      follower_id: data.followerId || null,
      payment_status: data.price > 0 ? 'pending' : 'free',
      notes: data.notes,
    })
    .select()
    .single();
  if (error) throw error;
  return booking;
}

async function getBookings(userId, eventId) {
  const { data } = await supabaseAdmin
    .from('event_bookings')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .order('booked_at', { ascending: false });
  return data || [];
}

async function updateBookingStatus(userId, bookingId, status) {
  const { data, error } = await supabaseAdmin
    .from('event_bookings')
    .update({ status })
    .eq('id', bookingId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// リマインド送信対象を取得（スケジューラー用）
async function getUpcomingReminders(userId) {
  const { data: reminders } = await supabaseAdmin
    .from('reminders')
    .select('*, events(*)')
    .eq('user_id', userId)
    .eq('is_active', true);

  const now = new Date();
  const targets = [];

  for (const reminder of (reminders || [])) {
    if (!reminder.event_id) continue;
    const event = reminder.events;
    if (!event || !event.start_at) continue;

    const eventStart = new Date(event.start_at);
    const remindAt = new Date(eventStart.getTime() - reminder.remind_before_minutes * 60000);

    // 現在時刻の前後5分以内ならリマインド対象
    if (Math.abs(now.getTime() - remindAt.getTime()) <= 300000) {
      const { data: bookings } = await supabaseAdmin
        .from('event_bookings')
        .select('*')
        .eq('event_id', reminder.event_id)
        .eq('status', 'confirmed');

      targets.push({ reminder, event, bookings: bookings || [] });
    }
  }

  return targets;
}

module.exports = {
  createEvent, getEvents, getEvent, updateEvent, deleteEvent,
  createBooking, getBookings, updateBookingStatus,
  getUpcomingReminders,
};
