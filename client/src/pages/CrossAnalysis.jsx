import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const CHANNEL_LABELS = {
  tiktok: 'TikTok', youtube: 'YouTube', x: 'X', note: 'note',
  seo: 'SEO', referral: '紹介', ad: '広告', agency: '代理店',
  direct: '直接', qr: 'QR', richmenu: 'リッチメニュー', other: 'その他',
};

export default function CrossAnalysis() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [days]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await api.getCrossAnalysis(days);
      setData(result);
    } catch { }
    finally { setLoading(false); }
  }

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>クロス分析</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>チャネル別パフォーマンスを多軸で分析</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg text-[12px] font-mono"
          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
          <option value={7}>7日間</option>
          <option value={14}>14日間</option>
          <option value={30}>30日間</option>
          <option value={90}>90日間</option>
        </select>
      </div>

      {/* KPIカード */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text3)' }}>総フォロワー</div>
            <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--blue)' }}>{data.totalFollowers || 0}</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text3)' }}>チャネル数</div>
            <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--green)' }}>{data.channels?.length || 0}</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text3)' }}>最高成約率CH</div>
            <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--purple)' }}>
              {data.channels?.length ? CHANNEL_LABELS[data.channels.sort((a, b) => b.closingRate - a.closingRate)[0]?.channel] || '—' : '—'}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text3)' }}>期間</div>
            <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--text)' }}>{data.period}</div>
          </div>
        </div>
      )}

      {/* チャネル別テーブル */}
      {data?.channels?.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  {['チャネル', '登録数', 'ブロック率', 'ステップ完了率', '成約率', '平均冷め度'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                      style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.channels.map(ch => (
                  <tr key={ch.channel} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        {CHANNEL_LABELS[ch.channel] || ch.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-bold font-mono" style={{ color: 'var(--blue)' }}>{ch.registrations}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono" style={{ color: ch.blockRate > 20 ? 'var(--red)' : 'var(--text2)' }}>
                        {ch.blockRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-[50px] h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${ch.stepCompletionRate}%`, background: 'var(--green)' }} />
                        </div>
                        <span className="text-[12px] font-mono" style={{ color: 'var(--text2)' }}>{ch.stepCompletionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono font-semibold" style={{ color: ch.closingRate > 0 ? 'var(--green)' : 'var(--text3)' }}>
                        {ch.closingRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono" style={{
                        color: ch.avgChurnScore == null ? 'var(--text3)' : ch.avgChurnScore <= 30 ? 'var(--green)' : ch.avgChurnScore <= 60 ? 'var(--amber)' : 'var(--red)'
                      }}>
                        {ch.avgChurnScore != null ? ch.avgChurnScore : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📈</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだデータがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>LINE友達が登録されるとチャネル別分析が利用できます</p>
        </div>
      )}

      {/* 日別推移 */}
      {data?.daily?.length > 0 && (
        <div className="rounded-xl p-5 mt-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>日別登録推移</h3>
          <div className="flex items-end gap-1" style={{ height: '120px' }}>
            {data.daily.map(d => {
              const maxDaily = Math.max(...data.daily.map(x => x.count));
              const height = maxDaily > 0 ? Math.max((d.count / maxDaily) * 100, 4) : 4;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text3)' }}>{d.count}</span>
                  <div className="w-full rounded-t" style={{ height: `${height}%`, background: 'var(--blue)', opacity: 0.7 }} />
                  <span className="text-[8px] font-mono" style={{ color: 'var(--text3)' }}>
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
