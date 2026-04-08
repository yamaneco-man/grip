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
  // usersテーブルにレコードがない場合は自動作成（Auth⇔DB不整合の救済）
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, plan')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      // usersテーブルにレコードがない → 自動作成
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({ id: user.id, email: user.email, plan: 'free', role: 'user' })
        .select('role, plan')
        .single();
      req.user = { ...user, role: newUser?.role || 'user', plan: newUser?.plan || 'free' };
    } else {
      req.user = { ...user, role: userData.role || 'user', plan: userData.plan || 'free' };
    }
  } catch {
    req.user = { ...user, role: 'user', plan: 'free' };
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
