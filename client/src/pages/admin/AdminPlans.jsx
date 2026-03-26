import React from 'react';

const PLANS = [
  { key: 'free', name: 'FREE', price: 0, color: 'var(--text3)', features: ['LP生成 3件', 'LINE追跡 50人', 'ダッシュボード'] },
  { key: 'monitor', name: 'MONITOR', price: 4980, color: 'var(--green)', features: ['LP無制限', 'LINE追跡 500人', '固定テンプレステップ', '週次離脱検知', '先着30名限定'] },
  { key: 'standard', name: 'STANDARD', price: 9800, color: 'var(--blue)', features: ['LP無制限', 'LINE追跡 500人', '固定テンプレステップ', '週次離脱検知'] },
  { key: 'pro', name: 'PRO', price: 29800, color: 'var(--purple)', features: ['LP無制限', 'LINE追跡 無制限', 'AI自動ステップ', '日次離脱検知', '反論処理AI'] },
  { key: 'vip', name: 'VIP', price: 98000, color: 'var(--amber)', features: ['全機能無制限', 'カスタムステップ', 'リアルタイム離脱検知', '専用コンサル', '優先サポート'] },
];

export default function AdminPlans() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>プラン設定</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>GRIPの料金プラン一覧・機能制限</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {PLANS.map(p => (
          <div key={p.key} className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: `3px solid ${p.color}` }}>
            <div className="text-[12px] font-mono font-semibold mb-1" style={{ color: p.color }}>{p.name}</div>
            <div className="text-[24px] font-bold mb-3" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {p.price === 0 ? '無料' : `¥${p.price.toLocaleString()}`}
              {p.price > 0 && <span className="text-[12px] font-normal" style={{ color: 'var(--text3)' }}>/月</span>}
            </div>
            <div className="space-y-1.5">
              {p.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 代理店還元率 */}
      <div className="mt-5 rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>代理店還元率設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>最初の半年間</div>
            <div className="text-[20px] font-bold" style={{ color: 'var(--green)' }}>100%</div>
            <div className="text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>全額キャッシュバック</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>半年後〜永久</div>
            <div className="text-[20px] font-bold" style={{ color: 'var(--purple)' }}>50%</div>
            <div className="text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>月額の50%を代理店に</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>代理店紹介ボーナス</div>
            <div className="text-[20px] font-bold" style={{ color: 'var(--amber)' }}>25%+</div>
            <div className="text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>契約料の最低25%</div>
          </div>
        </div>
      </div>

      {/* Square連携 */}
      <div className="mt-5 rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>決済連携</h3>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
          <span className="text-[13px]" style={{ color: 'var(--text2)' }}>Square決済</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">接続済み</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>手数料 3.6%（オンライン）</span>
        </div>
      </div>
    </div>
  );
}
