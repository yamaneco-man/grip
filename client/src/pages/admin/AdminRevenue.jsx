import React from 'react';
import KPICard from '../../components/KPICard';

const MRR_DATA = [
  { month: '10月', val: 0, h: 4 }, { month: '11月', val: 0, h: 4 }, { month: '12月', val: 0, h: 4 },
  { month: '1月', val: 0, h: 4 }, { month: '2月', val: 0, h: 4 }, { month: '3月', val: 0, h: 4, current: true },
];

export default function AdminRevenue() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>収益レポート</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>MRR推移・プラン別収益・代理店別収益</p>

      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KPICard label="総MRR" value="¥0" icon="💴" color="green" deltaText="ローンチ後に計測開始" />
        <KPICard label="直接契約MRR" value="¥0" icon="👤" color="blue" deltaText="直接獲得分" />
        <KPICard label="代理店MRR" value="¥0" icon="🤝" color="purple" deltaText="代理店経由分" />
        <KPICard label="ARPU" value="¥0" icon="📊" color="amber" deltaText="平均顧客単価" />
      </div>

      {/* MRR Chart */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>MRR推移</div>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
            style={{ background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>直近6ヶ月</span>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-3 h-24">
            {MRR_DATA.map(d => (
              <div key={d.month} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full rounded-t min-h-[4px]"
                  style={{ height: `${d.h}px`, background: d.current ? 'var(--text)' : 'var(--border)' }} />
                <span className="text-[10px] font-mono" style={{ color: d.current ? 'var(--text)' : 'var(--text3)' }}>{d.month}</span>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text3)' }}>¥{d.val.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t text-center text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
            ローンチ後、Square決済データから自動集計されます
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>プラン別収益内訳</h3>
          {['MONITOR ¥4,980', 'STANDARD ¥9,800', 'PRO ¥29,800', 'VIP ¥98,000'].map(p => (
            <div key={p} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[13px]" style={{ color: 'var(--text2)' }}>{p}</span>
              <span className="text-[13px] font-mono font-medium" style={{ color: 'var(--text3)' }}>0名 / ¥0</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>チャーン分析</h3>
          <div className="space-y-3">
            {[
              { label: '月間チャーン率', val: '0%', target: '目標: 5%以下', color: 'var(--green)' },
              { label: 'NRR', val: '—', target: '目標: 100%超', color: 'var(--text3)' },
              { label: 'LTV:CAC比', val: '—', target: '目標: 3倍以上', color: 'var(--text3)' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-[13px]" style={{ color: 'var(--text2)' }}>{s.label}</span>
                <div className="text-right">
                  <span className="text-[16px] font-bold" style={{ color: s.color }}>{s.val}</span>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>{s.target}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
