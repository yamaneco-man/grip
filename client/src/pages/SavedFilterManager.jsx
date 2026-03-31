import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const BLOCK_STATUSES = [
  { key: '', label: '指定なし' },
  { key: 'active', label: 'アクティブ' },
  { key: 'blocked', label: 'ブロック済み' },
];

export default function SavedFilterManager() {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editFilter, setEditFilter] = useState(null);
  const [creating, setCreating] = useState(false);
  const [resultFilterId, setResultFilterId] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // フォーム
  const [name, setName] = useState('');
  const [blockStatus, setBlockStatus] = useState('');
  const [source, setSource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tagCondition, setTagCondition] = useState('');

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = () => {
    setLoading(true);
    api.getSavedFilters().then(setFilters).catch(() => {}).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setName('');
    setBlockStatus('');
    setSource('');
    setDateFrom('');
    setDateTo('');
    setTagCondition('');
    setEditFilter(null);
  };

  const openEdit = (filter) => {
    setEditFilter(filter);
    setName(filter.name || '');
    const c = filter.conditions || {};
    setBlockStatus(c.block_status || '');
    setSource(c.source || '');
    setDateFrom(c.date_from || '');
    setDateTo(c.date_to || '');
    setTagCondition(c.tag || '');
    setShowForm(true);
  };

  const buildConditions = () => {
    const conditions = {};
    if (blockStatus) conditions.block_status = blockStatus;
    if (source.trim()) conditions.source = source.trim();
    if (dateFrom) conditions.date_from = dateFrom;
    if (dateTo) conditions.date_to = dateTo;
    if (tagCondition.trim()) conditions.tag = tagCondition.trim();
    return conditions;
  };

  const summarizeConditions = (conditions) => {
    if (!conditions) return '条件なし';
    const parts = [];
    if (conditions.block_status) parts.push(`状態: ${conditions.block_status === 'blocked' ? 'ブロック' : 'アクティブ'}`);
    if (conditions.source) parts.push(`流入: ${conditions.source}`);
    if (conditions.date_from || conditions.date_to) parts.push(`期間: ${conditions.date_from || '?'} ~ ${conditions.date_to || '?'}`);
    if (conditions.tag) parts.push(`タグ: ${conditions.tag}`);
    return parts.length > 0 ? parts.join(' / ') : '条件なし';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const payload = { name: name.trim(), conditions: buildConditions() };
      if (editFilter) {
        const updated = await api.updateSavedFilter(editFilter.id, payload);
        setFilters(filters.map(f => f.id === editFilter.id ? { ...f, ...updated } : f));
      } else {
        const created = await api.createSavedFilter(payload);
        setFilters([created, ...filters]);
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
    if (!confirm('このフィルタを削除しますか？')) return;
    try {
      await api.deleteSavedFilter(id);
      setFilters(filters.filter(f => f.id !== id));
      if (resultFilterId === id) { setResultFilterId(null); setResults([]); }
    } catch (err) {
      alert(err.message);
    }
  };

  const executeFilter = async (id) => {
    if (resultFilterId === id) { setResultFilterId(null); setResults([]); return; }
    setResultFilterId(id);
    setLoadingResults(true);
    try {
      const data = await api.executeSavedFilter(id);
      setResults(data || []);
    } catch (err) {
      alert(err.message);
      setResultFilterId(null);
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>カスタム検索管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>よく使う検索条件を保存して、すぐに友だちを絞り込み</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ フィルタ作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{editFilter ? 'フィルタ編集' : '新規フィルタ'}</h3>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>フィルタ名</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="例: VIPアクティブユーザー"
              className="w-full px-3 py-2 rounded-lg text-[12px]"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ブロック状態</label>
              <select value={blockStatus} onChange={e => setBlockStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {BLOCK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>流入経路</label>
              <input type="text" value={source} onChange={e => setSource(e.target.value)}
                placeholder="例: LP, 広告, 紹介"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>登録日（開始）</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>登録日（終了）</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タグ条件</label>
              <input type="text" value={tagCondition} onChange={e => setTagCondition(e.target.value)}
                placeholder="例: VIP"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '保存中...' : editFilter ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* フィルタ一覧 */}
      {filters.length > 0 ? (
        <div className="space-y-3">
          {filters.map(filter => (
            <div key={filter.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{filter.name}</span>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{summarizeConditions(filter.conditions)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => executeFilter(filter.id)}
                    className="text-[11px] px-2 py-1 rounded font-medium"
                    style={{ color: 'var(--green)' }}>
                    {resultFilterId === filter.id ? '閉じる' : '実行'}
                  </button>
                  <button onClick={() => openEdit(filter)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>編集</button>
                  <button onClick={() => handleDelete(filter.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                </div>
              </div>

              {/* 実行結果 */}
              {resultFilterId === filter.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>検索結果</span>
                  {loadingResults ? (
                    <div className="text-center py-3" style={{ color: 'var(--text3)' }}>検索中...</div>
                  ) : results.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>{results.length}件の友だちが見つかりました</p>
                      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr style={{ background: 'var(--surface)' }}>
                              <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                              <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>状態</th>
                              <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>流入</th>
                              <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>登録日</th>
                              <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>タグ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map(follower => (
                              <tr key={follower.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{follower.display_name || follower.name || '—'}</td>
                                <td className="px-3 py-2">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ color: follower.is_blocked ? 'var(--red)' : 'var(--green)', background: 'var(--surface)' }}>
                                    {follower.is_blocked ? 'ブロック' : 'アクティブ'}
                                  </span>
                                </td>
                                <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{follower.source || '—'}</td>
                                <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{formatDate(follower.created_at)}</td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1 flex-wrap">
                                    {(follower.tags || []).map((tag, i) => (
                                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-center py-3" style={{ color: 'var(--text3)' }}>該当する友だちがいません</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>保存済みフィルタがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ フィルタ作成」からカスタム検索条件を保存しましょう</p>
        </div>
      )}
    </div>
  );
}
