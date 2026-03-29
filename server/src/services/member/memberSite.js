const { supabaseAdmin } = require('../../config/supabase');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

/**
 * 会員サイトサービス
 * コース・レッスン管理、ドリップ配信、会員認証
 */

// ── 会員サイト管理 ──

async function createSite(userId, data) {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data: site, error } = await supabaseAdmin
    .from('member_sites')
    .insert({ user_id: userId, name: data.name, slug, description: data.description, theme_color: data.themeColor })
    .select()
    .single();
  if (error) throw error;
  return site;
}

async function getSites(userId) {
  const { data } = await supabaseAdmin
    .from('member_sites')
    .select('*, courses(id, name, is_published)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

async function updateSite(userId, siteId, updates) {
  const { data, error } = await supabaseAdmin
    .from('member_sites')
    .update(updates)
    .eq('id', siteId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── コース管理 ──

async function createCourse(userId, siteId, data) {
  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .insert({
      site_id: siteId,
      user_id: userId,
      name: data.name,
      description: data.description,
      thumbnail_url: data.thumbnailUrl,
      price: data.price || 0,
      sort_order: data.sortOrder || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return course;
}

async function getCourses(userId, siteId) {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('*, lessons(id, title, sort_order, is_published, drip_delay_days)')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .order('sort_order');
  return data || [];
}

async function updateCourse(userId, courseId, updates) {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCourse(userId, courseId) {
  await supabaseAdmin.from('courses').delete().eq('id', courseId).eq('user_id', userId);
}

// ── レッスン管理 ──

async function createLesson(userId, courseId, data) {
  // コース所有者確認
  const { data: course } = await supabaseAdmin
    .from('courses').select('user_id').eq('id', courseId).single();
  if (!course || course.user_id !== userId) throw new Error('コースへのアクセス権がありません');

  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      course_id: courseId,
      title: data.title,
      content_html: data.contentHtml,
      video_url: data.videoUrl,
      video_type: data.videoType,
      attachment_urls: data.attachmentUrls || [],
      sort_order: data.sortOrder || 0,
      is_free_preview: data.isFreePreview || false,
      drip_delay_days: data.dripDelayDays || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return lesson;
}

async function getLessons(userId, courseId) {
  // コース所有者確認
  const { data: course } = await supabaseAdmin
    .from('courses').select('user_id').eq('id', courseId).single();
  if (!course || course.user_id !== userId) throw new Error('コースへのアクセス権がありません');

  const { data } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order');
  return data || [];
}

async function updateLesson(userId, lessonId, updates) {
  // レッスン→コース→user_idチェーン検証
  const { data: lesson } = await supabaseAdmin
    .from('lessons').select('course_id').eq('id', lessonId).single();
  if (!lesson) throw new Error('レッスンが見つかりません');
  const { data: course } = await supabaseAdmin
    .from('courses').select('user_id').eq('id', lesson.course_id).single();
  if (!course || course.user_id !== userId) throw new Error('コースへのアクセス権がありません');

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteLesson(userId, lessonId) {
  // レッスン→コース→user_idチェーン検証
  const { data: lesson } = await supabaseAdmin
    .from('lessons').select('course_id').eq('id', lessonId).single();
  if (!lesson) throw new Error('レッスンが見つかりません');
  const { data: course } = await supabaseAdmin
    .from('courses').select('user_id').eq('id', lesson.course_id).single();
  if (!course || course.user_id !== userId) throw new Error('コースへのアクセス権がありません');

  await supabaseAdmin.from('lessons').delete().eq('id', lessonId);
}

// ── 会員管理 ──

async function createMember(siteId, data) {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const { data: member, error } = await supabaseAdmin
    .from('members')
    .insert({
      site_id: siteId,
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      follower_id: data.followerId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return member;
}

async function authenticateMember(siteId, email, password) {
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('site_id', siteId)
    .eq('email', email)
    .eq('status', 'active')
    .single();
  if (!member) throw new Error('メールアドレスまたはパスワードが正しくありません');
  const isValid = await bcrypt.compare(password, member.password_hash);
  if (!isValid) throw new Error('メールアドレスまたはパスワードが正しくありません');

  await supabaseAdmin.from('members').update({ last_login_at: new Date().toISOString() }).eq('id', member.id);
  return member;
}

async function getMembers(siteId) {
  const { data } = await supabaseAdmin
    .from('members')
    .select('*, member_courses(course_id, granted_at)')
    .eq('site_id', siteId)
    .order('enrolled_at', { ascending: false });
  return data || [];
}

// ── コースアクセス権付与 ──

async function grantCourseAccess(memberId, courseId, expiresAt) {
  const { data, error } = await supabaseAdmin
    .from('member_courses')
    .upsert({ member_id: memberId, course_id: courseId, expires_at: expiresAt || null }, { onConflict: 'member_id,course_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 購入時の自動アカウント発行 + コースアクセス権付与
async function autoProvisionMember(siteId, courseId, email, name, followerId) {
  // 既存会員チェック
  let { data: member } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('site_id', siteId)
    .eq('email', email)
    .single();

  if (!member) {
    const tempPassword = crypto.randomBytes(8).toString('hex');
    member = await createMember(siteId, { email, password: tempPassword, name, followerId });
    // パスワード通知（LINE or メール）はcaller側で行う
    member._tempPassword = tempPassword;
  }

  await grantCourseAccess(member.id, courseId);
  return member;
}

// ── レッスン進捗 ──

async function getAccessibleLessons(memberId, courseId) {
  // 会員のコースアクセス権確認
  const { data: access } = await supabaseAdmin
    .from('member_courses')
    .select('granted_at, expires_at')
    .eq('member_id', memberId)
    .eq('course_id', courseId)
    .single();

  if (!access) throw new Error('このコースへのアクセス権がありません');
  if (access.expires_at && new Date(access.expires_at) < new Date()) {
    throw new Error('コースの有効期限が切れています');
  }

  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('sort_order');

  // ドリップ制御: 登録日からの経過日数でフィルタ
  const grantedAt = new Date(access.granted_at);
  const daysSinceGrant = Math.floor((Date.now() - grantedAt.getTime()) / 86400000);

  const accessible = (lessons || []).map(lesson => ({
    ...lesson,
    is_locked: lesson.drip_delay_days > daysSinceGrant && !lesson.is_free_preview,
    unlocks_in_days: Math.max(0, lesson.drip_delay_days - daysSinceGrant),
  }));

  // 進捗情報を付与
  const { data: progress } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, completed, bookmarked, last_position_seconds')
    .eq('member_id', memberId);

  const progressMap = {};
  (progress || []).forEach(p => { progressMap[p.lesson_id] = p; });

  return accessible.map(lesson => ({
    ...lesson,
    progress: progressMap[lesson.id] || { completed: false, bookmarked: false, last_position_seconds: 0 },
  }));
}

async function updateLessonProgress(memberId, lessonId, data) {
  const { data: progress, error } = await supabaseAdmin
    .from('lesson_progress')
    .upsert({
      member_id: memberId,
      lesson_id: lessonId,
      completed: data.completed || false,
      completed_at: data.completed ? new Date().toISOString() : null,
      bookmarked: data.bookmarked || false,
      last_position_seconds: data.lastPositionSeconds || 0,
    }, { onConflict: 'member_id,lesson_id' })
    .select()
    .single();
  if (error) throw error;
  return progress;
}

module.exports = {
  createSite, getSites, updateSite,
  createCourse, getCourses, updateCourse, deleteCourse,
  createLesson, getLessons, updateLesson, deleteLesson,
  createMember, authenticateMember, getMembers,
  grantCourseAccess, autoProvisionMember,
  getAccessibleLessons, updateLessonProgress,
};
