import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function PartnerLayout() {
  const navigate = useNavigate();

  const navSections = [
    { label: 'メイン', items: [
      { path: '/partner', label: 'ダッシュボード', icon: '▣', exact: true },
    ]},
    { label: '顧客・収益', items: [
      { path: '/partner/customers', label: '紹介顧客一覧', icon: '👥', count: '8名', countColor: 'purple' },
      { path: '/partner/revenue', label: '収益レポート', icon: '📊' },
    ]},
    { label: '営業ツール', items: [
      { path: '/partner/referral', label: '紹介リンク管理', icon: '🔗' },
      { path: '/partner/materials', label: '販売素材', icon: '📁' },
    ]},
    { label: 'サポート', items: [
      { path: '/partner/support', label: 'お問い合わせ', icon: '💬' },
    ]},
  ];

  const handleLogout = () => {
    localStorage.removeItem('grip_partner_token');
    navigate('/partner/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <Sidebar
        brand="GRIP"
        badge="PARTNER"
        badgeClass="text-[var(--purple)] bg-[var(--purple-l)] border border-[var(--purple-m)] rounded-xl"
        navSections={navSections}
        user={{ initial: '山', name: '山田代理店', sub: 'パートナー / 50%還元', avatarBg: 'linear-gradient(135deg, var(--purple), #9c6fe4)' }}
        onLogout={handleLogout}
      />
      <div className="flex-1 lg:ml-[232px]">
        <Topbar
          title="パートナーダッシュボード"
          subtitle="2026年3月"
          systemStatus="リアルタイム"
          actions={
            <>
              <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[13px] font-medium transition-all"
                style={{ background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
                📥 収益明細</button>
              <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[13px] font-medium text-white transition-all hover:-translate-y-px"
                style={{ background: 'var(--purple)' }}>
                🔗 紹介リンクをコピー</button>
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
