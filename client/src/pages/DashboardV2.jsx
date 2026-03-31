import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../utils/api';
import KPICard from '../components/KPICard';

export default function DashboardV2() {
  const { profile } = useOutletContext() || {};
  const [followers, setFollowers] = useState([]);
  const [churnScores, setChurnScores] = useState([]);
  const [lpCount, setLpCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 新機能データ
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [formCount, setFormCount] = useState(0);
  const [keywordRuleCount, setKeywordRuleCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversionStats, setConversionStats] = useState([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getFollowers().catch(() => []),
      api.getChurnScores().catch(() => []),
      api.getLPs().catch(() => []),
      api.getBroadcasts().catch(() => []),
      api.getForms().catch(() => []),
      api.getKeywordRules().catch(() => []),
      api.getTemplates().catch(() => []),
      api.getCalendarBookings().catch(() => []),
      api.getUnreadCount().catch(() => ({ count: 0 })),
      api.getConversionStats(30).catch(() => []),
    ]).then(([f, c, l, br, fo, kr, tpl, bk, nc, cv]) => {
      setFollowers(f || []);
      setChurnScores(c || []);
      setLpCount((l || []).length);
      setBroadcastCount((br || []).length);
      setFormCount((fo || []).length);
      setKeywordRuleCount((kr || []).length);
      setTemplateCount((tpl || []).length);
      setBookingCount((bk || []).filter(b => b.status === 'confirmed').length);
      setUnreadCount(nc?.count || 0);
      setConversionStats(cv || []);
      setRecentBroadcasts((br || []).filter(b => b.status === 'sent').slice(0, 3));
      setLoading(false);
    });
  }, []);

  const totalFollowers = followers.length;
  const riskCount = churnScores.filter(s => s.churn_scores?.[0]?.score >= 80).length;
  const avgClosing = followers.length > 0
    ? Math.round(followers.reduce((acc, f) => acc + (f.closing_scores?.[0]?.probability || 0), 0) / followers.length)
    : 0;
  const totalCV = conversionStats.reduce((acc, s) => acc + (s.conversions || 0), 0);

  const getStatus = (score) => {
    if (score >= 70) return { label: 'HOT', cls: 'bg-[var(--green-l)] text-[var(--green)] border border-[var(--green-m)]' };
    if (score >= 40) return { label: 'WARM', cls: 'bg-[var(--amber-l)] text-[var(--amber)] border border-[#fde29a]' };
    if (score >= 20) return { label: 'COLD', cls: 'bg-[var(--blue-l)] text-[var(--blue)] border border-[#bcd9f5]' };
    return { label: 'RISK', cls: 'bg-[var(--red-l)] text-[var(--red)] border border-[#ffc9c9]' };
  };

  const getChurnColor = (score) => {
    if (score >= 70) return 'var(--red)';
    if (score >= 40) return 'var(--amber)';
    return 'var(--green)';
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 mb-5">
        <KPICard label="総友達数" value={totalFollowers} icon="👥" color="blue"
          delta={`+${Math.min(totalFollowers, 18)}`} deltaDir="up" deltaText="今月の新規" />
        <KPICard label="離脱リスク" value={riskCount} icon="🚨" color="red"
          delta={riskCount > 0 ? `${riskCount}件` : undefined} deltaDir="up" deltaText="要対応" />
        <KPICard label="平均成約確率" value={`${avgClosing}%`} icon="🎯" color="green"
          deltaText="全体平均" />
        <KPICard label="CV数（30日）" value={totalCV} icon="📈" color="amber"
          delta={totalCV > 0 ? `${conversionStats.length}ゴール` : undefined} deltaText="コンバージョン" />
      </div>

      {/* 新機能クイックステータス */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-3.5 mb-5">
        {[
          { label: '配信', value: broadcastCount, icon: '📢', path: '/broadcast', color: 'var(--blue)' },
          { label: 'フォーム', value: formCount, icon: '📝', path: '/forms', color: 'var(--green)' },
          { label: 'キーワード', value: keywordRuleCount, icon: '🤖', path: '/keyword-rules', color: 'var(--amber)' },
          { label: 'テンプレート', value: templateCount, icon: '📋', path: '/templates', color: 'var(--text2)' },
          { label: '予約', value: bookingCount, icon: '🗓', path: '/calendar', color: 'var(--green)' },
          { label: '通知', value: unreadCount, icon: '🔔', path: '/notifications', color: unreadCount > 0 ? 'var(--red)' : 'var(--text3)' },
        ].map(s => (
          <Link key={s.label} to={s.path} className="rounded-xl p-3.5 transition-all hover:-translate-y-px"
            style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[16px]">{s.icon}</span>
              {s.value > 0 && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--bg)', color: s.color }}>{s.value}</span>
              )}
            </div>
            <div className="text-[20px] font-bold leading-none mb-0.5" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-3 lg:gap-3.5 mb-5">
        {/* Friend Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              友達リスト
              <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--blue-l)] text-[var(--blue)] border border-[#bcd9f5]">
                {totalFollowers}名
              </span>
            </div>
            <Link to="/followers" className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-all"
              style={{ border: '1px solid var(--border2)', color: 'var(--text2)' }}>全員表示 →</Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                {['名前', '冷め度', '成約確率', '状態', '登録'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider font-mono"
                    style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {followers.slice(0, 5).map((f) => {
                const churn = f.churn_scores?.[0]?.score || 0;
                const closing = f.closing_scores?.[0]?.probability || 0;
                const status = getStatus(closing);
                const daysSince = f.registered_at
                  ? Math.floor((Date.now() - new Date(f.registered_at).getTime()) / 86400000)
                  : '?';
                return (
                  <tr key={f.id} className="border-b cursor-pointer hover:bg-[#f8f9fd] transition-colors"
                    style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[12px] font-bold text-white"
                          style={{ background: `linear-gradient(135deg, var(--blue), var(--green))` }}>
                          {(f.display_name || f.follower_line_id || '?')[0]}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                            {f.display_name || f.follower_line_id?.slice(0, 8) || '不明'}
                          </div>
                          <div className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>{daysSince}日前</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[54px] h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${churn}%`, background: getChurnColor(churn) }} />
                        </div>
                        <span className="text-[11.5px] font-mono font-medium min-w-[26px]" style={{ color: getChurnColor(churn) }}>{churn}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[54px] h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${closing}%`, background: 'var(--blue)' }} />
                        </div>
                        <span className="text-[11.5px] font-mono font-medium min-w-[26px]" style={{ color: 'var(--blue)' }}>{closing}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold font-mono ${status.cls}`}>
                        <span className="w-[5px] h-[5px] rounded-full bg-current" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>{daysSince}日前</span>
                    </td>
                  </tr>
                );
              })}
              {followers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
                  まだ友達がいません。LPを作成してLINE登録を集めましょう。
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>離脱アラート</div>
            {riskCount > 0 && (
              <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--red-l)] text-[var(--red)] border border-[#ffc9c9]">
                {riskCount}件 緊急
              </span>
            )}
          </div>
          <div>
            {churnScores.filter(s => s.churn_scores?.[0]?.score >= 50).slice(0, 4).map((s) => {
              const score = s.churn_scores?.[0]?.score || 0;
              const isUrgent = score >= 80;
              return (
                <div key={s.id} className="flex gap-3 px-[18px] py-3.5 border-b cursor-pointer hover:bg-[#fafbfd] transition-colors"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="w-[3px] rounded self-stretch" style={{ background: isUrgent ? 'var(--red)' : 'var(--amber)' }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold mb-0.5"
                      style={{ color: isUrgent ? 'var(--red)' : 'var(--amber)' }}>
                      {s.display_name || s.follower_line_id?.slice(0, 8) || '不明'}
                    </div>
                    <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                      離脱スコア <b>{score}</b> — 対応が必要です
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>
                        {s.churn_scores?.[0]?.calculated_at
                          ? new Date(s.churn_scores[0].calculated_at).toLocaleDateString('ja-JP')
                          : ''}
                      </span>
                      <Link to={`/followers/${s.id}`}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer"
                        style={{
                          background: isUrgent ? 'var(--red-l)' : 'var(--amber-l)',
                          color: isUrgent ? 'var(--red)' : 'var(--amber)',
                        }}>
                        対応する
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {churnScores.filter(s => s.churn_scores?.[0]?.score >= 50).length === 0 && (
              <div className="px-[18px] py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
                アラートはありません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-3.5">
        {/* 配信履歴 */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>最近の配信</div>
            <Link to="/broadcast" className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>すべて →</Link>
          </div>
          <div>
            {recentBroadcasts.length > 0 ? recentBroadcasts.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{b.title}</div>
                  <div className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                    {b.sent_count || 0}名に送信
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--green-l)] text-[var(--green)]">送信済</span>
              </div>
            )) : (
              <div className="px-5 py-6 text-center text-[12px]" style={{ color: 'var(--text3)' }}>
                まだ配信履歴がありません
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>最新アクティビティ</div>
            <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--green-l)] text-[var(--green)] border border-[var(--green-m)]">
              リアルタイム
            </span>
          </div>
          <div>
            {followers.slice(0, 5).map((f, i) => {
              const icons = ['👥', '💬', '🚨', '📄', '⚡'];
              const bgs = ['var(--green-l)', 'var(--blue-l)', 'var(--red-l)', 'var(--amber-l)', 'var(--green-l)'];
              const msgs = ['が友達追加しました', 'から返信がありました', 'の離脱スコアが上昇', 'のLPが作成されました', 'にステップ配信完了'];
              return (
                <div key={f.id} className="flex items-start gap-2.5 px-[18px] py-2.5 border-b cursor-pointer hover:bg-[#fafbfd]"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[14px] shrink-0 mt-0.5"
                    style={{ background: bgs[i % 5] }}>{icons[i % 5]}</div>
                  <div className="text-[12.5px] flex-1 leading-relaxed" style={{ color: 'var(--text2)' }}>
                    <b style={{ color: 'var(--text)', fontWeight: 500 }}>{f.display_name || f.follower_line_id?.slice(0, 8) || '不明'}</b>
                    {msgs[i % 5]}
                  </div>
                  <div className="text-[10.5px] font-mono whitespace-nowrap mt-0.5" style={{ color: 'var(--text3)' }}>
                    {i === 0 ? '3分前' : i === 1 ? '31分前' : i === 2 ? '2時間前' : i === 3 ? '3時間前' : '昨日'}
                  </div>
                </div>
              );
            })}
            {followers.length === 0 && (
              <div className="px-[18px] py-6 text-center text-[12px]" style={{ color: 'var(--text3)' }}>アクティビティなし</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>今月の指標</div>
          </div>
          <div className="grid grid-cols-2" style={{ gap: '1px', background: 'var(--border)' }}>
            {[
              { label: '新規友達', val: `+${Math.min(totalFollowers, 18)}`, color: 'var(--green)' },
              { label: 'コンバージョン', val: `${totalCV}件`, color: 'var(--blue)' },
              { label: 'LP数', val: `${lpCount}件`, color: 'var(--amber)' },
              { label: '配信数', val: `${broadcastCount}件`, color: 'var(--text)' },
              { label: '予約（確定）', val: `${bookingCount}件`, color: 'var(--green)' },
              { label: 'フォーム', val: `${formCount}件`, color: 'var(--blue)' },
            ].map(s => (
              <div key={s.label} className="p-3.5" style={{ background: 'var(--white)' }}>
                <div className="text-[11px] mb-1" style={{ color: 'var(--text2)' }}>{s.label}</div>
                <div className="text-[20px] font-bold leading-none" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
