import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const PERMISSIONS = [
  { key: 'chat', label: 'チャット' },
  { key: 'booking', label: '予約管理' },
  { key: 'forms', label: 'フォーム' },
];

export default function OperatorManager() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editOp, setEditOp] = useState(null);
  const [creating, setCreating] = useState(false);

  // フォーム
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = () => {
    setLoading(true);
    api.getOperators().then(setOperators).catch(() => {}).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPermissions([]);
    setEditOp(null);
  };

  const openEdit = (op) => {
    setEditOp(op);
    setName(op.name || '');
    setEmail(op.email || '');
    setPassword('');
    setPermissions(op.permissions || []);
    setShowForm(true);
  };

  const togglePermission = (key) => {
    setPermissions(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!editOp && !password.trim()) return;
    setCreating(true);
    try {
      const payload = { name: name.trim(), email: email.trim(), permissions };
      if (password.trim()) payload.password = password.trim();
      if (editOp) {
        const updated = await api.updateOperator(editOp.id, payload);
        setOperators(operators.map(o => o.id === editOp.id ? { ...o, ...updated } : o));
      } else {
        const created = await api.createOperator(payload);
        setOperators([created, ...operators]);
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
    if (!confirm('このオペレーターを削除しますか？')) return;
    try {
      await api.deleteOperator(id);
      setOperators(operators.filter(o => o.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (op) => {
    try {
      const updated = await api.updateOperator(op.id, { enabled: !op.enabled });
      setOperators(operators.map(o => o.id === op.id ? { ...o, enabled: !o.enabled, ...updated } : o));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>オペレーター管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>オペレーターの作成・権限設定・有効/無効切替</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ オペレーター追加
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{editOp ? 'オペレーター編集' : '新規オペレーター'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>名前</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: 鈴木花子"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="例: operator@example.com"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>
                パスワード{editOp && '（変更する場合のみ）'}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required={!editOp}
                placeholder={editOp ? '変更しない場合は空欄' : 'パスワードを入力'}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>権限</label>
            <div className="flex gap-4">
              {PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={permissions.includes(p.key)} onChange={() => togglePermission(p.key)} />
                  <span className="text-[12px]" style={{ color: 'var(--text)' }}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '保存中...' : editOp ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* オペレーター一覧 */}
      {operators.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>メール</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>権限</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>状態</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {operators.map(op => (
                <tr key={op.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{op.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text3)' }}>{op.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(op.permissions || []).map(p => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
                          {PERMISSIONS.find(x => x.key === p)?.label || p}
                        </span>
                      ))}
                      {(!op.permissions || op.permissions.length === 0) && (
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>権限なし</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(op)}
                      className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ background: op.enabled !== false ? 'var(--green)' : 'var(--text3)' }}>
                      {op.enabled !== false ? '有効' : '無効'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(op)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>編集</button>
                      <button onClick={() => handleDelete(op.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">🎧</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだオペレーターがいません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ オペレーター追加」から追加しましょう</p>
        </div>
      )}
    </div>
  );
}
