import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const EXPORT_TYPES = [
  { key: 'followers', label: '友だちデータ', path: '/api/csv/export/followers' },
  { key: 'messages', label: 'メッセージデータ', path: '/api/csv/export/messages' },
  { key: 'analytics', label: '分析データ', path: '/api/csv/export/analytics' },
];

export default function DataManager() {
  const [importJobs, setImportJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    api.getImportJobs().then(setImportJobs).catch(() => {}).finally(() => setLoading(false));
  };

  const handleCsvPaste = (text) => {
    setCsvText(text);
    if (!text.trim()) { setPreviewRows([]); return; }
    const lines = text.trim().split('\n');
    const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
    setPreviewRows(rows.slice(0, 11)); // ヘッダー + 10行
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
    if (rows.length < 2) { alert('ヘッダー行とデータ行が必要です'); return; }
    if (!confirm(`${rows.length - 1}件のデータをインポートしますか？`)) return;
    setImporting(true);
    try {
      await api.importFollowers(rows);
      setCsvText('');
      setPreviewRows([]);
      fetchJobs();
    } catch (err) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return { label: '完了', color: 'var(--green)' };
      case 'processing': return { label: '処理中', color: 'var(--accent)' };
      case 'failed': return { label: '失敗', color: 'var(--red)' };
      default: return { label: status || '不明', color: 'var(--text3)' };
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>データ管理</h2>
        <p className="text-[13px]" style={{ color: 'var(--text3)' }}>CSVエクスポート・インポートでデータを一括管理</p>
      </div>

      {/* エクスポートセクション */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>CSVエクスポート</h3>
        <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>データをCSVファイルとしてダウンロードします</p>
        <div className="flex gap-3 flex-wrap">
          {EXPORT_TYPES.map(type => (
            <a key={type.key} href={type.path} download
              className="text-[12px] font-medium px-4 py-2 rounded-lg text-white transition-all hover:-translate-y-px"
              style={{ background: 'var(--accent)', textDecoration: 'none' }}>
              {type.label}をダウンロード
            </a>
          ))}
        </div>
      </div>

      {/* インポートセクション */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>CSVインポート</h3>
        <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>CSVデータを貼り付けて友だちデータをインポート（1行目はヘッダー）</p>
        <textarea
          value={csvText}
          onChange={e => handleCsvPaste(e.target.value)}
          rows={6}
          placeholder="name,email,phone&#10;山田太郎,yamada@example.com,090-1234-5678&#10;鈴木花子,suzuki@example.com,080-9876-5432"
          className="w-full px-3 py-2 rounded-lg text-[12px] resize-none font-mono"
          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}
        />

        {/* プレビュー */}
        {previewRows.length > 0 && (
          <div className="mt-3">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>
              プレビュー（{previewRows.length > 1 ? previewRows.length - 1 : 0}行）
            </span>
            <div className="mt-1 rounded-lg overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    {previewRows[0]?.map((cell, i) => (
                      <th key={i} className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(1).map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2" style={{ color: 'var(--text)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-3">
          <button onClick={handleImport} disabled={importing || !csvText.trim()}
            className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {importing ? 'インポート中...' : 'インポート実行'}
          </button>
        </div>
      </div>

      {/* インポートジョブ履歴 */}
      <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>インポート履歴</h3>
        {loading ? (
          <div className="text-center py-4" style={{ color: 'var(--text3)' }}>読み込み中...</div>
        ) : importJobs.length > 0 ? (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text2)' }}>件数</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--text2)' }}>詳細</th>
                </tr>
              </thead>
              <tbody>
                {importJobs.map(job => {
                  const badge = getStatusBadge(job.status);
                  return (
                    <tr key={job.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-2" style={{ color: 'var(--text)' }}>{formatDate(job.created_at)}</td>
                      <td className="px-4 py-2 font-mono" style={{ color: 'var(--text)' }}>{job.row_count || 0}件</td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: badge.color, background: 'var(--surface)' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[11px]" style={{ color: 'var(--text3)' }}>{job.message || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12px] text-center py-4" style={{ color: 'var(--text3)' }}>インポート履歴はありません</p>
        )}
      </div>
    </div>
  );
}
