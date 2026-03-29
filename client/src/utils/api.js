const API_BASE = '/api';

// 認証トークン付きfetchラッパー
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('grip_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // admin/partnerページにいる場合はユーザー用ログインに飛ばさない
    const path = window.location.pathname;
    if (!path.startsWith('/admin') && !path.startsWith('/partner')) {
      localStorage.removeItem('grip_token');
      window.location.href = '/login';
    }
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'APIエラー');
  return data;
}

// 管理者用fetchラッパー
async function adminFetch(path, options = {}) {
  const token = localStorage.getItem('grip_admin_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('grip_admin_token');
    window.location.href = '/admin/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'APIエラー');
  return data;
}

// パートナー用fetchラッパー
async function partnerFetch(path, options = {}) {
  const token = localStorage.getItem('grip_partner_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('grip_partner_token');
    window.location.href = '/partner/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'APIエラー');
  return data;
}

export const adminApi = {
  getContracts: () => adminFetch('/admin/contracts'),
  getAgencies: () => adminFetch('/admin/agencies'),
  updateRole: (userId, role) => adminFetch(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  createAgencyCheckout: (agencyName, agencyEmail, amount) =>
    adminFetch('/admin/agency-checkout', { method: 'POST', body: JSON.stringify({ agencyName, agencyEmail, amount }) }),
};

export const partnerApi = {
  // TODO: パートナー用API追加時に実装
};

export const api = {
  // 認証
  login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email, password) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: () => apiFetch('/auth/profile'),

  // LP
  getLPs: () => apiFetch('/lp'),
  generateLP: (params) => apiFetch('/lp/generate', { method: 'POST', body: JSON.stringify(params) }),
  getLP: (id) => apiFetch(`/lp/${id}`),
  updateLP: (id, data) => apiFetch(`/lp/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLP: (id) => apiFetch(`/lp/${id}`, { method: 'DELETE' }),

  // LINE友達
  getFollowers: () => apiFetch('/line/followers'),
  getFollower: (id) => apiFetch(`/line/followers/${id}`),

  // AI
  getClosingScore: (followerId) => apiFetch(`/ai/closing-score/${followerId}`),
  handleObjection: (followerId, userMessage) =>
    apiFetch('/ai/objection-handling', { method: 'POST', body: JSON.stringify({ followerId, userMessage }) }),

  // 離脱検知
  getChurnScores: () => apiFetch('/churn/scores'),
  batchCalculate: () => apiFetch('/churn/scores/batch', { method: 'POST' }),
  getRecoveryMessage: (followerId) =>
    apiFetch('/churn/recovery-message', { method: 'POST', body: JSON.stringify({ followerId }) }),

  // ステップ設計（VIP専用）
  getStepConfig: () => apiFetch('/step-config'),
  updateStepConfig: (day, data) => apiFetch(`/step-config/${day}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetStepConfig: () => apiFetch('/step-config/reset', { method: 'POST' }),

  // トラッキングリンク
  getTrackingLinks: () => apiFetch('/tracking-links'),
  createTrackingLink: (name, channel, lineUrl) =>
    apiFetch('/tracking-links', { method: 'POST', body: JSON.stringify({ name, channel, lineUrl }) }),
  deleteTrackingLink: (id) => apiFetch(`/tracking-links/${id}`, { method: 'DELETE' }),
  getTrafficAnalytics: () => apiFetch('/line-settings/analytics'),

  // LINE連携
  getLineSettings: () => apiFetch('/line-settings/settings'),
  saveLineSettings: (channelAccessToken, channelSecret) =>
    apiFetch('/line-settings/settings', { method: 'PUT', body: JSON.stringify({ channelAccessToken, channelSecret }) }),
  deleteLineSettings: () => apiFetch('/line-settings/settings', { method: 'DELETE' }),

  // 決済 / プラン
  getPlans: () => apiFetch('/payment/plans'),
  getCurrentPlan: () => apiFetch('/payment/current-plan'),
  checkout: (plan) => apiFetch('/payment/checkout', { method: 'POST', body: JSON.stringify({ plan }) }),

  // タグ管理
  getTags: () => apiFetch('/tags'),
  createTag: (name, color) => apiFetch('/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
  updateTag: (id, name, color) => apiFetch(`/tags/${id}`, { method: 'PUT', body: JSON.stringify({ name, color }) }),
  deleteTag: (id) => apiFetch(`/tags/${id}`, { method: 'DELETE' }),
  assignTag: (followerId, tagId) => apiFetch('/tags/assign', { method: 'POST', body: JSON.stringify({ followerId, tagId }) }),
  removeTag: (followerId, tagId) => apiFetch(`/tags/assign/${followerId}/${tagId}`, { method: 'DELETE' }),
  getFollowerTags: (followerId) => apiFetch(`/tags/follower/${followerId}`),
  segmentSend: (tagIds, message, matchAll) =>
    apiFetch('/tags/segment-send', { method: 'POST', body: JSON.stringify({ tagIds, message, matchAll }) }),

  // 分析
  getFunnel: (days) => apiFetch(`/analytics/funnel?days=${days || 30}`),
  getCrossAnalysis: (days) => apiFetch(`/analytics/cross?days=${days || 30}`),
  updateFollowerEmail: (followerId, email) =>
    apiFetch(`/analytics/follower-email/${followerId}`, { method: 'PUT', body: JSON.stringify({ email }) }),
  exportFollowers: () => `/api/analytics/export/followers`,

  // カスタムドメイン
  getCustomDomains: () => apiFetch('/analytics/custom-domains'),
  addCustomDomain: (domain) => apiFetch('/analytics/custom-domain', { method: 'POST', body: JSON.stringify({ domain }) }),
  verifyDomain: (id) => apiFetch(`/analytics/custom-domain/${id}/verify`, { method: 'POST' }),
  deleteDomain: (id) => apiFetch(`/analytics/custom-domain/${id}`, { method: 'DELETE' }),

  // オンボーディング
  completeOnboarding: () => apiFetch('/analytics/onboarding-complete', { method: 'POST' }),

  // ── リッチメニュー ──
  getRichMenus: () => apiFetch('/rich-menu'),
  createRichMenu: (data) => apiFetch('/rich-menu', { method: 'POST', body: JSON.stringify(data) }),
  updateRichMenu: (id, data) => apiFetch(`/rich-menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRichMenu: (id) => apiFetch(`/rich-menu/${id}`, { method: 'DELETE' }),
  addRichMenuRule: (menuId, rule) => apiFetch(`/rich-menu/${menuId}/rules`, { method: 'POST', body: JSON.stringify(rule) }),
  deleteRichMenuRule: (ruleId) => apiFetch(`/rich-menu/rules/${ruleId}`, { method: 'DELETE' }),

  // ── リッチメッセージ ──
  sendRichMessage: (followerId, messages) => apiFetch('/rich-message/send', { method: 'POST', body: JSON.stringify({ followerId, messages }) }),
  broadcastRichMessage: (messages, tagIds, matchAll) => apiFetch('/rich-message/broadcast', { method: 'POST', body: JSON.stringify({ messages, tagIds, matchAll }) }),
  getConditionalMessages: () => apiFetch('/rich-message/conditional'),
  createConditionalMessage: (data) => apiFetch('/rich-message/conditional', { method: 'POST', body: JSON.stringify(data) }),
  updateConditionalMessage: (id, data) => apiFetch(`/rich-message/conditional/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConditionalMessage: (id) => apiFetch(`/rich-message/conditional/${id}`, { method: 'DELETE' }),
  previewMessage: (data) => apiFetch('/rich-message/preview', { method: 'POST', body: JSON.stringify(data) }),

  // ── メール配信 ──
  getEmailSettings: () => apiFetch('/email/settings'),
  saveEmailSettings: (data) => apiFetch('/email/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getEmailSubscribers: () => apiFetch('/email/subscribers'),
  addEmailSubscriber: (email, name, followerId) => apiFetch('/email/subscribers', { method: 'POST', body: JSON.stringify({ email, name, followerId }) }),
  getEmailCampaigns: () => apiFetch('/email/campaigns'),
  createEmailCampaign: (data) => apiFetch('/email/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateEmailCampaign: (id, data) => apiFetch(`/email/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendEmailCampaign: (id) => apiFetch(`/email/campaigns/${id}/send`, { method: 'POST' }),
  getEmailSequences: () => apiFetch('/email/sequences'),
  createEmailSequence: (data) => apiFetch('/email/sequences', { method: 'POST', body: JSON.stringify(data) }),
  updateEmailSequence: (id, data) => apiFetch(`/email/sequences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmailSequence: (id) => apiFetch(`/email/sequences/${id}`, { method: 'DELETE' }),
  aiGenerateEmailSequence: (data) => apiFetch('/email/ai/generate-sequence', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateCampaignEmail: (data) => apiFetch('/email/ai/generate-campaign', { method: 'POST', body: JSON.stringify(data) }),
  getEmailLogs: () => apiFetch('/email/logs'),

  // ── 会員サイト ──
  getMemberSites: () => apiFetch('/member/sites'),
  createMemberSite: (data) => apiFetch('/member/sites', { method: 'POST', body: JSON.stringify(data) }),
  updateMemberSite: (id, data) => apiFetch(`/member/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCourses: (siteId) => apiFetch(`/member/sites/${siteId}/courses`),
  createCourse: (siteId, data) => apiFetch(`/member/sites/${siteId}/courses`, { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => apiFetch(`/member/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => apiFetch(`/member/courses/${id}`, { method: 'DELETE' }),
  getLessons: (courseId) => apiFetch(`/member/courses/${courseId}/lessons`),
  createLesson: (courseId, data) => apiFetch(`/member/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(data) }),
  updateLesson: (id, data) => apiFetch(`/member/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLesson: (id) => apiFetch(`/member/lessons/${id}`, { method: 'DELETE' }),
  aiGenerateLesson: (courseId, title, outline) => apiFetch(`/member/courses/${courseId}/lessons/ai-generate`, { method: 'POST', body: JSON.stringify({ title, outline }) }),
  getSiteMembers: (siteId) => apiFetch(`/member/sites/${siteId}/members`),
  addSiteMember: (siteId, data) => apiFetch(`/member/sites/${siteId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  grantCourseAccess: (siteId, memberId, courseId) => apiFetch(`/member/sites/${siteId}/members/${memberId}/grant`, { method: 'POST', body: JSON.stringify({ courseId }) }),

  // ── ウェビナー ──
  getWebinars: () => apiFetch('/webinar'),
  createWebinar: (data) => apiFetch('/webinar', { method: 'POST', body: JSON.stringify(data) }),
  getWebinar: (id) => apiFetch(`/webinar/${id}`),
  updateWebinar: (id, data) => apiFetch(`/webinar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWebinar: (id) => apiFetch(`/webinar/${id}`, { method: 'DELETE' }),
  getWebinarRegistrations: (id) => apiFetch(`/webinar/${id}/registrations`),
  registerForWebinar: (id, data) => apiFetch(`/webinar/${id}/register`, { method: 'POST', body: JSON.stringify(data) }),
  getWebinarStats: (id) => apiFetch(`/webinar/${id}/stats`),
  aiGenerateWebinarScript: (data) => apiFetch('/webinar/ai/generate-script', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateWebinarPage: (data) => apiFetch('/webinar/ai/generate-registration-page', { method: 'POST', body: JSON.stringify(data) }),

  // ── イベント・予約 ──
  getEvents: () => apiFetch('/events'),
  createEvent: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  getEvent: (id) => apiFetch(`/events/${id}`),
  updateEvent: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
  getEventBookings: (id) => apiFetch(`/events/${id}/bookings`),
  createBooking: (id, data) => apiFetch(`/events/${id}/book`, { method: 'POST', body: JSON.stringify(data) }),
  updateBookingStatus: (bookingId, status) => apiFetch(`/events/bookings/${bookingId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // ── アフィリエイト ──
  getAffiliatePrograms: () => apiFetch('/affiliate/programs'),
  createAffiliateProgram: (data) => apiFetch('/affiliate/programs', { method: 'POST', body: JSON.stringify(data) }),
  getAffiliatePartners: (programId) => apiFetch(`/affiliate/partners?programId=${programId || ''}`),
  addAffiliatePartner: (data) => apiFetch('/affiliate/partners', { method: 'POST', body: JSON.stringify(data) }),
  getAffiliateConversions: (affiliateId) => apiFetch(`/affiliate/conversions?affiliateId=${affiliateId || ''}`),
  approveConversion: (id) => apiFetch(`/affiliate/conversions/${id}/approve`, { method: 'PUT' }),
  getAffiliatePayouts: (affiliateId) => apiFetch(`/affiliate/payouts?affiliateId=${affiliateId || ''}`),
  createAffiliatePayout: (affiliateId) => apiFetch('/affiliate/payouts', { method: 'POST', body: JSON.stringify({ affiliateId }) }),
  getAffiliateStats: () => apiFetch('/affiliate/stats'),

  // ── EC・商品管理 ──
  getProducts: () => apiFetch('/commerce/products'),
  createProduct: (data) => apiFetch('/commerce/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiFetch(`/commerce/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => apiFetch(`/commerce/products/${id}`, { method: 'DELETE' }),
  getOrderBumps: (productId) => apiFetch(`/commerce/products/${productId}/bumps`),
  setOrderBump: (productId, data) => apiFetch(`/commerce/products/${productId}/bumps`, { method: 'POST', body: JSON.stringify(data) }),
  getUpsells: (triggerProductId) => apiFetch(`/commerce/upsells?triggerProductId=${triggerProductId || ''}`),
  setUpsell: (data) => apiFetch('/commerce/upsells', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (status) => apiFetch(`/commerce/orders?status=${status || ''}`),
  createOrder: (data) => apiFetch('/commerce/orders', { method: 'POST', body: JSON.stringify(data) }),
  completeOrder: (id, paymentId) => apiFetch(`/commerce/orders/${id}/complete`, { method: 'POST', body: JSON.stringify({ paymentId }) }),
  refundOrder: (id) => apiFetch(`/commerce/orders/${id}/refund`, { method: 'POST' }),
  generateInvoice: (orderId, type) => apiFetch(`/commerce/orders/${orderId}/invoice`, { method: 'POST', body: JSON.stringify({ type }) }),
  getFunnels: () => apiFetch('/commerce/funnels'),
  createFunnel: (data) => apiFetch('/commerce/funnels', { method: 'POST', body: JSON.stringify(data) }),
  updateFunnel: (id, data) => apiFetch(`/commerce/funnels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  trackAdConversion: (data) => apiFetch('/commerce/ad-conversion', { method: 'POST', body: JSON.stringify(data) }),

  // ── シナリオテンプレート ──
  getScenarioTemplates: () => apiFetch('/scenario'),
  exportScenario: (data) => apiFetch('/scenario/export', { method: 'POST', body: JSON.stringify(data) }),
  importScenario: (id) => apiFetch(`/scenario/${id}/import`, { method: 'POST' }),
  getBanLogs: () => apiFetch('/scenario/ban-logs'),
};
