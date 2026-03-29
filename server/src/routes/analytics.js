const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// ファネル分析: LP閲覧 → LINE登録 → ステップ完了 → 成約
router.get('/funnel', authenticate, async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. LP閲覧数（PV合計）
    const { data: lps } = await supabaseAdmin
      .from('lps')
      .select('pv_count, registration_count')
      .eq('user_id', req.user.id);

    const totalPV = (lps || []).reduce((sum, lp) => sum + (lp.pv_count || 0), 0);
    const totalRegistrations = (lps || []).reduce((sum, lp) => sum + (lp.registration_count || 0), 0);

    // 2. LINE登録者数（期間内）
    const { count: lineRegistrations } = await supabaseAdmin
      .from('line_followers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('registered_at', since);

    // 3. ステップ完了者数（step_day >= 7）
    const { count: stepCompleted } = await supabaseAdmin
      .from('line_followers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('step_day', 7)
      .gte('registered_at', since);

    // 4. 成約者数（closing_score probability >= 70）
    const { data: highClosing } = await supabaseAdmin
      .from('closing_scores')
      .select('follower_id, probability, line_followers!inner(user_id, registered_at)')
      .gte('probability', 70)
      .gte('line_followers.registered_at', since)
      .eq('line_followers.user_id', req.user.id);

    const closedCount = highClosing ? [...new Set(highClosing.map(c => c.follower_id))].length : 0;

    const funnel = [
      { stage: 'LP閲覧', count: totalPV, rate: 100 },
      { stage: 'LINE登録', count: lineRegistrations || 0, rate: totalPV > 0 ? Math.round((lineRegistrations / totalPV) * 100 * 10) / 10 : 0 },
      { stage: 'ステップ完了', count: stepCompleted || 0, rate: lineRegistrations > 0 ? Math.round((stepCompleted / lineRegistrations) * 100 * 10) / 10 : 0 },
      { stage: '成約', count: closedCount, rate: stepCompleted > 0 ? Math.round((closedCount / stepCompleted) * 100 * 10) / 10 : 0 },
    ];

    res.json({ funnel, period: `${days}日間`, totalRegistrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// クロス分析: チャネル × 期間の多軸分析
router.get('/cross', authenticate, async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // チャネル別の登録者・離脱スコア・成約率を集計
    const { data: followers } = await supabaseAdmin
      .from('line_followers')
      .select('id, source_channel, registered_at, is_blocked, step_day, churn_scores(score), closing_scores(probability)')
      .eq('user_id', req.user.id)
      .gte('registered_at', since);

    if (!followers?.length) {
      return res.json({ channels: [], period: `${days}日間` });
    }

    // チャネル別集計
    const channelMap = {};
    followers.forEach(f => {
      const ch = f.source_channel || 'direct';
      if (!channelMap[ch]) {
        channelMap[ch] = { channel: ch, total: 0, blocked: 0, stepCompleted: 0, highClosing: 0, churnSum: 0, churnCount: 0 };
      }
      const c = channelMap[ch];
      c.total++;
      if (f.is_blocked) c.blocked++;
      if (f.step_day >= 7) c.stepCompleted++;
      const closingProb = f.closing_scores?.[0]?.probability;
      if (closingProb >= 70) c.highClosing++;
      const churnScore = f.churn_scores?.[0]?.score;
      if (churnScore != null) { c.churnSum += churnScore; c.churnCount++; }
    });

    const channels = Object.values(channelMap).map(c => ({
      channel: c.channel,
      registrations: c.total,
      blockRate: c.total > 0 ? Math.round((c.blocked / c.total) * 100 * 10) / 10 : 0,
      stepCompletionRate: c.total > 0 ? Math.round((c.stepCompleted / c.total) * 100 * 10) / 10 : 0,
      closingRate: c.total > 0 ? Math.round((c.highClosing / c.total) * 100 * 10) / 10 : 0,
      avgChurnScore: c.churnCount > 0 ? Math.round(c.churnSum / c.churnCount) : null,
    })).sort((a, b) => b.registrations - a.registrations);

    // 日別登録推移
    const dailyMap = {};
    followers.forEach(f => {
      const day = f.registered_at?.split('T')[0];
      if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    res.json({ channels, daily, period: `${days}日間`, totalFollowers: followers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// メールアドレス収集: フォロワーのメアドを登録
router.put('/follower-email/:followerId', authenticate, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'メールアドレスは必須です' });

  try {
    const { data, error } = await supabaseAdmin
      .from('line_followers')
      .update({ email })
      .eq('id', req.params.followerId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'フォロワーが見つかりません' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// データエクスポート: フォロワーリストCSV
router.get('/export/followers', authenticate, async (req, res) => {
  try {
    const { data: followers } = await supabaseAdmin
      .from('line_followers')
      .select('display_name, line_user_id, email, source_channel, registered_at, is_blocked, step_day')
      .eq('user_id', req.user.id)
      .order('registered_at', { ascending: false });

    if (!followers?.length) {
      return res.status(404).json({ error: 'エクスポートするデータがありません' });
    }

    // CSV生成
    const headers = ['名前', 'LINE ID', 'メールアドレス', '流入経路', '登録日', '状態', 'ステップ日数'];
    const rows = followers.map(f => [
      f.display_name || '',
      f.line_user_id || '',
      f.email || '',
      f.source_channel || 'direct',
      f.registered_at ? new Date(f.registered_at).toLocaleDateString('ja-JP') : '',
      f.is_blocked ? 'ブロック' : 'アクティブ',
      f.step_day || 0,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    // BOM付きUTF-8
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=grip-followers-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(bom + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// カスタムドメイン: 登録
router.post('/custom-domain', authenticate, async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'ドメインは必須です' });

  // ドメイン形式の簡易バリデーション
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return res.status(400).json({ error: '有効なドメイン形式を入力してください' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('custom_domains')
      .insert({ user_id: req.user.id, domain: domain.toLowerCase() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'このドメインは既に登録されています' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// カスタムドメイン: 一覧取得
router.get('/custom-domains', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_domains')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// カスタムドメイン: DNS検証
router.post('/custom-domain/:id/verify', authenticate, async (req, res) => {
  try {
    const { data: domain } = await supabaseAdmin
      .from('custom_domains')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!domain) return res.status(404).json({ error: 'ドメインが見つかりません' });

    // DNS CNAMEチェック（Node.js dns module）
    const dns = require('dns').promises;
    try {
      const records = await dns.resolveCname(domain.domain);
      const isVerified = records.some(r => r.includes('grip') || r.includes('railway'));

      await supabaseAdmin
        .from('custom_domains')
        .update({
          status: isVerified ? 'verified' : 'failed',
          verified_at: isVerified ? new Date().toISOString() : null,
        })
        .eq('id', domain.id);

      res.json({
        verified: isVerified,
        status: isVerified ? 'verified' : 'failed',
        message: isVerified
          ? 'ドメインの検証が完了しました'
          : 'CNAMEレコードが見つかりません。DNSの設定を確認してください。',
      });
    } catch (dnsErr) {
      await supabaseAdmin
        .from('custom_domains')
        .update({ status: 'failed' })
        .eq('id', domain.id);

      res.json({
        verified: false,
        status: 'failed',
        message: 'DNSレコードが見つかりません。CNAMEレコードを設定してから再度お試しください。',
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// カスタムドメイン: 削除
router.delete('/custom-domain/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('custom_domains')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// オンボーディング完了
router.post('/onboarding-complete', authenticate, async (req, res) => {
  try {
    await supabaseAdmin
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', req.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
