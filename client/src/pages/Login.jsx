import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = isSignup ? api.signup : api.login;
      const result = await fn(email, password);
      if (result.session?.access_token) {
        localStorage.setItem('grip_token', result.session.access_token);
        navigate('/');
      } else if (isSignup) {
        setError('確認メールを送信しました。メールを確認してください。');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* 左パネル — ブランディング */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between p-10"
        style={{ background: 'var(--text)', color: '#fff' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[18px]"
              style={{ background: 'rgba(255,255,255,0.15)' }}>G</div>
            <span className="text-[22px] font-bold tracking-tight">GRIP</span>
          </div>
          <h2 className="text-[32px] font-bold leading-tight mb-4" style={{ letterSpacing: '-0.5px' }}>
            LINE集客を、<br />自動で回す。
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            LP生成からステップ配信、離脱検知、クロージング支援まで。<br />
            あなたはサービスに集中するだけ。
          </p>
        </div>
        <div>
          <div className="space-y-4 mb-10">
            {[
              { icon: '📄', text: 'LP自動生成 — 5分で公開' },
              { icon: '👥', text: 'LINE登録追跡 — 誰が・どこから' },
              { icon: '⚡', text: 'ステップ配信 — 設定不要で自動' },
              { icon: '🚨', text: '離脱検知 — ブロック前に察知' },
              { icon: '🎯', text: 'クロージングAI — 成約を後押し' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-[18px]">{f.icon}</span>
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            &copy; 2026 GRIP — LINE Marketing Automation
          </div>
        </div>
      </div>

      {/* 右パネル — ログインフォーム */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          {/* モバイル用ロゴ */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center font-bold text-[13px] text-white"
              style={{ background: 'var(--text)' }}>G</div>
            <span className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>GRIP</span>
          </div>

          <h1 className="text-[24px] font-bold mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {isSignup ? 'アカウント作成' : 'おかえりなさい'}
          </h1>
          <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>
            {isSignup ? 'GRIPを始めましょう' : 'メールアドレスでログイン'}
          </p>

          {error && (
            <div className="rounded-lg px-4 py-3 mb-5 text-[13px]"
              style={{ background: 'var(--red-l)', color: 'var(--red)' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all"
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6文字以上"
                className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all"
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
              style={{ background: 'var(--text)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  処理中...
                </span>
              ) : isSignup ? '無料で始める' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>
              {isSignup ? 'アカウントをお持ちの方は' : 'アカウントをお持ちでない方は'}
            </span>
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-[13px] font-semibold ml-1 hover:underline"
              style={{ color: 'var(--text)' }}
            >
              {isSignup ? 'ログイン' : '無料で始める'}
            </button>
          </div>

          <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-center gap-6">
              {[
                { val: '5分', label: 'LP作成' },
                { val: '0円', label: '初期費用' },
                { val: '設定不要', label: '自動配信' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{s.val}</div>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
