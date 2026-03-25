import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PartnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ログイン失敗');
      if (data.session?.access_token) {
        localStorage.setItem('grip_partner_token', data.session.access_token);
        navigate('/partner');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* 左パネル */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between p-10"
        style={{ background: 'var(--purple)', color: '#fff' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[18px]"
              style={{ background: 'rgba(255,255,255,0.2)' }}>G</div>
            <span className="text-[22px] font-bold tracking-tight">GRIP</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.2)' }}>PARTNER</span>
          </div>
          <h2 className="text-[32px] font-bold leading-tight mb-4" style={{ letterSpacing: '-0.5px' }}>
            パートナー<br />ポータル
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            紹介顧客の管理・収益確認・販売素材のダウンロード
          </p>
        </div>
        <div>
          <div className="space-y-3 mb-10">
            {[
              { val: '50%', label: '永久還元率' },
              { val: '¥500,000', label: '契約料（初期）' },
              { val: '半年', label: '全額キャッシュバック期間' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                <span className="text-[16px] font-bold">{s.val}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            &copy; 2026 GRIP Partner Portal
          </div>
        </div>
      </div>

      {/* 右パネル */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center font-bold text-[13px] text-white"
              style={{ background: 'var(--text)' }}>G</div>
            <span className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>GRIP</span>
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-xl border"
              style={{ color: 'var(--purple)', background: 'var(--purple-l)', borderColor: 'var(--purple-m)' }}>PARTNER</span>
          </div>

          <h1 className="text-[24px] font-bold mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.3px' }}>
            パートナーログイン
          </h1>
          <p className="text-[14px] mb-8" style={{ color: 'var(--text3)' }}>代理店アカウントでログイン</p>

          {error && (
            <div className="rounded-lg px-4 py-3 mb-5 text-[13px]"
              style={{ background: 'var(--red-l)', color: 'var(--red)' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="partner@example.com"
                className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all"
                style={{ background: 'var(--white)', border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>パスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all"
                style={{ background: 'var(--white)', border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-50"
              style={{ background: 'var(--purple)' }}>
              {loading ? '処理中...' : 'パートナーログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
