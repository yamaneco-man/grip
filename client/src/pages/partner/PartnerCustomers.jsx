import React from 'react';

// TODO: partner用APIから実データ取得に変更
const CUSTOMERS = [
  { id: 1, name: '田中 コーチング', plan: 'pro', monthly: 29800, share: 14900, date: '2026.01.08', status: 'active', initial: '田' },
  { id: 2, name: '加藤 副業スクール', plan: 'pro', monthly: 29800, share: 14900, date: '2026.02.01', status: 'active', initial: '加' },
  { id: 3, name: '中村 マーケコンサル', plan: 'standard', monthly: 9800, share: 4900, date: '2026.01.15', status: 'active', initial: '中' },
];

const PLAN_TAG = { standard: 'bg-blue-50 text-blue-700 border-blue-200', pro: 'bg-purple-50 text-purple-700 border-purple-200', vip: 'bg-amber-50 text-amber-700 border-amber-200' };
const STATUS_TAG = { active: 'bg-green-50 text-green-700 border-green-200', churned: 'bg-red-50 text-red-700 border-red-200' };

export default function PartnerCustomers() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>紹介顧客一覧</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>紹介経由の全顧客を管理</p>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              {['顧客名', 'プラン', '月額', 'あなたの取り分', '契約日', 'ステータス'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--purple), #9c6fe4)' }}>{c.initial}</div>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${PLAN_TAG[c.plan] || ''}`}>
                    {c.plan.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12.5px] font-mono" style={{ color: 'var(--text2)' }}>¥{c.monthly.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12.5px] font-mono font-semibold" style={{ color: 'var(--green)' }}>¥{c.share.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>{c.date}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${STATUS_TAG[c.status]}`}>
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {c.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* 月間サマリー */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'アクティブ顧客数', val: CUSTOMERS.filter(c => c.status === 'active').length, color: 'var(--purple)' },
          { label: '今月の取り分合計', val: `¥${CUSTOMERS.filter(c => c.status === 'active').reduce((a, c) => a + c.share, 0).toLocaleString()}`, color: 'var(--green)' },
          { label: '平均顧客単価', val: `¥${Math.round(CUSTOMERS.reduce((a, c) => a + c.monthly, 0) / CUSTOMERS.length).toLocaleString()}`, color: 'var(--blue)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>{s.label}</div>
            <div className="text-[22px] font-bold" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
