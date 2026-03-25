const { supabase } = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');

// Supabase Auth認証ミドルウェア
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '認証トークンが必要です' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: '認証に失敗しました' });
  }

  // ユーザーのroleをDBから取得してreq.userに付与
  try {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    req.user = { ...user, role: userData?.role || 'user' };
  } catch {
    req.user = { ...user, role: 'user' };
  }

  next();
};

// role制限ミドルウェア
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'この操作を行う権限がありません' });
  }
  next();
};

module.exports = { authenticate, requireRole };
