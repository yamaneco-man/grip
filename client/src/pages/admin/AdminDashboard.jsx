import React, { useEffect, useState } from 'react';
import KPICard from '../../components/KPICard';
import { adminApi } from '../../utils/api';

const PLAN_TAG = { free: 'bg-gray-100 text-gray-600 border-gray-300', monitor: 'bg-gray-100 text-gray-600 border-gray-300', standard: 'bg-blue-50 text-blue-700 border-blue-200', pro: 'bg-purple-50 text-purple-700 border-purple-200', vip: 'bg-amber-50 text-amber-700 border-amber-200' };
const ROLE_TAG = { user: 'bg-gray-100 text-gray-600 border-gray-300', admin: 'bg-gray-900 text-white border-gray-900', partner: 'bg-purple-50 text-purple-700 border-purple-200' };

export default function AdminDashboard() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getContracts()
      .then(data => { if (Array.isArray(data)) setContracts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = contracts.length;
  const partners = contracts.filter(c => c.role === 'partner');
  const activeUsers = contracts.filter(c => c.plan && c.plan !== 'free');

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <KPICard label="総MRR" value="¥0" icon="💴" color="green"
          deltaText="ローンチ後に計測開始" />
        <KPICard label="総ユーザー数" value={totalUsers} icon="👥" color="blue"
          deltaText="登録済みアカウント" />
        <KPICard label="月間チャーン率" value="—" icon="📉" color="amber"
          deltaText="目標 5%以下" />
        <KPICard label="代理店数" value={partners.length} icon="🤝" color="purple"
          deltaText="パートナー" />
      </div>

      {/* Body Grid */}
      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* Users Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
              ユーザー一覧
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {totalUsers}名
              </span>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {['メール', 'プラン', 'ロール', '登録日'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider font-mono"
                    style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}>
                        {u.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold font-mono border ${PLAN_TAG[u.plan] || PLAN_TAG.free}`}>
                      {(u.plan || 'free').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold font-mono border ${ROLE_TAG[u.role] || ROLE_TAG.user}`}>
                      {(u.role || 'user').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('ja-JP') : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>
                  ユーザーがいません
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right Panel */}
        <div className="space-y-3.5">
          {/* Agency Panel */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>代理店</div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                {partners.length}社
              </span>
            </div>
            {partners.length > 0 ? partners.map(a => (
              <div key={a.id} className="flex items-center gap-2.5 px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ background: 'var(--purple-l)', border: '1px solid var(--purple-m)' }}>🤝</div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{a.email}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>還元率 50%</div>
                </div>
              </div>
            )) : (
              <div className="px-5 py-6 text-center text-sm" style={{ color: 'var(--text3)' }}>
                まだ代理店がいません
              </div>
            )}
          </div>

          {/* Revenue Model */}
          <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>代理店モデル</div>
            {[
              { label: '契約料', val: '¥500,000', color: 'var(--text)' },
              { label: '半年間', val: '100%還元', color: 'var(--green)' },
              { label: '永久', val: '50%還元', color: 'var(--purple)' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-1.5">
                <span className="text-xs" style={{ color: 'var(--text3)' }}>{s.label}</span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>システム状態</div>
            {[
              { label: 'API', status: 'ok' },
              { label: 'Supabase', status: 'ok' },
              { label: 'Square', status: 'ok' },
              { label: 'LINE', status: 'ok' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-1.5">
                <span className="text-xs" style={{ color: 'var(--text2)' }}>{s.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                  <span className="text-xs font-mono" style={{ color: 'var(--green)' }}>稼働中</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
