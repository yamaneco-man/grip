const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// FREEプラン制限
function requirePaidPlan(req, res, next) {
  supabaseAdmin.from('users').select('plan').eq('id', req.user.id).single()
    .then(({ data }) => {
      if (!data?.plan || data.plan === 'free') {
        return res.status(403).json({ error: 'トラッキングリンクは有料プランで利用できます' });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: 'プラン確認に失敗しました' }));
}

// トラッキングリンク一覧取得
router.get('/', authenticate, requirePaidPlan, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tracking_links')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch {
    res.status(500).json({ error: '取得に失敗しました' });
  }
});

// トラッキングリンク作成
router.post('/', authenticate, requirePaidPlan, async (req, res) => {
  try {
    const { name, channel, lineUrl } = req.body;
    if (!name || !channel) {
      return res.status(400).json({ error: 'リンク名とチャネルは必須です' });
    }

    const trackingCode = crypto.randomBytes(6).toString('hex');

    const { data, error } = await supabaseAdmin
      .from('tracking_links')
      .insert({
        user_id: req.user.id,
        name,
        channel,
        tracking_code: trackingCode,
        original_line_url: lineUrl || null,
        click_count: 0,
        follow_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // トラッキングURL生成
    data.trackingUrl = `https://grip-api-production.up.railway.app/t/${trackingCode}`;
    res.json(data);
  } catch {
    res.status(500).json({ error: '作成に失敗しました' });
  }
});

// トラッキングリンク削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin
      .from('tracking_links')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: '削除に失敗しました' });
  }
});

module.exports = router;
