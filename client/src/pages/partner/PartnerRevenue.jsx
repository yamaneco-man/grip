import React from 'react';
import KPICard from '../../components/KPICard';

const REV_DATA = [
  { month: '10月', val: 0, h: 4 }, { month: '11月', val: 14900, h: 24 }, { month: '12月', val: 29800, h: 38 },
  { month: '1月', val: 44700, h: 52 }, { month: '2月', val: 59200, h: 66 }, { month: '3月', val: 74100, h: 80, current: true },
];

export default function PartnerRevenue() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>収益レポート</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>月別収益推移・振込履歴・明細</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard label="今月の収益" value="¥74,100" icon="💴" color="green" delta="+¥14,900" deltaDir="up" deltaText="前月比" />
        <KPICard label="累計収益" value="¥247,000" icon="🏦" color="blue" deltaText="2025年11月〜" />
        <KPICard label="アクティブ顧客" value="4" icon="🤝" color="purple" deltaText="契約中" />
        <KPICard label="還元率" value="50%" icon="📊" color="amber" deltaText="永久還元" />
      </div>

      {/* 月別推移 */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>月別収益推移</div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-3 h-24">
            {REV_DATA.map(d => (
              <div key={d.month} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full rounded-t min-h-[4px]"
                  style={{ height: `${d.h}px`, background: d.current ? 'var(--purple)' : 'var(--border)' }} />
                <span className={`text-[10px] font-mono ${d.current ? 'font-semibold' : ''}`}
                  style={{ color: d.current ? 'var(--purple)' : 'var(--text3)' }}>{d.month}</span>
                <span className={`text-[9px] font-mono ${d.current ? 'font-semibold' : ''}`}
                  style={{ color: d.current ? 'var(--purple)' : 'var(--text2)' }}>¥{d.val.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 振込履歴 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>振込履歴</div>
        </div>
        <div className="px-5 py-6 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
          振込履歴は決済開始後に表示されます
        </div>
      </div>
    </div>
  );
}
