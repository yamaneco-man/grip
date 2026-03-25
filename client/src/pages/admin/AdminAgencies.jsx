import React, { useEffect, useState } from 'react';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('grip_admin_token');
    fetch('/api/admin/agencies', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setAgencies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>代理店管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>全{agencies.length}社の代理店パートナー</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        {agencies.length > 0 ? (
          <div>
            {agencies.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-4 border-b hover:bg-[#f6f7fb] transition-colors"
                style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px]"
                  style={{ background: 'var(--purple-l)', border: '1px solid var(--purple-m)' }}>🤝</div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{a.email}</div>
                  <div className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>
                    契約開始: {new Date(a.created_at).toLocaleDateString('ja-JP')} / 還元率 50%
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border bg-[var(--purple-l)] text-[var(--purple)] border-[var(--purple-m)]">
                    PARTNER
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだ代理店がいません</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>パートナーが代理店を開拓するとここに表示されます</p>
          </div>
        )}
      </div>

      {/* 代理店モデル概要 */}
      <div className="mt-5 rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>代理店収益モデル</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '契約料', val: '¥500,000', sub: 'パートナーと折半', color: 'var(--text)' },
            { label: '最初の半年', val: '100%還元', sub: '月額全額キャッシュバック', color: 'var(--green)' },
            { label: '半年後〜永久', val: '50%還元', sub: '月額の50%を代理店に', color: 'var(--purple)' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>{s.label}</div>
              <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10.5px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
