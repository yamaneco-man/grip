import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';

const ROLE_TAG = { user: 'bg-gray-100 text-gray-600 border-gray-300', admin: 'bg-gray-900 text-white border-gray-900', partner: 'bg-purple-50 text-purple-700 border-purple-200' };
const ROLE_OPTIONS = ['user', 'admin', 'partner'];

export default function AdminPermissions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    adminApi.getContracts()
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      await adminApi.updateRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('role変更に失敗しました');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>権限管理</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>ユーザーのロール変更・管理者招待</p>

      {/* ロール説明 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { role: 'USER', desc: '一般ユーザー。自分のLP・友達・スコアのみ操作可能', color: 'var(--text3)', count: users.filter(u => u.role === 'user').length },
          { role: 'ADMIN', desc: '管理者。全ユーザー・代理店・収益データにアクセス可能', color: 'var(--text)', count: users.filter(u => u.role === 'admin').length },
          { role: 'PARTNER', desc: '代理店。自分の紹介顧客・収益・紹介リンクを管理', color: 'var(--purple)', count: users.filter(u => u.role === 'partner').length },
        ].map(r => (
          <div key={r.role} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold font-mono" style={{ color: r.color }}>{r.role}</span>
              <span className="text-[18px] font-bold" style={{ color: r.color }}>{r.count}</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* ユーザー一覧 + ロール変更 */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>ユーザー権限一覧</div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              {['メール', '現在のロール', 'ロール変更'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}>
                      {u.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-[13px]" style={{ color: 'var(--text)' }}>{u.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${ROLE_TAG[u.role] || ROLE_TAG.user}`}>
                    {(u.role || 'user').toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {ROLE_OPTIONS.map(r => (
                      <button key={r} onClick={() => handleRoleChange(u.id, r)}
                        disabled={u.role === r || updating === u.id}
                        className="px-2.5 py-1 rounded text-[11px] font-medium transition-all disabled:opacity-30"
                        style={{
                          background: u.role === r ? 'var(--text)' : 'var(--white)',
                          color: u.role === r ? '#fff' : 'var(--text2)',
                          border: `1px solid ${u.role === r ? 'var(--text)' : 'var(--border2)'}`,
                        }}>
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
