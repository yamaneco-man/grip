const { supabaseAdmin } = require('../../config/supabase');

/**
 * 自動ウェビナーサービス
 * エバーグリーン / ライブ / スケジュール配信対応
 */

// ウェビナー作成
async function createWebinar(userId, data) {
  const { data: webinar, error } = await supabaseAdmin
    .from('webinars')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      video_url: data.videoUrl,
      thumbnail_url: data.thumbnailUrl,
      duration_minutes: data.durationMinutes,
      schedule_type: data.scheduleType || 'evergreen',
      available_times: data.availableTimes || [],
      registration_page_html: data.registrationPageHtml,
      thank_you_page_html: data.thankYouPageHtml,
      replay_available: data.replayAvailable !== false,
      replay_expires_hours: data.replayExpiresHours || 48,
      cta_button_text: data.ctaButtonText || '今すぐ申し込む',
      cta_button_url: data.ctaButtonUrl,
      cta_show_at_minutes: data.ctaShowAtMinutes || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return webinar;
}

async function getWebinars(userId) {
  const { data } = await supabaseAdmin
    .from('webinars')
    .select('*, webinar_registrations(id)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (data || []).map(w => ({
    ...w,
    registration_count: w.webinar_registrations?.length || 0,
    webinar_registrations: undefined,
  }));
}

async function getWebinar(userId, webinarId) {
  const { data } = await supabaseAdmin
    .from('webinars')
    .select('*')
    .eq('id', webinarId)
    .eq('user_id', userId)
    .single();
  return data;
}

async function updateWebinar(userId, webinarId, updates) {
  const { data, error } = await supabaseAdmin
    .from('webinars')
    .update(updates)
    .eq('id', webinarId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteWebinar(userId, webinarId) {
  await supabaseAdmin.from('webinars').update({ is_active: false }).eq('id', webinarId).eq('user_id', userId);
}

// ウェビナー登録
async function registerForWebinar(userId, webinarId, data) {
  const { data: registration, error } = await supabaseAdmin
    .from('webinar_registrations')
    .insert({
      webinar_id: webinarId,
      user_id: userId,
      name: data.name,
      email: data.email,
      follower_id: data.followerId || null,
      scheduled_at: data.scheduledAt || null,
    })
    .select()
    .single();
  if (error) throw error;
  return registration;
}

async function getRegistrations(userId, webinarId) {
  const { data } = await supabaseAdmin
    .from('webinar_registrations')
    .select('*')
    .eq('webinar_id', webinarId)
    .eq('user_id', userId)
    .order('registered_at', { ascending: false });
  return data || [];
}

// ウェビナー参加記録
async function recordAttendance(registrationId, durationMinutes, clickedCta) {
  await supabaseAdmin.from('webinar_registrations').update({
    attended: true,
    attended_duration_minutes: durationMinutes,
    clicked_cta: clickedCta || false,
  }).eq('id', registrationId);
}

// エバーグリーン: 次の利用可能な時間枠を取得
function getNextAvailableTimes(webinar, count = 3) {
  if (webinar.schedule_type !== 'evergreen') return [];
  const now = new Date();
  const times = [];
  const availableTimes = webinar.available_times || [];

  if (availableTimes.length === 0) {
    // デフォルト: 30分後、1時間後、翌日
    for (let i = 0; i < count; i++) {
      const t = new Date(now.getTime() + (30 + i * 30) * 60000);
      t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15, 0, 0);
      times.push(t.toISOString());
    }
  } else {
    // 設定された時間枠から次のものを取得
    for (let dayOffset = 0; dayOffset < 7 && times.length < count; dayOffset++) {
      for (const time of availableTimes) {
        const [hours, minutes] = time.split(':').map(Number);
        const candidate = new Date(now);
        candidate.setDate(candidate.getDate() + dayOffset);
        candidate.setHours(hours, minutes, 0, 0);
        if (candidate > now) {
          times.push(candidate.toISOString());
          if (times.length >= count) break;
        }
      }
    }
  }

  return times;
}

// ウェビナー統計
async function getWebinarStats(userId, webinarId) {
  const { data: registrations } = await supabaseAdmin
    .from('webinar_registrations')
    .select('attended, attended_duration_minutes, clicked_cta')
    .eq('webinar_id', webinarId)
    .eq('user_id', userId);

  const total = registrations?.length || 0;
  const attended = (registrations || []).filter(r => r.attended).length;
  const clickedCta = (registrations || []).filter(r => r.clicked_cta).length;
  const avgDuration = attended > 0
    ? Math.round((registrations || []).filter(r => r.attended).reduce((sum, r) => sum + (r.attended_duration_minutes || 0), 0) / attended)
    : 0;

  return {
    totalRegistrations: total,
    totalAttended: attended,
    attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
    ctaClickRate: attended > 0 ? Math.round((clickedCta / attended) * 100) : 0,
    avgWatchDuration: avgDuration,
  };
}

module.exports = {
  createWebinar, getWebinars, getWebinar, updateWebinar, deleteWebinar,
  registerForWebinar, getRegistrations, recordAttendance,
  getNextAvailableTimes, getWebinarStats,
};
