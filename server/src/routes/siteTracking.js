const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// トラッキングスクリプト一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_tracking_scripts')
      .select('*, site_tracking_events(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(s => ({ ...s, event_count: s.site_tracking_events?.[0]?.count || 0 })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// スクリプト作成
router.post('/', authenticate, async (req, res) => {
  const { name, target_url } = req.body;
  if (!name) return res.status(400).json({ error: '名前は必須です' });

  const scriptCode = `grip_${req.user.id.replace(/-/g, '').slice(0, 12)}_${Date.now().toString(36)}`;
  try {
    const { data, error } = await supabaseAdmin
      .from('site_tracking_scripts')
      .insert({ user_id: req.user.id, name, target_url, script_code: scriptCode })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// スクリプト削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('site_tracking_scripts').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 埋め込みコード生成
router.get('/:id/embed', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('site_tracking_scripts').select('script_code')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!data) return res.status(404).json({ error: 'スクリプトが見つかりません' });

    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.BASE_URL || 'https://grip-api-production.up.railway.app';
    const embed = `<script>(function(){var s="${data.script_code}",b="${baseUrl}";var d=document,w=window;function t(e){var x=new XMLHttpRequest();x.open("POST",b+"/api/site-tracking/collect",true);x.setRequestHeader("Content-Type","application/json");x.send(JSON.stringify({sc:s,et:e,url:d.location.href,ref:d.referrer,ua:navigator.userAgent,sid:w.gripSid||(w.gripSid=Math.random().toString(36).slice(2))}));}t("pageview");d.addEventListener("click",function(e){var a=e.target.closest("a");if(a)t("click");});})();</script>`;
    res.json({ script_code: data.script_code, embed_code: embed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// トラッキングデータ収集（公開エンドポイント - CORSフリー）
router.post('/collect', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { sc, et, url, ref, ua, sid } = req.body;
  if (!sc) return res.status(400).end();
  const safeUrl = (url || '').slice(0, 2000);
  const safeRef = (ref || '').slice(0, 2000);
  const safeUa = (ua || '').slice(0, 500);
  const safeEt = ['pageview', 'click', 'scroll', 'form'].includes(et) ? et : 'pageview';
  try {
    const { data: script } = await supabaseAdmin
      .from('site_tracking_scripts')
      .select('id').eq('script_code', sc).eq('is_active', true).single();
    if (!script) return res.status(404).end();

    await supabaseAdmin.from('site_tracking_events').insert({
      script_id: script.id, event_type: safeEt, page_url: safeUrl, referrer: safeRef, user_agent: safeUa, session_id: (sid || '').slice(0, 100),
    });
    res.status(204).end();
  } catch { res.status(500).end(); }
});

// イベント統計
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { data: script } = await supabaseAdmin
      .from('site_tracking_scripts').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!script) return res.status(404).json({ error: 'スクリプトが見つかりません' });

    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('site_tracking_events')
      .select('event_type, page_url, created_at')
      .eq('script_id', script.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;

    const pageviews = (data || []).filter(e => e.event_type === 'pageview').length;
    const clicks = (data || []).filter(e => e.event_type === 'click').length;
    const pages = {};
    (data || []).forEach(e => { if (e.page_url) pages[e.page_url] = (pages[e.page_url] || 0) + 1; });

    res.json({ pageviews, clicks, top_pages: Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([url, count]) => ({ url, count })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
