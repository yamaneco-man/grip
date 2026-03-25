import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';

const PLAN_TAG = { free: 'bg-gray-100 text-gray-600 border-gray-300', monitor: 'bg-gray-100 text-gray-600 border-gray-300', standard: 'bg-blue-50 text-blue-700 border-blue-200', pro: 'bg-purple-50 text-purple-700 border-purple-200', vip: 'bg-amber-50 text-amber-700 border-amber-200' };
const ROLE_TAG = { user: 'bg-gray-100 text-gray-600 border-gray-300', admin: 'bg-gray-900 text-white border-gray-900', partner: 'bg-purple-50 text-purple-700 border-purple-200' };

export default function AdminContracts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    adminApi.getContracts()
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.plan === filter);

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>契約者管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>全{users.length}名の契約者</p>
        </div>
        <div className="flex gap-2">
          {['all', 'free', 'monitor', 'standard', 'pro', 'vip'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
              style={{
                background: filter === f ? 'var(--text)' : 'var(--white)',
                color: filter === f ? '#fff' : 'var(--text2)',
                border: `1px solid ${filter === f ? 'var(--text)' : 'var(--border2)'}`,
              }}>
              {f === 'all' ? '全て' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr>
              {['メール', 'プラン', 'ロール', '登録日'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                  style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b hover:bg-[#f6f7fb] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}>
                      {u.email[0].toUpperCase()}
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{u.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${PLAN_TAG[u.plan] || PLAN_TAG.free}`}>
                    {(u.plan || 'free').toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${ROLE_TAG[u.role] || ROLE_TAG.user}`}>
                    {(u.role || 'user').toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
                該当する契約者がいません
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
