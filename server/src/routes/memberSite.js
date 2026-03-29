const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const memberService = require('../services/member/memberSite');
const { generateLessonContent } = require('../services/ai/aiExtended');

// ── 会員サイト ──

router.get('/sites', authenticate, async (req, res) => {
  try { res.json(await memberService.getSites(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sites', authenticate, async (req, res) => {
  try { res.status(201).json(await memberService.createSite(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/sites/:id', authenticate, async (req, res) => {
  try { res.json(await memberService.updateSite(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── コース ──

router.get('/sites/:siteId/courses', authenticate, async (req, res) => {
  try { res.json(await memberService.getCourses(req.user.id, req.params.siteId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sites/:siteId/courses', authenticate, async (req, res) => {
  try { res.status(201).json(await memberService.createCourse(req.user.id, req.params.siteId, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/courses/:id', authenticate, async (req, res) => {
  try { res.json(await memberService.updateCourse(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/courses/:id', authenticate, async (req, res) => {
  try { await memberService.deleteCourse(req.user.id, req.params.id); res.json({ success: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── レッスン ──

router.get('/courses/:courseId/lessons', authenticate, async (req, res) => {
  try {
    // コースの所有権チェック（courseId → course → user_id）
    const { supabaseAdmin } = require('../config/supabase');
    const { data: course } = await supabaseAdmin.from('courses').select('id, site_id').eq('id', req.params.courseId).single();
    if (course) {
      const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', course.site_id).single();
      if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'アクセス権がありません' });
    }
    res.json(await memberService.getLessons(req.params.courseId));
  }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/courses/:courseId/lessons', authenticate, async (req, res) => {
  try {
    // コースの所有権チェック
    const { supabaseAdmin } = require('../config/supabase');
    const { data: course } = await supabaseAdmin.from('courses').select('id, site_id').eq('id', req.params.courseId).single();
    if (course) {
      const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', course.site_id).single();
      if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'アクセス権がありません' });
    }
    res.status(201).json(await memberService.createLesson(req.params.courseId, req.body));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/lessons/:id', authenticate, async (req, res) => {
  try {
    // レッスン→コース→サイト→user_idの所有権チェーン
    const { supabaseAdmin } = require('../config/supabase');
    const { data: lesson } = await supabaseAdmin.from('lessons').select('id, course_id').eq('id', req.params.id).single();
    if (lesson) {
      const { data: course } = await supabaseAdmin.from('courses').select('id, site_id').eq('id', lesson.course_id).single();
      if (course) {
        const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', course.site_id).single();
        if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'アクセス権がありません' });
      }
    }
    res.json(await memberService.updateLesson(req.params.id, req.body));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/lessons/:id', authenticate, async (req, res) => {
  try {
    // レッスン→コース→サイト→user_idの所有権チェーン
    const { supabaseAdmin } = require('../config/supabase');
    const { data: lesson } = await supabaseAdmin.from('lessons').select('id, course_id').eq('id', req.params.id).single();
    if (lesson) {
      const { data: course } = await supabaseAdmin.from('courses').select('id, site_id').eq('id', lesson.course_id).single();
      if (course) {
        const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', course.site_id).single();
        if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'アクセス権がありません' });
      }
    }
    await memberService.deleteLesson(req.params.id); res.json({ success: true });
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── AI レッスンコンテンツ生成 ──

router.post('/courses/:courseId/lessons/ai-generate', authenticate, async (req, res) => {
  try {
    const { data: course } = require('../config/supabase').supabaseAdmin
      ? await require('../config/supabase').supabaseAdmin.from('courses').select('name, description').eq('id', req.params.courseId).single()
      : { data: {} };
    const content = await generateLessonContent(course || {}, req.body.title, req.body.outline);
    res.json({ contentHtml: content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 会員管理 ──

router.get('/sites/:siteId/members', authenticate, async (req, res) => {
  try {
    // サイトの所有権チェック
    const { supabaseAdmin } = require('../config/supabase');
    const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', req.params.siteId).single();
    if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'サイトへのアクセス権がありません' });
    res.json(await memberService.getMembers(req.params.siteId));
  }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sites/:siteId/members', authenticate, async (req, res) => {
  try {
    // サイトの所有権チェック
    const { supabaseAdmin } = require('../config/supabase');
    const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', req.params.siteId).single();
    if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'サイトへのアクセス権がありません' });
    res.status(201).json(await memberService.createMember(req.params.siteId, req.body));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/sites/:siteId/members/:memberId/grant', authenticate, async (req, res) => {
  try {
    // サイトの所有権チェック
    const { supabaseAdmin } = require('../config/supabase');
    const { data: site } = await supabaseAdmin.from('member_sites').select('user_id').eq('id', req.params.siteId).single();
    if (!site || site.user_id !== req.user.id) return res.status(403).json({ error: 'サイトへのアクセス権がありません' });
    res.json(await memberService.grantCourseAccess(req.params.memberId, req.body.courseId, req.body.expiresAt));
  }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ── 会員用API（会員トークンで認証） ──

// TODO: レート制限をindex.jsのミドルウェアで実装（ブルートフォース攻撃防止）
router.post('/member-login', async (req, res) => {
  try {
    const member = await memberService.authenticateMember(req.body.siteId, req.body.email, req.body.password);
    res.json({ member, token: Buffer.from(`${member.id}:${member.site_id}`).toString('base64') });
  } catch (e) { res.status(401).json({ error: e.message }); }
});

router.get('/member/courses/:courseId/lessons', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: '認証が必要です' });
    const [memberId] = Buffer.from(token, 'base64').toString().split(':');
    const lessons = await memberService.getAccessibleLessons(memberId, req.params.courseId);
    res.json(lessons);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/member/lessons/:lessonId/progress', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: '認証が必要です' });
    const [memberId] = Buffer.from(token, 'base64').toString().split(':');
    const progress = await memberService.updateLessonProgress(memberId, req.params.lessonId, req.body);
    res.json(progress);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
