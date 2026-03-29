const { supabaseAdmin } = require('../../config/supabase');
const crypto = require('crypto');

/**
 * アフィリエイト管理サービス
 * プログラム管理、パートナー管理、成果追跡、報酬計算
 */

// ── プログラム管理 ──

async function createProgram(userId, data) {
  const { data: program, error } = await supabaseAdmin
    .from('affiliate_programs')
    .insert({
      user_id: userId,
      name: data.name,
      commission_type: data.commissionType || 'recurring',
      commission_rate: data.commissionRate || 30,
      commission_amount: data.commissionAmount,
      cookie_days: data.cookieDays || 30,
      min_payout: data.minPayout || 5000,
    })
    .select()
    .single();
  if (error) throw error;
  return program;
}

async function getPrograms(userId) {
  const { data } = await supabaseAdmin
    .from('affiliate_programs')
    .select('*, affiliates(id, status)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (data || []).map(p => ({
    ...p,
    active_affiliates: (p.affiliates || []).filter(a => a.status === 'active').length,
    affiliates: undefined,
  }));
}

async function updateProgram(userId, programId, updates) {
  const { data, error } = await supabaseAdmin
    .from('affiliate_programs').update(updates).eq('id', programId).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

// ── パートナー管理 ──

async function addAffiliate(userId, programId, data) {
  const affiliateCode = data.affiliateCode || crypto.randomBytes(6).toString('hex');
  const { data: affiliate, error } = await supabaseAdmin
    .from('affiliates')
    .insert({
      program_id: programId,
      user_id: userId,
      partner_name: data.partnerName,
      partner_email: data.partnerEmail,
      affiliate_code: affiliateCode,
      payment_info: data.paymentInfo || {},
    })
    .select()
    .single();
  if (error) throw error;
  return affiliate;
}

async function getAffiliates(userId, programId) {
  let query = supabaseAdmin
    .from('affiliates')
    .select('*, affiliate_programs(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (programId) query = query.eq('program_id', programId);
  const { data } = await query;
  return data || [];
}

async function updateAffiliate(userId, affiliateId, updates) {
  const { data, error } = await supabaseAdmin
    .from('affiliates').update(updates).eq('id', affiliateId).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

// ── クリック追跡 ──

async function trackClick(affiliateCode, metadata = {}) {
  // ボット対策
  const ua = (metadata.userAgent || '').toLowerCase();
  if (/bot|crawler|spider|curl|wget|python|scraper/i.test(ua)) return null;

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id')
    .eq('affiliate_code', affiliateCode)
    .eq('status', 'active')
    .single();

  if (!affiliate) return null;

  // 同一IPの重複クリック防止（1時間5回まで）
  if (metadata.ipAddress) {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabaseAdmin
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliate.id)
      .eq('ip_address', metadata.ipAddress)
      .gte('clicked_at', oneHourAgo);
    if (count >= 5) return null;
  }

  const { data: click } = await supabaseAdmin
    .from('affiliate_clicks')
    .insert({
      affiliate_id: affiliate.id,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      referrer: metadata.referrer,
      landing_page: metadata.landingPage,
    })
    .select()
    .single();

  // クリック数インクリメント
  await supabaseAdmin.rpc('increment_affiliate_clicks', { aff_id: affiliate.id }).catch(async () => {
    const { data: aff } = await supabaseAdmin.from('affiliates').select('total_clicks').eq('id', affiliate.id).single();
    await supabaseAdmin.from('affiliates').update({ total_clicks: (aff?.total_clicks || 0) + 1 }).eq('id', affiliate.id);
  });

  return { affiliateId: affiliate.id, clickId: click?.id };
}

// ── 成果取得 ──

async function getConversions(userId, affiliateId, options = {}) {
  let query = supabaseAdmin
    .from('affiliate_conversions')
    .select('*, affiliates!inner(user_id, partner_name)')
    .eq('affiliates.user_id', userId)
    .order('converted_at', { ascending: false });

  if (affiliateId) query = query.eq('affiliate_id', affiliateId);
  if (options.status) query = query.eq('status', options.status);
  if (options.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data || [];
}

async function approveConversion(userId, conversionId) {
  const { data, error } = await supabaseAdmin
    .from('affiliate_conversions')
    .update({ status: 'approved' })
    .eq('id', conversionId)
    .select('*, affiliates!inner(user_id)')
    .single();
  if (error) throw error;
  if (data.affiliates.user_id !== userId) throw new Error('権限がありません');
  return data;
}

// ── 支払い管理 ──

async function createPayout(userId, affiliateId) {
  // 未払い承認済みコンバージョンの合計を計算
  const { data: conversions } = await supabaseAdmin
    .from('affiliate_conversions')
    .select('id, commission')
    .eq('affiliate_id', affiliateId)
    .eq('status', 'approved');

  const totalCommission = (conversions || []).reduce((sum, c) => sum + c.commission, 0);

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('*, affiliate_programs(min_payout)')
    .eq('id', affiliateId)
    .eq('user_id', userId)
    .single();

  if (!affiliate) throw new Error('パートナーが見つかりません');
  const minPayout = affiliate.affiliate_programs?.min_payout || 5000;
  if (totalCommission < minPayout) throw new Error(`最低支払額(¥${minPayout})に達していません（現在¥${totalCommission}）`);

  const now = new Date();
  const { data: payout, error } = await supabaseAdmin
    .from('affiliate_payouts')
    .insert({
      affiliate_id: affiliateId,
      amount: totalCommission,
      period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      period_end: now.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  // コンバージョンを支払い済みに更新
  const convIds = (conversions || []).map(c => c.id);
  if (convIds.length > 0) {
    await supabaseAdmin.from('affiliate_conversions').update({ status: 'paid' }).in('id', convIds);
  }

  // パートナーの支払い済み額を更新
  await supabaseAdmin.from('affiliates').update({
    total_paid: (affiliate.total_paid || 0) + totalCommission,
  }).eq('id', affiliateId);

  return payout;
}

async function getPayouts(userId, affiliateId) {
  let query = supabaseAdmin
    .from('affiliate_payouts')
    .select('*, affiliates!inner(user_id, partner_name)')
    .eq('affiliates.user_id', userId)
    .order('created_at', { ascending: false });
  if (affiliateId) query = query.eq('affiliate_id', affiliateId);
  const { data } = await query;
  return data || [];
}

// ── ダッシュボード統計 ──

async function getAffiliateStats(userId) {
  const { data: affiliates } = await supabaseAdmin
    .from('affiliates')
    .select('total_clicks, total_conversions, total_revenue, total_commission, total_paid')
    .eq('user_id', userId)
    .eq('status', 'active');

  const totals = (affiliates || []).reduce((acc, a) => ({
    totalClicks: acc.totalClicks + (a.total_clicks || 0),
    totalConversions: acc.totalConversions + (a.total_conversions || 0),
    totalRevenue: acc.totalRevenue + (a.total_revenue || 0),
    totalCommission: acc.totalCommission + (a.total_commission || 0),
    totalPaid: acc.totalPaid + (a.total_paid || 0),
    activeAffiliates: acc.activeAffiliates + 1,
  }), { totalClicks: 0, totalConversions: 0, totalRevenue: 0, totalCommission: 0, totalPaid: 0, activeAffiliates: 0 });

  totals.conversionRate = totals.totalClicks > 0 ? Math.round((totals.totalConversions / totals.totalClicks) * 100 * 10) / 10 : 0;
  totals.unpaidCommission = totals.totalCommission - totals.totalPaid;

  return totals;
}

module.exports = {
  createProgram, getPrograms, updateProgram,
  addAffiliate, getAffiliates, updateAffiliate,
  trackClick, getConversions, approveConversion,
  createPayout, getPayouts,
  getAffiliateStats,
};
