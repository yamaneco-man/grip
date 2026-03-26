import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { api } from '../utils/api';

export default function UserLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => {});
    api.getFollowers().then(f => setFollowerCount(f?.length || 0)).catch(() => {});
    api.getChurnScores().then(s => {
      setAlertCount((s || []).filter(x => x.churn_scores?.[0]?.score >= 80).length);
    }).catch(() => {});
  }, []);

  const plan = profile?.plan?.toUpperCase() || 'FREE';
  const isVip = profile?.plan === 'vip';

  const navSections = [
    { label: 'メイン', items: [
      { path: '/', label: 'ダッシュボード', icon: '▣', exact: true },
    ]},
    { label: '友達管理', items: [
      { path: '/followers', label: '友達一覧', icon: '👥', count: followerCount, countColor: 'blue' },
      { path: '/followers/chat', label: '個別チャット', icon: '💬' },
    ]},
    { label: '配信', items: [
      { path: '/lp', label: 'LP管理', icon: '📄' },
      { path: '/lp/generate', label: 'LP生成', icon: '📣' },
    ]},
    { label: '分析', items: [
      { path: '/churn', label: '離脱検知', icon: '🚨', count: alertCount > 0 ? `${alertCount}件` : undefined, countColor: 'red' },
    ]},
    ...(isVip ? [{ label: 'VIP限定', items: [
      { path: '/step-config', label: 'ステップ設計', icon: '🎯' },
    ]}] : []),
    { label: '設定', items: [
      { path: '/settings', label: 'アカウント設定', icon: '⚙' },
    ]},
  ];

  const handleLogout = () => {
    localStorage.removeItem('grip_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <Sidebar
        brand="GRIP"
        badge={plan}
        navSections={navSections}
        user={{ initial: profile?.email?.[0]?.toUpperCase() || 'U', name: profile?.email?.split('@')[0] || 'User', sub: `${plan} プラン` }}
        onLogout={handleLogout}
      />
      <div className="flex-1 lg:ml-[232px]">
        <Topbar
          title="ダッシュボード"
          subtitle={new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
          systemStatus="稼働中"
          actions={
            <>
              <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[13px] font-medium transition-all"
                style={{ background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)' }}
                onClick={() => navigate('/churn')}>⚡ 離脱チェック</button>
              <button className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[7px] text-[13px] font-medium text-white transition-all hover:-translate-y-px"
                style={{ background: 'var(--text)', border: '1px solid var(--text)' }}
                onClick={() => navigate('/lp/generate')}>＋ LP生成</button>
            </>
          }
        />
        <main className="pt-[70px] px-4 pb-6 lg:pt-[82px] lg:px-7">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}
