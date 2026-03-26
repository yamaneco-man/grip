const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { PLANS } = require('../config/square');

// FREEプラン制限
function requirePaidPlan(req, res, next) {
  supabaseAdmin.from('users').select('plan').eq('id', req.user.id).single()
    .then(({ data }) => {
      if (!data?.plan || data.plan === 'free') {
        return res.status(403).json({ error: 'LINE連携は有料プランで利用できます' });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: 'プラン確認に失敗しました' }));
}

// LINE連携設定を取得
router.get('/settings', authenticate, requirePaidPlan, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('line_official_token, line_channel_secret')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    // トークンはマスクして返す（セキュリティ）
    res.json({
      hasToken: !!data.line_official_token,
      hasSecret: !!data.line_channel_secret,
      tokenPreview: data.line_official_token ? '****' + data.line_official_token.slice(-8) : null,
      webhookUrl: `https://grip-api-production.up.railway.app/api/line/webhook/${req.user.id}`,
    });
  } catch {
    res.status(500).json({ error: '設定の取得に失敗しました' });
  }
});

// LINE連携設定を保存
router.put('/settings', authenticate, requirePaidPlan, async (req, res) => {
  try {
    const { channelAccessToken, channelSecret } = req.body;

    if (!channelAccessToken || !channelSecret) {
      return res.status(400).json({ error: 'チャネルアクセストークンとチャネルシークレットは必須です' });
    }

    // 簡易バリデーション
    if (channelAccessToken.length < 50) {
      return res.status(400).json({ error: 'チャネルアクセストークンの形式が正しくありません' });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        line_official_token: channelAccessToken,
        line_channel_secret: channelSecret,
      })
      .eq('id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      webhookUrl: `https://grip-api-production.up.railway.app/api/line/webhook/${req.user.id}`,
    });
  } catch {
    res.status(500).json({ error: '設定の保存に失敗しました' });
  }
});

// LINE連携を解除
router.delete('/settings', authenticate, async (req, res) => {
  try {
    await supabaseAdmin
      .from('users')
      .update({ line_official_token: null, line_channel_secret: null })
      .eq('id', req.user.id);

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: '連携解除に失敗しました' });
  }
});

// 流入経路分析（有料プラン限定）
router.get('/analytics', authenticate, requirePaidPlan, async (req, res) => {
  try {
    // チャネル別の友達数を集計
    const { data: followers, error } = await supabaseAdmin
      .from('line_followers')
      .select('source_channel')
      .eq('user_id', req.user.id)
      .eq('is_blocked', false);

    if (error) throw error;

    const channels = {};
    (followers || []).forEach(f => {
      const ch = f.source_channel || 'direct';
      channels[ch] = (channels[ch] || 0) + 1;
    });

    // LPアクセスログ集計
    const { data: lps } = await supabaseAdmin
      .from('lps')
      .select('id')
      .eq('user_id', req.user.id);

    const lpIds = (lps || []).map(l => l.id);
    let accessByChannel = {};

    if (lpIds.length > 0) {
      const { data: logs } = await supabaseAdmin
        .from('lp_access_logs')
        .select('source_channel')
        .in('lp_id', lpIds);

      (logs || []).forEach(l => {
        const ch = l.source_channel || 'direct';
        accessByChannel[ch] = (accessByChannel[ch] || 0) + 1;
      });
    }

    res.json({ followersByChannel: channels, lpAccessByChannel: accessByChannel });
  } catch {
    res.status(500).json({ error: '分析データの取得に失敗しました' });
  }
});

module.exports = router;
