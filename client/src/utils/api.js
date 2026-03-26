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

  // 決済 / プラン
  getPlans: () => apiFetch('/payment/plans'),
  getCurrentPlan: () => apiFetch('/payment/current-plan'),
  checkout: (plan) => apiFetch('/payment/checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
};
