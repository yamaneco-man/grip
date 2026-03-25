import React from 'react';
import KPICard from '../../components/KPICard';

// ダミーデータ（後でAPI化）
const CONTRACTS = [
  { id: 1, name: '田中 コーチング', email: 'tanaka@gmail.com', plan: 'pro', mrr: 29800, date: '2026.01.08', source: '山田代理店', sourceType: 'agency', status: 'active', initial: '田', gradient: 'linear-gradient(135deg,#0ca974,#00bcd4)' },
  { id: 2, name: '佐藤 情報発信', email: 'sato.info@gmail.com', plan: 'standard', mrr: 9800, date: '2026.01.22', source: '直接', sourceType: 'direct', status: 'active', initial: '佐', gradient: 'linear-gradient(135deg,#1a6fc4,#6941c6)' },
  { id: 3, name: '山本 セールスコンサル', email: 'yamamoto@sales.co', plan: 'vip', mrr: 98000, date: '2025.12.01', source: '鈴木代理店', sourceType: 'agency', status: 'active', initial: '山', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)' },
  { id: 4, name: '鈴木 オンライン講座', email: 'suzuki.lec@gmail.com', plan: 'standard', mrr: 0, date: '2025.11.15', source: '直接', sourceType: 'direct', status: 'churned', initial: '鈴', gradient: 'linear-gradient(135deg,#d93025,#f97316)' },
  { id: 5, name: '伊藤 美容サロン', email: 'ito.salon@beauty.jp', plan: 'monitor', mrr: 4980, date: '2026.02.14', source: '直接', sourceType: 'direct', status: 'trial', initial: '伊', gradient: 'linear-gradient(135deg,#6941c6,#ec4899)' },
  { id: 6, name: '加藤 副業スクール', email: 'kato.school@gmail.com', plan: 'pro', mrr: 29800, date: '2026.02.01', source: '山田代理店', sourceType: 'agency', status: 'active', initial: '加', gradient: 'linear-gradient(135deg,#0891b2,#0ca974)' },
];

const AGENCIES = [
  { name: '山田代理店', icon: '🏢', since: '2025.11', contracts: 5, mrr: 148200 },
  { name: '鈴木代理店', icon: '🏬', since: '2026.01', contracts: 4, mrr: 127600 },
  { name: '中村代理店', icon: '🏪', since: '2026.02', contracts: 2, mrr: 39600 },
];

