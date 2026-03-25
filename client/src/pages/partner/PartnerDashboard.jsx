import React, { useState } from 'react';
import KPICard from '../../components/KPICard';

const CUSTOMERS = [
  { id: 1, name: '田中 コーチング', plan: 'pro', monthly: 29800, share: 14900, date: '2026.01.08', status: 'active', initial: '田', gradient: 'linear-gradient(135deg,#0ca974,#00bcd4)' },
  { id: 2, name: '加藤 副業スクール', plan: 'pro', monthly: 29800, share: 14900, date: '2026.02.01', status: 'active', initial: '加', gradient: 'linear-gradient(135deg,#6941c6,#9c6fe4)' },
  { id: 3, name: '中村 マーケコンサル', plan: 'standard', monthly: 9800, share: 4900, date: '2026.01.15', status: 'active', initial: '中', gradient: 'linear-gradient(135deg,#1a6fc4,#0891b2)' },
  { id: 4, name: '小林 情報商材', plan: 'standard', monthly: 9800, share: 4900, date: '2026.02.18', status: 'active', initial: '小', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)' },
  { id: 5, name: '吉田 ダイエット講座', plan: 'standard', monthly: 0, share: 0, date: '2025.12.01', status: 'churned', initial: '吉', gradient: 'linear-gradient(135deg,#d93025,#f97316)' },
];

const PLAN_TAG = { standard: 'bg-[var(--blue-l)] text-[var(--blue)] border-[#b3d1f5]', pro: 'bg-[var(--purple-l)] text-[var(--purple)] border-[var(--purple-m)]', vip: 'bg-[var(--amber-l)] text-[var(--amber)] border-[#fde29a]', monitor: 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]' };
const STATUS_TAG = { active: 'bg-[var(--green-l)] text-[var(--green)] border-[var(--green-m)]', churned: 'bg-[var(--red-l)] text-[var(--red)] border-[#ffc9c9]' };

const REV_DATA = [
  { month: '10月', val: 0, h: 4 }, { month: '11月', val: 14900, h: 24 }, { month: '12月', val: 29800, h: 38 },
  { month: '1月', val: 44700, h: 52 }, { month: '2月', val: 59200, h: 66 }, { month: '3月', val: 74100, h: 80, current: true },
];

const NOTICES = [
  { unread: true, icon: '🎉', bg: 'var(--green-l)', text: '<b>小林 情報商材</b>が STANDARD に新規契約しました。取り分 ¥4,900/月が発生します。', time: '2日前' },
  { unread: true, icon: '📢', bg: 'var(--purple-l)', text: '<b>GRIP運営</b>より：4月より VIPプランの代理店還元率が 50% → 55% に変更されます。', time: '5日前' },
  { unread: false, icon: '❌', bg: 'var(--red-l)', text: '<b>吉田 ダイエット講座</b>が STANDARD を解約しました。今月の取り分は ¥0 になります。', time: '12日前' },
  { unread: false, icon: '⬆', bg: 'var(--amber-l)', text: '<b>田中 コーチング</b>が STANDARD → PRO にアップグレード。取り分が +¥10,000 増加しました。', time: '18日前' },
];

