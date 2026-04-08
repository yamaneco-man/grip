const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkLPLimit } = require('../middleware/planLimit');
const { supabaseAdmin } = require('../config/supabase');
const { createLP, getLPs, getLP, serveLPHtml, updateLP, deleteLP } = require('../services/lp/generator');

// LP一覧取得（認証必須）
router.get('/', authenticate, async (req, res) => {
  try {
    const lps = await getLPs(req.user.id);
    res.json(lps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LP生成（認証必須・プラン制限チェック）
router.post('/generate', authenticate, checkLPLimit, async (req, res) => {
  try {
    const { productName, price, target, strengths, reviews, lineUrl } = req.body;
    if (!productName || !target) {
      return res.status(400).json({ error: '商品名とターゲットは必須です' });
    }
    const lp = await createLP(req.user.id, { productName, price, target, strengths, reviews, lineUrl });
    res.json(lp);
  } catch (err) {
    console.error('LP生成エラー:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'LP生成に失敗しました' });
  }
});

// LP HTML公開ページ（認証不要 + 流入経路トラッキング）
router.get('/view/:id', async (req, res) => {
  try {
    const html = await serveLPHtml(req.params.id);
    if (!html) return res.status(404).send('LPが見つかりません');

    // UTMパラメータをアクセスログに記録
    const { utm_source, utm_medium, utm_campaign, utm_content, ref: sourceChannel } = req.query;
    if (utm_source || sourceChannel) {
      supabaseAdmin.from('lp_access_logs').insert({
        lp_id: req.params.id,
        source_channel: sourceChannel || utm_source || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        referrer: req.headers.referer || null,
      }).catch(() => {});
    }

    // LPのHTMLにトラッキングスクリプトを注入
    const trackingScript = `
<script>
(function(){
  var params = new URLSearchParams(window.location.search);
  var source = params.get('ref') || params.get('utm_source') || 'direct';
  var lpId = '${req.params.id}';
  // LINE友達追加URLにソース情報を付与
  document.querySelectorAll('a[href*="lin.ee"], a[href*="line.me"]').forEach(function(a){
    var url = new URL(a.href);
    url.searchParams.set('lp', lpId);
    url.searchParams.set('src', source);
    if(params.get('utm_campaign')) url.searchParams.set('campaign', params.get('utm_campaign'));
    a.href = url.toString();
  });
})();
</script>`;

    const enhancedHtml = html.replace('</body>', trackingScript + '</body>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(enhancedHtml);
  } catch (err) {
    console.error('LP HTML配信エラー:', err.message);
    res.status(404).send('LPが見つかりません');
  }
});

// LP詳細（認証必須・所有権チェック）
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lp = await getLP(req.params.id);
    if (!lp || lp.user_id !== req.user.id) {
      return res.status(404).json({ error: 'LPが見つかりません' });
    }
    res.json(lp);
  } catch (err) {
    console.error('LP詳細取得エラー:', err.message);
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// LP更新（認証必須・メタ情報のみ、HTML再生成なし）
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { productName, price, target, strengths, reviews, lineUrl } = req.body;
    const lp = await updateLP(req.params.id, req.user.id, { productName, price, target, strengths, reviews, lineUrl });
    res.json(lp);
  } catch (err) {
    const status = err.message.includes('権限') ? 403 : err.message.includes('見つかりません') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// LP削除（認証必須・自分のLPのみ）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await deleteLP(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('権限') ? 403 : err.message.includes('見つかりません') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
