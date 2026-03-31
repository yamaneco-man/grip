import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const MATCH_TYPES = [
  { key: 'exact', label: '完全一致' },
  { key: 'partial', label: '部分一致' },
  { key: 'regex', label: '正規表現' },
];

export default function KeywordRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // フォーム
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState('partial');
  const [responseText, setResponseText] = useState('');
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    api.getKeywordRules().then(setRules).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setKeyword('');
    setMatchType('partial');
    setResponseText('');
    setPriority(0);
    setEditingRule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || !responseText.trim()) return;
    setSaving(true);
    try {
      const data = {
        keyword: keyword.trim(),
        match_type: matchType,
        response_text: responseText.trim(),
        priority,
      };
      if (editingRule) {
        const updated = await api.updateKeywordRule(editingRule.id, data);
        setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...updated } : r));
      } else {
        const created = await api.createKeywordRule(data);
        setRules([created, ...rules]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rule) => {
    setKeyword(rule.keyword || '');
    setMatchType(rule.match_type || 'partial');
    setResponseText(rule.response_text || '');
    setPriority(rule.priority || 0);
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('このルールを削除しますか？')) return;
    try {
      await api.deleteKeywordRule(id);
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (rule) => {
    try {
      const updated = await api.updateKeywordRule(rule.id, { enabled: !rule.enabled });
      setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled, ...updated } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>キーワード応答</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>特定のキーワードに自動応答するルールを管理</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + ルール作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            {editingRule ? 'ルール編集' : '新規ルール'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>キーワード</label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} required
                placeholder="例: 料金" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>マッチタイプ</label>
              <select value={matchType} onChange={e => setMatchType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {MATCH_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>優先度</label>
              <input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>応答テキスト</label>
            <textarea value={responseText} onChange={e => setResponseText(e.target.value)} required rows={3}
              placeholder="自動応答するメッセージを入力..."
              className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? '保存中...' : editingRule ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* ルール一覧 */}
      {rules.length > 0 ? (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>有効</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>キーワード</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>マッチ</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>応答内容</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>優先度</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2">
                    <button onClick={() => handleToggle(rule)}
                      className="w-8 h-4 rounded-full relative transition-colors"
                      style={{ background: rule.enabled !== false ? 'var(--green)' : 'var(--border2)' }}>
                      <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: rule.enabled !== false ? '16px' : '2px' }} />
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text)' }}>{rule.keyword}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                      {MATCH_TYPES.find(t => t.key === rule.match_type)?.label || rule.match_type}
                    </span>
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text3)', maxWidth: '300px' }}>
                    <span className="line-clamp-1">{rule.response_text}</span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: 'var(--text3)' }}>{rule.priority || 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(rule)}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                        編集
                      </button>
                      <button onClick={() => handleDelete(rule.id)}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ color: 'var(--red)' }}>
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">💬</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>ルールがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ ルール作成」からキーワード応答を設定しましょう</p>
        </div>
      )}
    </div>
  );
}
