import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const ROLES = [
  { key: 'admin', label: '管理者', color: 'var(--red)' },
  { key: 'sub_admin', label: '副管理者', color: 'var(--accent)' },
  { key: 'operator', label: 'オペレーター', color: 'var(--green)' },
  { key: 'general', label: '一般', color: 'var(--text3)' },
];

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [creating, setCreating] = useState(false);

  // フォーム
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('general');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = () => {
    setLoading(true);
    api.getStaffMembers().then(setStaff).catch(() => {}).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('general');
    setEditStaff(null);
  };

  const openEdit = (member) => {
    setEditStaff(member);
    setName(member.name || '');
    setEmail(member.email || '');
    setPassword('');
    setRole(member.role || 'general');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!editStaff && !password.trim()) return;
    setCreating(true);
    try {
      const payload = { name: name.trim(), email: email.trim(), role };
      if (password.trim()) payload.password = password.trim();
      if (editStaff) {
        const updated = await api.updateStaffMember(editStaff.id, payload);
        setStaff(staff.map(s => s.id === editStaff.id ? { ...s, ...updated } : s));
      } else {
        const created = await api.createStaffMember(payload);
        setStaff([created, ...staff]);
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
    if (!confirm('このスタッフを削除しますか？')) return;
    try {
      await api.deleteStaffMember(id);
      setStaff(staff.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (member) => {
    try {
      const updated = await api.updateStaffMember(member.id, { enabled: !member.enabled });
      setStaff(staff.map(s => s.id === member.id ? { ...s, enabled: !s.enabled, ...updated } : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getRoleBadge = (r) => {
    const found = ROLES.find(x => x.key === r);
    return found || { label: r, color: 'var(--text3)' };
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>スタッフ管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>スタッフの追加・権限設定・有効/無効切替</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ スタッフ追加
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{editStaff ? 'スタッフ編集' : '新規スタッフ'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>名前</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: 山田太郎"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="例: staff@example.com"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>
                パスワード{editStaff && '（変更する場合のみ）'}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required={!editStaff}
                placeholder={editStaff ? '変更しない場合は空欄' : 'パスワードを入力'}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ロール</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '保存中...' : editStaff ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* スタッフ一覧 */}
      {staff.length > 0 ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>メール</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>ロール</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>状態</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>最終ログイン</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => {
                const badge = getRoleBadge(member.role);
                return (
                  <tr key={member.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{member.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text3)' }}>{member.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: badge.color, background: 'var(--surface)' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(member)}
                        className="text-[10px] px-2 py-0.5 rounded-full text-white"
                        style={{ background: member.enabled !== false ? 'var(--green)' : 'var(--text3)' }}>
                        {member.enabled !== false ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text3)' }}>{formatDate(member.last_login)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(member)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>編集</button>
                        <button onClick={() => handleDelete(member.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">👥</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだスタッフがいません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ スタッフ追加」からスタッフを追加しましょう</p>
        </div>
      )}
    </div>
  );
}
