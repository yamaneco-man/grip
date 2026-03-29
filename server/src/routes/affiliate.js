const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const affService = require('../services/affiliate/affiliateManager');

// プログラム管理
router.get('/programs', authenticate, async (req, res) => {
  try { res.json(await affService.getPrograms(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/programs', authenticate, async (req, res) => {
  try { res.status(201).json(await affService.createProgram(req.user.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/programs/:id', authenticate, async (req, res) => {
  try { res.json(await affService.updateProgram(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// パートナー管理
router.get('/partners', authenticate, async (req, res) => {
  try { res.json(await affService.getAffiliates(req.user.id, req.query.programId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/partners', authenticate, async (req, res) => {
  try { res.status(201).json(await affService.addAffiliate(req.user.id, req.body.programId, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/partners/:id', authenticate, async (req, res) => {
  try { res.json(await affService.updateAffiliate(req.user.id, req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// クリック追跡（認証不要 - 外部アクセス）
router.get('/track/:code', async (req, res) => {
  try {
    const result = await affService.trackClick(req.params.code, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      landingPage: req.query.url,
    });
    if (!result) return res.status(404).json({ error: 'アフィリエイトコードが無効です' });
    // リダイレクト先があれば飛ばす（オープンリダイレクト防止: プロトコル・ドメイン検証）
    if (req.query.url) {
      try {
        const redirectUrl = new URL(req.query.url);
        // http/httpsプロトコルのみ許可
        if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
          return res.status(400).json({ error: '不正なURLプロトコルです' });
        }
        // 許可ドメインリスト（自サイト・LINE関連）
        const allowedDomains = [
          'grip.ixas.jp', 'www.grip.ixas.jp', 'ixas.jp', 'www.ixas.jp',
          'line.me', 'liff.line.me', 'access.line.me', 'api.line.me',
          'lin.ee',
        ];
        const hostname = redirectUrl.hostname.toLowerCase();
        const isAllowed = allowedDomains.some(d => hostname === d || hostname.endsWith('.' + d));
        if (!isAllowed) {
          return res.status(400).json({ error: '許可されていないリダイレクト先です' });
        }
        return res.redirect(302, redirectUrl.toString());
      } catch {
        return res.status(400).json({ error: '不正なURLです' });
      }
    }
    res.json({ tracked: true, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// コンバージョン・成果
router.get('/conversions', authenticate, async (req, res) => {
  try { res.json(await affService.getConversions(req.user.id, req.query.affiliateId, { status: req.query.status })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/conversions/:id/approve', authenticate, async (req, res) => {
  try { res.json(await affService.approveConversion(req.user.id, req.params.id)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// 支払い
router.get('/payouts', authenticate, async (req, res) => {
  try { res.json(await affService.getPayouts(req.user.id, req.query.affiliateId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/payouts', authenticate, async (req, res) => {
  try { res.status(201).json(await affService.createPayout(req.user.id, req.body.affiliateId)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// 統計
router.get('/stats', authenticate, async (req, res) => {
  try { res.json(await affService.getAffiliateStats(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
