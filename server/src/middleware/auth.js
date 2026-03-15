const { supabase } = require('../config/supabase');

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

  req.user = user;
  next();
};

module.exports = { authenticate };
