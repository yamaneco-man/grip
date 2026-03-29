import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const STAGE_COLORS = ['var(--blue)', 'var(--green)', 'var(--amber)', 'var(--red)'];

export default function FunnelAnalysis() {
  const [funnel, setFunnel] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [days]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getFunnel(days);
      setFunnel(data);
    } catch { }
    finally { setLoading(false); }
  }

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  const maxCount = funnel?.funnel?.[0]?.count || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>ファネル分析</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>LP閲覧から成約までの転換率を可視化</p>
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

      {funnel?.funnel && (
        <div className="rounded-xl p-6" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="space-y-4">
            {funnel.funnel.map((stage, i) => {
              const width = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 4) : 4;
              const prevCount = i > 0 ? funnel.funnel[i - 1].count : null;
              const dropOff = prevCount && prevCount > 0 ? Math.round((1 - stage.count / prevCount) * 100) : null;

              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{stage.stage}</span>
                      {dropOff != null && dropOff > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--red-l)', color: 'var(--red)' }}>
                          -{dropOff}% 離脱
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-bold font-mono" style={{ color: STAGE_COLORS[i] }}>
                        {stage.count.toLocaleString()}
                      </span>
                      {i > 0 && (
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                          ({stage.rate}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-[32px] rounded-lg overflow-hidden" style={{ background: 'var(--surface)' }}>
                    <div className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${width}%`, background: STAGE_COLORS[i], opacity: 0.85 }}>
                    </div>
                  </div>
                  {i < funnel.funnel.length - 1 && (
                    <div className="flex justify-center my-1">
                      <span className="text-[16px]" style={{ color: 'var(--text3)' }}>↓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* KPIサマリー */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            {funnel.funnel.map((stage, i) => (
              <div key={stage.stage} className="text-center p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--text3)' }}>{stage.stage}</div>
                <div className="text-[20px] font-bold font-mono" style={{ color: STAGE_COLORS[i] }}>
                  {stage.count.toLocaleString()}
                </div>
                {i > 0 && (
                  <div className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>転換率 {stage.rate}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!funnel?.funnel || funnel.funnel.every(s => s.count === 0)) && (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだデータがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>LPを公開してLINE友達が登録されるとファネル分析が利用できます</p>
        </div>
      )}
    </div>
  );
}
