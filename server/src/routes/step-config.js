const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// VIPプランチェックミドルウェア
async function requireVIP(req, res, next) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }

  if (user.plan !== 'vip') {
    return res.status(403).json({ error: 'VIPプラン専用機能です' });
  }

  next();
}

/**
 * ユーザーの全ステップ設定を取得
 * GET /api/step-config
 */
router.get('/', authenticate, requireVIP, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_step_configs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('day', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 特定Dayの設定を更新（upsert）
 * PUT /api/step-config/:day
 */
router.put('/:day', authenticate, requireVIP, async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    if (isNaN(day) || day < 1 || day > 7) {
      return res.status(400).json({ error: 'dayは1〜7の整数で指定してください' });
    }

    const { purpose, tone, custom_prompt, enabled } = req.body;
    if (!purpose) {
      return res.status(400).json({ error: '目的（purpose）は必須です' });
    }

    const validTones = ['friendly', 'professional', 'casual', 'urgent'];
    if (tone && !validTones.includes(tone)) {
      return res.status(400).json({ error: `トーンは ${validTones.join(', ')} のいずれかを指定してください` });
    }

    const { data, error } = await supabaseAdmin
      .from('custom_step_configs')
      .upsert({
        user_id: req.user.id,
        day,
        purpose,
        tone: tone || 'friendly',
        custom_prompt: custom_prompt || null,
        enabled: enabled !== undefined ? enabled : true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,day',
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * デフォルトに戻す（全カスタム設定を削除）
 * POST /api/step-config/reset
 */
router.post('/reset', authenticate, requireVIP, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('custom_step_configs')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'ステップ設定をデフォルトに戻しました' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