const PLAN_TAG = { monitor: 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]', standard: 'bg-[var(--blue-l)] text-[var(--blue)] border-[#b3d1f5]', pro: 'bg-[var(--purple-l)] text-[var(--purple)] border-[var(--purple-m)]', vip: 'bg-[var(--amber-l)] text-[var(--amber)] border-[#fde29a]' };
const STATUS_TAG = { active: 'bg-[var(--green-l)] text-[var(--green)] border-[var(--green-m)]', churned: 'bg-[var(--red-l)] text-[var(--red)] border-[#ffc9c9]', trial: 'bg-[var(--amber-l)] text-[var(--amber)] border-[#fde29a]' };
const STATUS_LABEL = { active: 'ACTIVE', churned: 'CHURNED', trial: 'TRIAL' };

const MRR_DATA = [
  { month: '10月', val: 48000, h: 22 }, { month: '11月', val: 98000, h: 38 }, { month: '12月', val: 196000, h: 54 },
  { month: '1月', val: 264000, h: 66 }, { month: '2月', val: 334200, h: 74 }, { month: '3月', val: 382400, h: 80, current: true },
  { month: '4月予', val: 450000, h: 88, projected: true },
];

const EVENTS = [
  { icon: '🎉', bg: 'var(--green-l)', name: '加藤 副業スクール', action: 'が PROに新規契約', time: '2時間前' },
  { icon: '🤝', bg: 'var(--purple-l)', name: '中村代理店', action: 'が代理店契約を締結', time: '昨日' },
  { icon: '⬆', bg: 'var(--amber-l)', name: '山本 セールスコンサル', action: 'が PRO→VIP にアップグレード', time: '3日前' },
  { icon: '❌', bg: 'var(--red-l)', name: '鈴木 オンライン講座', action: 'が STANDARD を解約', time: '5日前' },
  { icon: '🎉', bg: 'var(--green-l)', name: '伊藤 美容サロン', action: 'が MONITOR で新規登録', time: '9日前' },
];

export default function AdminDashboard() {
  const totalMRR = CONTRACTS.reduce((a, c) => a + c.mrr, 0);
  const agencyMRR = AGENCIES.reduce((a, c) => a + c.mrr, 0);

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KPICard label="総MRR" value={`¥${totalMRR.toLocaleString()}`} icon="💴" color="green"
          delta="+¥48,200" deltaDir="up" deltaText="前月比 +14.4%" />
        <KPICard label="総契約者数" value={CONTRACTS.length} icon="👥" color="blue"
          delta="+6" deltaDir="up" deltaText="今月の新規" />
        <KPICard label="月間チャーン率" value="8.2%" icon="📉" color="red"
          delta="▲ 目標超過" deltaDir="down" deltaText="目標 5%以下" />
        <KPICard label="代理店経由契約" value={CONTRACTS.filter(c => c.sourceType === 'agency').length} icon="🤝" color="purple"
          delta="+3" deltaDir="up" deltaText={`全体の${Math.round(CONTRACTS.filter(c=>c.sourceType==='agency').length/CONTRACTS.length*100)}%`} />
      </div>

      {/* Body Grid */}
      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Contracts Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
              契約者一覧 <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--blue-l)] text-[var(--blue)] border border-[#b3d1f5]">{CONTRACTS.length}名</span>
            </div>
            <button className="px-2.5 py-1 rounded text-[11.5px] font-medium" style={{ border: '1px solid var(--border2)', color: 'var(--text2)' }}>全件表示 →</button>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {['契約者', 'プラン', 'MRR貢献', '開始日', '流入経路', 'ステータス'].map(h => (
                  <th key={h} className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                    style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map(c => (
                <tr key={c.id} className="border-b cursor-pointer hover:bg-[#f6f7fb]" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: c.gradient }}>{c.initial}</div>
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</div>
                        <div className="text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${PLAN_TAG[c.plan]}`}>
                      {c.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-mono text-[12.5px] font-medium" style={{ color: c.mrr > 0 ? 'var(--green)' : 'var(--text3)' }}>
                      ¥{c.mrr.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>{c.date}</span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text2)' }}>
                      <div className="w-[5px] h-[5px] rounded-full" style={{ background: c.sourceType === 'agency' ? 'var(--purple)' : 'var(--green)' }} />
                      {c.source}
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${STATUS_TAG[c.status]}`}>
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agency Panel */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>代理店実績</div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--purple-l)] text-[var(--purple)] border border-[var(--purple-m)]">{AGENCIES.length}社</span>
          </div>
          {AGENCIES.map(a => (
            <div key={a.name} className="flex items-center gap-2.5 px-4 py-3 border-b cursor-pointer hover:bg-[#f6f7fb]" style={{ borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] shrink-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}>{a.icon}</div>
              <div className="flex-1">
                <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{a.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>契約開始：{a.since} / 契約{a.contracts}件 / 還元50%</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[13px] font-medium" style={{ color: 'var(--green)' }}>¥{a.mrr.toLocaleString()}</div>
                <div className="text-[11px]" style={{ color: 'var(--green)' }}>運営取り分 ¥{(a.mrr / 2).toLocaleString()}</div>
              </div>
            </div>
          ))}
          <div className="px-4 py-3" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center">
              <span className="text-[11.5px] font-medium" style={{ color: 'var(--text2)' }}>代理店経由 合計MRR</span>
              <span className="font-mono text-[14px] font-semibold" style={{ color: 'var(--purple)' }}>¥{agencyMRR.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[10.5px]" style={{ color: 'var(--text3)' }}>代理店還元（50%）: ¥{(agencyMRR / 2).toLocaleString()}</span>
              <span className="text-[10.5px] font-medium" style={{ color: 'var(--green)' }}>運営取り分: ¥{(agencyMRR / 2).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 200px 260px' }}>
        {/* MRR Chart */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>MRR推移</div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>直近6ヶ月</span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2 h-20">
              {MRR_DATA.map(d => (
                <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-full rounded-t transition-colors ${d.projected ? 'border-[1.5px] border-dashed' : ''}`}
                    style={{
                      height: `${d.h}px`, minHeight: '4px',
                      background: d.current ? 'var(--text)' : d.projected ? 'transparent' : 'var(--border)',
                      borderColor: d.projected ? 'var(--text3)' : 'transparent',
                    }} />
                  <span className={`text-[9.5px] font-mono ${d.current ? 'font-semibold' : ''}`}
                    style={{ color: d.current ? 'var(--text)' : 'var(--text3)' }}>{d.month}</span>
                  <span className={`text-[9px] font-mono ${d.current ? 'font-semibold' : ''}`}
                    style={{ color: d.current ? 'var(--text)' : 'var(--text2)' }}>¥{(d.val / 10000).toFixed(1)}万</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3.5 mt-3 text-[11px]" style={{ color: 'var(--text2)' }}>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-1.5 rounded-sm" style={{ background: 'var(--text)' }} />当月</div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text3)' }}><div className="w-2.5 h-1.5 rounded-sm border-[1.5px] border-dashed" style={{ borderColor: 'var(--text3)' }} />予測</div>
              <span className="ml-auto font-mono font-medium" style={{ color: 'var(--green)' }}>先月比 +14.4% ↑</span>
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>プラン別分布</div>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'MONITOR', count: 4, pct: 12, color: '#94a3b8' },
              { label: 'STANDARD', count: 16, pct: 47, color: 'var(--blue)' },
              { label: 'PRO', count: 11, pct: 32, color: 'var(--purple)' },
              { label: 'VIP', count: 3, pct: 9, color: 'var(--amber)' },
            ].map(p => (
              <div key={p.label}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium" style={{ color: 'var(--text2)' }}>{p.label}</span>
                  <span className="font-mono" style={{ color: 'var(--text3)' }}>{p.count}名</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[10.5px] font-mono mb-1" style={{ color: 'var(--text3)' }}>ARPU（平均単価）</div>
              <div className="text-[20px] font-bold" style={{ letterSpacing: '-0.5px', color: 'var(--text)' }}>¥11,247</div>
              <div className="text-[10.5px] font-mono mt-0.5" style={{ color: 'var(--green)' }}>↑ +¥820 前月比</div>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>最新イベント</div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--green-l)] text-[var(--green)] border border-[var(--green-m)]">リアルタイム</span>
          </div>
          {EVENTS.map((e, i) => (
            <div key={i} className="flex gap-2.5 px-4 py-2.5 border-b cursor-pointer hover:bg-[#f6f7fb]" style={{ borderColor: 'var(--border)' }}>
              <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0 mt-0.5" style={{ background: e.bg }}>{e.icon}</div>
              <div className="text-[12px] flex-1 leading-relaxed" style={{ color: 'var(--text2)' }}>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{e.name}</span>{e.action}
              </div>
              <div className="text-[10px] font-mono whitespace-nowrap mt-0.5" style={{ color: 'var(--text3)' }}>{e.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