export default function PartnerDashboard() {
  const [copied, setCopied] = useState(false);
  const referralUrl = 'https://grip.jp/r/yamada-2025';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCustomers = CUSTOMERS.filter(c => c.status === 'active');
  const monthlyRevenue = activeCustomers.reduce((a, c) => a + c.share, 0);

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KPICard label="アクティブ契約数" value={activeCustomers.length} icon="🤝" color="purple"
          delta="+2" deltaDir="up" deltaText="今月の新規" />
        <KPICard label="今月の収益" value={`¥${monthlyRevenue.toLocaleString()}`} icon="💴" color="green"
          delta="+¥14,900" deltaDir="up" deltaText="前月比 +25%" />
        <KPICard label="累計収益" value="¥247,000" icon="🏦" color="blue"
          deltaText="2025年11月〜" />
        <KPICard label="紹介リンク クリック" value="342" icon="👆" color="amber"
          delta="+87" deltaDir="up" deltaText="前月比" />
      </div>

      {/* Body Grid */}
      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Customer Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
              紹介顧客一覧
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--purple-l)] text-[var(--purple)] border border-[var(--purple-m)]">
                {CUSTOMERS.length}名
              </span>
            </div>
            <button className="px-2.5 py-1 rounded text-[11.5px] font-medium" style={{ border: '1px solid var(--border2)', color: 'var(--text2)' }}>全件表示 →</button>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {['顧客名', 'プラン', '月額', '自分の取り分', '契約日', 'ステータス'].map(h => (
                  <th key={h} className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                    style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map(c => (
                <tr key={c.id} className="border-b cursor-pointer hover:bg-[#f6f7fb]" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: c.gradient }}>{c.initial}</div>
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</div>
                        <div className="text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>{c.date} 契約</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${PLAN_TAG[c.plan]}`}>
                      {c.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-mono text-[12.5px] font-medium" style={{ color: c.monthly > 0 ? 'var(--text2)' : 'var(--text3)' }}>
                      ¥{c.monthly.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-mono text-[12.5px] font-semibold" style={{ color: c.share > 0 ? 'var(--green)' : 'var(--text3)' }}>
                      ¥{c.share.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>{c.date}</span>
                  </td>
                  <td className="px-3.5 py-2.5">
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

        {/* Link Panel */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>紹介リンク管理</div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--purple-l)] text-[var(--purple)] border border-[var(--purple-m)]">専用URL</span>
          </div>
          <div className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--text3)' }}>あなたの紹介URL</div>
            <div className="flex rounded-[7px] overflow-hidden mb-3.5" style={{ border: '1px solid var(--border2)' }}>
              <div className="flex-1 px-3 py-2 text-[11.5px] font-mono truncate" style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                {referralUrl}
              </div>
              <button onClick={handleCopy}
                className="px-3.5 py-2 text-[12px] font-medium text-white shrink-0 flex items-center gap-1 transition-colors"
                style={{ background: copied ? 'var(--green)' : 'var(--text)' }}>
                {copied ? '✓ コピー済' : 'コピー'}
              </button>
            </div>

            <div className="rounded-lg p-3.5 flex flex-col items-center gap-2 mb-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-20 h-20 rounded-md flex items-center justify-center text-[32px]" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>⬛</div>
              <div className="text-[11px] text-center" style={{ color: 'var(--text3)' }}>QRコードをダウンロードして<br />名刺・提案書に貼り付けて使用</div>
              <button className="px-3 py-1 rounded-[7px] text-[12px] font-medium" style={{ background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>📥 QR画像を保存</button>
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--text3)' }}>今月のリンク実績</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: '342', label: 'クリック数', color: 'var(--amber)' },
                { val: '2.3%', label: '成約率', color: 'var(--green)' },
                { val: '18', label: 'LP到達', color: 'var(--blue)' },
                { val: String(activeCustomers.length), label: '契約済', color: 'var(--purple)' },
              ].map(s => (
                <div key={s.label} className="rounded-[7px] px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-[18px] font-bold" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--text3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 220px 260px' }}>
        {/* Revenue Chart */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>月別収益推移</div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>直近6ヶ月</span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2.5 h-20">
              {REV_DATA.map(d => (
                <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t min-h-[4px]" style={{ height: `${d.h}px`, background: d.current ? 'var(--purple)' : 'var(--border)' }} />
                  <span className={`text-[9.5px] font-mono ${d.current ? 'font-semibold' : ''}`}
                    style={{ color: d.current ? 'var(--purple)' : 'var(--text3)' }}>{d.month}</span>
                  <span className={`text-[9px] font-mono ${d.current ? 'font-semibold' : ''}`}
                    style={{ color: d.current ? 'var(--purple)' : 'var(--text2)' }}>¥{d.val.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text3)' }}>次回振込予定：<span className="font-medium" style={{ color: 'var(--text)' }}>2026年4月5日</span></span>
              <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--green)' }}>前月比 +25% ↑</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>紹介実績サマリー</div>
          </div>
          <div className="p-4">
            {[
              { label: '今月の紹介数', val: '2件', sub: '累計 8件', color: 'var(--purple)' },
              { label: '成約率', val: '44.4%', sub: '8成約 / 18アクセス', color: 'var(--blue)' },
              { label: '平均顧客単価', val: '¥18,550', sub: '取り分 avg ¥9,275', color: 'var(--green)' },
            ].map((s, i) => (
              <div key={s.label}>
                {i > 0 && <div className="h-px my-3" style={{ background: 'var(--border)' }} />}
                <div className="text-[11px] mb-1" style={{ color: 'var(--text2)' }}>{s.label}</div>
                <div className="text-[22px] font-bold leading-none" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
                <div className="text-[10.5px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notices */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>お知らせ</div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--purple-l)] text-[var(--purple)] border border-[var(--purple-m)]">
              {NOTICES.filter(n => n.unread).length}件 未読
            </span>
          </div>
          {NOTICES.map((n, i) => (
            <div key={i} className="flex gap-2.5 px-4 py-2.5 border-b cursor-pointer hover:bg-[#f6f7fb]" style={{ borderColor: 'var(--border)' }}>
              {n.unread ? <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--purple)' }} /> : <div className="w-1.5 shrink-0" />}
              <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0 mt-0.5" style={{ background: n.bg }}>{n.icon}</div>
              <div className="text-[12px] flex-1 leading-relaxed" style={{ color: 'var(--text2)' }} dangerouslySetInnerHTML={{ __html: n.text }} />
              <div className="text-[10px] font-mono whitespace-nowrap mt-0.5" style={{ color: 'var(--text3)' }}>{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
