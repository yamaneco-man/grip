import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const ACTION_TYPES = [
  { key: 'send_message', label: 'メッセージ送信' },
  { key: 'add_tag', label: 'タグ追加' },
  { key: 'remove_tag', label: 'タグ削除' },
];

const TRIGGER_TYPES = [
  { key: 'datetime', label: '日時指定' },
  { key: 'cron', label: 'Cron式' },
];

const TARGET_TYPES = [
  { key: 'all', label: '全員' },
  { key: 'tag', label: 'タグ指定' },
];

export default function ScheduledActionManager() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [logsActionId, setLogsActionId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // フォーム
  const [name, setName] = useState('');
  const [actionType, setActionType] = useState('send_message');
  const [triggerType, setTriggerType] = useState('datetime');
  const [triggerValue, setTriggerValue] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetTag, setTargetTag] = useState('');
  const [actionData, setActionData] = useState('');

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = () => {
    setLoading(true);
    api.getScheduledActions().then(setActions).catch(() => {}).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setName('');
    setActionType('send_message');
    setTriggerType('datetime');
    setTriggerValue('');
    setTargetType('all');
    setTargetTag('');
    setActionData('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !triggerValue.trim()) return;
    setCreating(true);
    try {
      const payload = {
        name: name.trim(),
        action_type: actionType,
        trigger_type: triggerType,
        trigger_value: triggerValue.trim(),
        target_type: targetType,
        target_tag: targetType === 'tag' ? targetTag.trim() : null,
        action_data: actionData.trim(),
      };
      const created = await api.createScheduledAction(payload);
      setActions([created, ...actions]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このアクションを削除しますか？')) return;
    try {
      await api.deleteScheduledAction(id);
      setActions(actions.filter(a => a.id !== id));
      if (logsActionId === id) { setLogsActionId(null); setLogs([]); }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (action) => {
    const newStatus = action.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await api.updateScheduledAction(action.id, { status: newStatus });
      setActions(actions.map(a => a.id === action.id ? { ...a, status: newStatus, ...updated } : a));
    } catch (err) {
      alert(err.message);
    }
  };

  const showLogs = async (id) => {
    if (logsActionId === id) { setLogsActionId(null); setLogs([]); return; }
    setLogsActionId(id);
    setLoadingLogs(true);
    try {
      const data = await api.getScheduledActionLogs(id);
      setLogs(data || []);
    } catch (err) {
      alert(err.message);
      setLogsActionId(null);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>アクション管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>スケジュールされたアクションの作成・管理・ログ確認</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ アクション作成
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規アクション</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>アクション名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: 毎朝のリマインドメッセージ"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>アクションタイプ</label>
              <select value={actionType} onChange={e => setActionType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {ACTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>トリガータイプ</label>
              <select value={triggerType} onChange={e => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {TRIGGER_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>
                {triggerType === 'datetime' ? '実行日時' : 'Cron式'}
              </label>
              {triggerType === 'datetime' ? (
                <input type="datetime-local" value={triggerValue} onChange={e => setTriggerValue(e.target.value)} required
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              ) : (
                <input type="text" value={triggerValue} onChange={e => setTriggerValue(e.target.value)} required
                  placeholder="例: 0 9 * * * (毎日9:00)"
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ターゲット</label>
              <select value={targetType} onChange={e => setTargetType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {TARGET_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            {targetType === 'tag' && (
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タグ名</label>
                <input type="text" value={targetTag} onChange={e => setTargetTag(e.target.value)}
                  placeholder="例: VIP"
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>アクションデータ</label>
            <textarea value={actionData} onChange={e => setActionData(e.target.value)} rows={2}
              placeholder={actionType === 'send_message' ? '送信するメッセージ内容' : 'タグ名'}
              className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '作成中...' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* アクション一覧 */}
      {actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map(action => (
            <div key={action.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{action.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ background: action.status === 'active' ? 'var(--green)' : 'var(--text3)' }}>
                      {action.status === 'active' ? '実行中' : '一時停止'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
                      {ACTION_TYPES.find(t => t.key === action.action_type)?.label || action.action_type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                      {TRIGGER_TYPES.find(t => t.key === action.trigger_type)?.label || action.trigger_type}: {action.trigger_value}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>実行: {action.execution_count || 0}回</span>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>次回: {formatDate(action.next_run_at)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleToggleStatus(action)}
                    className="text-[11px] px-2 py-1 rounded font-medium"
                    style={{ color: action.status === 'active' ? 'var(--text3)' : 'var(--green)' }}>
                    {action.status === 'active' ? '停止' : '再開'}
                  </button>
                  <button onClick={() => showLogs(action.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>ログ</button>
                  <button onClick={() => handleDelete(action.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                </div>
              </div>

              {/* アクションログ */}
              {logsActionId === action.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>実行ログ</span>
                  {loadingLogs ? (
                    <div className="text-center py-3" style={{ color: 'var(--text3)' }}>読み込み中...</div>
                  ) : logs.length > 0 ? (
                    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr style={{ background: 'var(--surface)' }}>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>結果</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>詳細</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log, i) => (
                            <tr key={log.id || i} style={{ borderTop: '1px solid var(--border)' }}>
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{formatDate(log.executed_at)}</td>
                              <td className="px-3 py-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ color: log.success ? 'var(--green)' : 'var(--red)', background: 'var(--surface)' }}>
                                  {log.success ? '成功' : '失敗'}
                                </span>
                              </td>
                              <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{log.message || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-center py-3" style={{ color: 'var(--text3)' }}>ログがありません</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">⏰</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだアクションがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ アクション作成」からスケジュールアクションを追加しましょう</p>
        </div>
      )}
    </div>
  );
}
