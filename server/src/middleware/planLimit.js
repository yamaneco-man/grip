const { supabaseAdmin } = require('../config/supabase');
const { PLANS } = require('../config/square');

// LP生成数の制限チェック
async function checkLPLimit(req, res, next) {
  try {
    const userId = req.user.id;

    // ユーザーのプラン取得
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (userErr) throw userErr;

    const plan = PLANS[user.plan || 'free'];
    if (!plan.lpLimit) return next(); // 無制限

    // LP現存数をチェック（アカウントあたりの上限）
    const { count, error: countErr } = await supabaseAdmin
      .from('lps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countErr) throw countErr;

    if (count >= plan.lpLimit) {
      return res.status(403).json({
        error: `${plan.name}プランのLP上限（${plan.lpLimit}件）に達しました。不要なLPを削除するか、アップグレードしてください。`,
      });
    }

    // FREEプラン: 月間生成回数も制限（削除→再作成の迂回防止）
    if (user.plan === 'free' || !user.plan) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: monthCount, error: mErr } = await supabaseAdmin
        .from('lps')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStart);
      if (!mErr && monthCount >= plan.lpLimit * 2) {
        return res.status(403).json({
          error: `${plan.name}プランの月間LP生成上限に達しました。アップグレードしてください。`,
        });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// LINEフォロワー数の制限チェック
async function checkFollowerLimit(req, res, next) {
  try {
    const userId = req.user?.id || process.env.DEFAULT_USER_ID;
    if (!userId) return next();

    // ユーザーのプラン取得
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (userErr) throw userErr;

    const plan = PLANS[user.plan || 'free'];
    if (!plan.followerLimit) return next(); // 無制限

    // 現在のフォロワー数をカウント
    const { count, error: countErr } = await supabaseAdmin
      .from('line_followers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countErr) throw countErr;

    if (count >= plan.followerLimit) {
      return res.status(403).json({
        error: `${plan.name}プランのLINE追跡上限（${plan.followerLimit}人）に達しました。アップグレードしてください。`,
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { checkLPLimit, checkFollowerLimit };
