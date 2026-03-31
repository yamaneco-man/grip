import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const GOAL_TYPES = [
  { key: 'url', label: 'URL訪問' },
  { key: 'tag', label: 'タグ付与' },
  { key: 'event', label: 'イベント参加' },
  { key: 'purchase', label: '購入' },
];

export default function ConversionTracker() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // フォーム
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState('url');

  // 統計
  const [stats, setStats] = useState(null);
  const [statsDays, setStatsDays] = useState(30);
  const [loadingStats, setLoadingStats] = useState(false);

  // イベント一覧
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    api.getConversionGoals().then(setGoals).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadStats = async (days) => {
    setStatsDays(days);
    setLoadingStats(true);
    try {
      const s = await api.getConversionStats(days);
      setStats(s);
    } catch {} finally { setLoadingStats(false); }
  };

  useEffect(() => {
    loadStats(30);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!goalName.trim()) return;
    setCreating(true);
    try {
      const created = await api.createConversionGoal({
        name: goalName.trim(),
        type: goalType,
      });
      setGoals([created, ...goals]);
      setGoalName('');
      setGoalType('url');
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このCVゴールを削除しますか？')) return;
    try {
      await api.deleteConversionGoal(id);
      setGoals(goals.filter(g => g.id !== id));
      if (selectedGoal?.id === id) setSelectedGoal(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEvents = async (goal) => {
    if (selectedGoal?.id === goal.id) { setSelectedGoal(null); return; }
    setSelectedGoal(goal);
    setLoadingEvents(true);
    try {
      const e = await api.getConversionEvents(goal.id);
      setEvents(e || []);
    } catch {} finally { setLoadingEvents(false); }
  };

  const formatDate = (d) => {
    if (!d) return '--';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>コンバージョン測定</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>CVゴールを設定してコンバージョンを追跡</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + ゴール作成
        </button>
      </div>

      {/* CV統計 */}
      {stats && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>CV統計</h3>
            <div className="flex gap-1">
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => loadStats(d)}
                  className="text-[10px] font-medium px-2 py-1 rounded"
                  style={{
                    background: statsDays === d ? 'var(--text)' : 'var(--surface)',
                    color: statsDays === d ? '#fff' : 'var(--text2)',
                  }}>
                  {d}日
                </button>
              ))}
            </div>
          </div>
          {loadingStats ? (
            <div className="text-center py-4" style={{ color: 'var(--text3)' }}>読み込み中...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{stats.total_conversions || 0}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>総CV数</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                <div className="text-[18px] font-bold" style={{ color: 'var(--green)' }}>{stats.conversion_rate || '0%'}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>CV率</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                <div className="text-[18px] font-bold" style={{ color: 'var(--accent)' }}>{stats.unique_users || 0}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>ユニークユーザー</div>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{stats.active_goals || 0}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>アクティブゴール</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ゴール作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規CVゴール</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ゴール名</label>
              <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} required
                placeholder="例: LP経由の購入" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイプ</label>
              <select value={goalType} onChange={e => setGoalType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {GOAL_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '作成中...' : '作成する'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* ゴール一覧 */}
      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map(goal => (
            <div key={goal.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{goal.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                      {GOAL_TYPES.find(t => t.key === goal.type)?.label || goal.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                    CV数: {goal.conversion_count || 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEvents(goal)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    {selectedGoal?.id === goal.id ? '閉じる' : 'イベント'}
                  </button>
                  <button onClick={() => handleDelete(goal.id)}
                    className="text-[11px] font-medium px-2 py-1.5 rounded-lg"
                    style={{ color: 'var(--red)' }}>
                    x
                  </button>
                </div>
              </div>

              {/* CVイベント一覧 */}
              {selectedGoal?.id === goal.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>CVイベント一覧</span>
                  {loadingEvents ? (
                    <div className="text-center py-4" style={{ color: 'var(--text3)' }}>読み込み中...</div>
                  ) : events.length > 0 ? (
                    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr style={{ background: 'var(--surface)' }}>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>ユーザー</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>詳細</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map(ev => (
                            <tr key={ev.id} style={{ borderTop: '1px solid var(--border)' }}>
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{ev.user_name || ev.user_id || '--'}</td>
                              <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{formatDate(ev.created_at)}</td>
                              <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{ev.details || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-center py-3" style={{ color: 'var(--text3)' }}>まだイベントがありません</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>CVゴールがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ ゴール作成」からCVゴールを設定しましょう</p>
        </div>
      )}
    </div>
  );
}
