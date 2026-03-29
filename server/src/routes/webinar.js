const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const webinarService = require('../services/webinar/webinar');
const { generateWebinarScript, generateWebinarRegistrationPage } = require('../services/ai/aiExtended');

// ウェビナー CRUD
router.get('/', authenticate, async (req, res) => {
  try { res.json(await webinarService.getWebinars(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try { res.status(201).json(await webinarService.createWebinar(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const webinar = await webinarService.getWebinar(req.user.id, req.params.id);
    if (!webinar) return res.status(404).json({ error: 'ウェビナーが見つかりません' });
    res.json(webinar);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try { res.json(await webinarService.updateWebinar(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try { await webinarService.deleteWebinar(req.user.id, req.params.id); res.json({ success: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// 登録者管理
router.get('/:id/registrations', authenticate, async (req, res) => {
  try { res.json(await webinarService.getRegistrations(req.user.id, req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/register', authenticate, async (req, res) => {
  try { res.status(201).json(await webinarService.registerForWebinar(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// 参加記録
router.post('/registrations/:regId/attend', authenticate, async (req, res) => {
  try {
    await webinarService.recordAttendance(req.params.regId, req.body.durationMinutes, req.body.clickedCta);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 統計
router.get('/:id/stats', authenticate, async (req, res) => {
  try { res.json(await webinarService.getWebinarStats(req.user.id, req.params.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// エバーグリーン: 次の利用可能時間
router.get('/:id/available-times', authenticate, async (req, res) => {
  try {
    const webinar = await webinarService.getWebinar(req.user.id, req.params.id);
    if (!webinar) return res.status(404).json({ error: 'ウェビナーが見つかりません' });
    res.json(webinarService.getNextAvailableTimes(webinar, Number(req.query.count) || 3));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI 台本生成
router.post('/ai/generate-script', authenticate, async (req, res) => {
  try { res.json(await generateWebinarScript(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// AI 登録ページ生成
router.post('/ai/generate-registration-page', authenticate, async (req, res) => {
  try {
    const html = await generateWebinarRegistrationPage(req.body);
    res.json({ html });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
