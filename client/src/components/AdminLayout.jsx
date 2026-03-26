import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const navigate = useNavigate();

  const navSections = [
    { label: 'Overview', items: [
      { path: '/admin', label: 'ダッシュボード', icon: '▣', exact: true },
    ]},
    { label: '管理', items: [
      { path: '/admin/contracts', label: '契約者管理', icon: '👤' },
      { path: '/admin/agencies', label: '代理店管理', icon: '🤝' },
      { path: '/admin/revenue', label: '収益レポート', icon: '📊' },
    ]},
    { label: '設定', items: [
      { path: '/admin/plans', label: 'プラン設定', icon: '💳' },
      { path: '/admin/system', label: 'システム設定', icon: '⚙' },
      { path: '/admin/permissions', label: '権限管理', icon: '🔐' },
    ]},
  ];

  const handleLogout = () => {
    localStorage.removeItem('grip_admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <Sidebar
        brand="GRIP"
        badge="ADMIN"
        badgeClass="text-white bg-[var(--text)] rounded-xl"
        navSections={navSections}
        user={{ initial: 'Y', name: 'Yama（オーナー）', sub: '管理者権限' }}
        onLogout={handleLogout}
      />
      <div className="flex-1 lg:ml-[232px]">
        <Topbar
          title="管理者ダッシュボード"
          subtitle="2026年3月"
          systemStatus="システム正常"
          actions={
            <>
              <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[13px] font-medium transition-all"
                style={{ background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
                📥 CSVエクスポート</button>
              <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[13px] font-medium text-white transition-all hover:-translate-y-px"
                style={{ background: 'var(--text)', border: '1px solid var(--text)' }}>
                ＋ 契約者追加</button>
            </>
          }
        />
        <main className="pt-[70px] px-4 pb-6 lg:pt-[82px] lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
