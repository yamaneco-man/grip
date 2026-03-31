import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const EVENT_TYPES = [
  { key: 'follow', label: '新規フォロー' },
  { key: 'message', label: 'メッセージ受信' },
  { key: 'booking', label: '予約' },
  { key: 'form_response', label: 'フォーム回答' },
  { key: 'purchase', label: '購入' },
  { key: 'churn_alert', label: '離脱アラート' },
];

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, settingsData, countData] = await Promise.all([
        api.getNotificationLogs().catch(() => []),
        api.getNotificationSettings().catch(() => ({})),
        api.getUnreadCount().catch(() => ({ count: 0 })),
      ]);
      setLogs(logsData || []);
      setSettings(settingsData || {});
      setUnreadCount(countData?.count || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setLogs(logs.map(l => l.id === id ? { ...l, read: true } : l));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      setLogs(logs.map(l => ({ ...l, read: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleSetting = (eventType) => {
    setSettings(prev => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        enabled: !(prev[eventType]?.enabled ?? true),
      },
    }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.saveNotificationSettings(settings);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
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
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>通知センター</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
            通知ログの確認と通知設定の管理
            {unreadCount > 0 && (
              <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ background: 'var(--red)' }}>
                {unreadCount}件未読
              </span>
            )}
          </p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-5">
        <button onClick={() => setActiveTab('logs')}
          className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all"
          style={{
            background: activeTab === 'logs' ? 'var(--text)' : 'var(--surface)',
            color: activeTab === 'logs' ? '#fff' : 'var(--text2)',
          }}>
          通知ログ
        </button>
        <button onClick={() => setActiveTab('settings')}
          className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all"
          style={{
            background: activeTab === 'settings' ? 'var(--text)' : 'var(--surface)',
            color: activeTab === 'settings' ? '#fff' : 'var(--text2)',
          }}>
          通知設定
        </button>
      </div>

      {/* 通知ログ */}
      {activeTab === 'logs' && (
        <div>
          {logs.length > 0 && (
            <div className="flex justify-end mb-3">
              <button onClick={handleMarkAllRead}
                className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                全件既読にする
              </button>
            </div>
          )}

          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="rounded-xl p-4 flex items-start justify-between"
                  style={{
                    background: log.read ? 'var(--white)' : 'var(--surface)',
                    border: `1px solid ${log.read ? 'var(--border)' : 'var(--accent)'}`,
                    borderLeft: log.read ? '1px solid var(--border)' : '4px solid var(--accent)',
                  }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!log.read && (
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                      )}
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{log.title}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{log.body}</p>
                  </div>
                  {!log.read && (
                    <button onClick={() => handleMarkRead(log.id)}
                      className="text-[10px] font-medium px-2 py-1 rounded ml-3 whitespace-nowrap"
                      style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
                      既読
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>通知はありません</p>
            </div>
          )}
        </div>
      )}

      {/* 通知設定 */}
      {activeTab === 'settings' && (
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text)' }}>イベントタイプ別通知設定</h3>
          <div className="space-y-3">
            {EVENT_TYPES.map(evt => {
              const enabled = settings[evt.key]?.enabled ?? true;
              return (
                <div key={evt.key} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{evt.label}</span>
                    <span className="text-[10px] ml-2 font-mono" style={{ color: 'var(--text3)' }}>{evt.key}</span>
                  </div>
                  <button onClick={() => toggleSetting(evt.key)}
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{ background: enabled ? 'var(--green)' : 'var(--border2)' }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: enabled ? '22px' : '2px' }} />
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={handleSaveSettings} disabled={savingSettings}
            className="mt-4 px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {savingSettings ? '保存中...' : '設定を保存'}
          </button>
        </div>
      )}
    </div>
  );
}
