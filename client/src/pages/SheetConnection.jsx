import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const DATA_TYPES = [
  { key: 'followers', label: '友だち' },
  { key: 'messages', label: 'メッセージ' },
  { key: 'analytics', label: '分析データ' },
  { key: 'tags', label: 'タグ' },
];

const SYNC_FREQUENCIES = [
  { key: 'manual', label: '手動のみ' },
  { key: 'hourly', label: '1時間ごと' },
  { key: 'daily', label: '1日ごと' },
  { key: 'weekly', label: '1週間ごと' },
];

export default function SheetConnection() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editConn, setEditConn] = useState(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(null);

  // フォーム
  const [name, setName] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [dataType, setDataType] = useState('followers');
  const [syncFrequency, setSyncFrequency] = useState('manual');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = () => {
    setLoading(true);
    api.getSheetConnections().then(setConnections).catch(() => {}).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setName('');
    setSpreadsheetId('');
    setSheetName('');
    setDataType('followers');
    setSyncFrequency('manual');
    setEditConn(null);
  };

  const openEdit = (conn) => {
    setEditConn(conn);
    setName(conn.name || '');
    setSpreadsheetId(conn.spreadsheet_id || '');
    setSheetName(conn.sheet_name || '');
    setDataType(conn.data_type || 'followers');
    setSyncFrequency(conn.sync_frequency || 'manual');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !spreadsheetId.trim()) return;
    setCreating(true);
    try {
      const payload = {
        name: name.trim(),
        spreadsheet_id: spreadsheetId.trim(),
        sheet_name: sheetName.trim(),
        data_type: dataType,
        sync_frequency: syncFrequency,
      };
      if (editConn) {
        const updated = await api.updateSheetConnection(editConn.id, payload);
        setConnections(connections.map(c => c.id === editConn.id ? { ...c, ...updated } : c));
      } else {
        const created = await api.createSheetConnection(payload);
        setConnections([created, ...connections]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('この連携を削除しますか？')) return;
    try {
      await api.deleteSheetConnection(id);
      setConnections(connections.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSync = async (id) => {
    setSyncing(id);
    try {
      await api.syncSheet(id);
      fetchConnections();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(null);
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
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>Googleスプレッドシート連携</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>スプレッドシートとデータを自動同期</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ 連携追加
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{editConn ? '連携編集' : '新規連携'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>連携名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: 友だちデータ同期"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>スプレッドシートID</label>
              <input type="text" value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)} required
                placeholder="例: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>シート名</label>
              <input type="text" value={sheetName} onChange={e => setSheetName(e.target.value)}
                placeholder="例: Sheet1"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>データタイプ</label>
              <select value={dataType} onChange={e => setDataType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {DATA_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>同期頻度</label>
              <select value={syncFrequency} onChange={e => setSyncFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {SYNC_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '保存中...' : editConn ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* 連携一覧 */}
      {connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map(conn => (
            <div key={conn.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{conn.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
                      {DATA_TYPES.find(t => t.key === conn.data_type)?.label || conn.data_type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                      {SYNC_FREQUENCIES.find(f => f.key === conn.sync_frequency)?.label || conn.sync_frequency}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>ID: {conn.spreadsheet_id?.slice(0, 12)}...</span>
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <button onClick={() => handleSync(conn.id)} disabled={syncing === conn.id}
                    className="text-[11px] px-2 py-1 rounded font-medium disabled:opacity-50"
                    style={{ color: 'var(--green)' }}>
                    {syncing === conn.id ? '同期中...' : '同期'}
                  </button>
                  <button onClick={() => openEdit(conn)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>編集</button>
                  <button onClick={() => handleDelete(conn.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                </div>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                最終同期: {formatDate(conn.last_synced_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📋</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>スプレッドシート連携がありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ 連携追加」からGoogleスプレッドシートを接続しましょう</p>
        </div>
      )}
    </div>
  );
}
