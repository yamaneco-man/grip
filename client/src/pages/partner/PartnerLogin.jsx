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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="rounded-2xl shadow-xl p-8 w-full max-w-md" style={{ background: 'var(--white)' }}>
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center font-bold text-[13px] text-white" style={{ background: 'var(--text)' }}>G</div>
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>GRIP</span>
          <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-xl border" style={{ color: 'var(--purple)', background: 'var(--purple-l)', borderColor: 'var(--purple-m)' }}>PARTNER</span>
        </div>
        <p className="text-center text-[14px] mb-8" style={{ color: 'var(--text3)' }}>パートナーログイン</p>

        {error && (
          <div className="rounded-lg p-3 mb-4 text-[13px]" style={{ background: 'var(--red-l)', color: 'var(--red)' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none transition-all focus:ring-2"
              style={{ border: '1px solid var(--border2)', background: 'var(--white)' }} />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1" style={{ color: 'var(--text2)' }}>パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none transition-all focus:ring-2"
              style={{ border: '1px solid var(--border2)', background: 'var(--white)' }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg text-[14px] font-medium text-white transition-all hover:-translate-y-px disabled:opacity-50"
            style={{ background: 'var(--purple)' }}>
            {loading ? '処理中...' : 'パートナーログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
