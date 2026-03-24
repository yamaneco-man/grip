import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ lps: 0, followers: 0, alerts: 0, realtimeAlerts: 0 });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileData, lps, followers] = await Promise.all([
        api.getProfile(),
        api.getLPs().catch(() => []),
        api.getFollowers().catch(() => []),
      ]);
      setProfile(profileData);

      const alertCount = followers.filter(f =>
        f.churn_scores?.[0]?.score >= 61
      ).length;

      // VIPプラン: 直近24時間のリアルタイムアラート件数
      let realtimeAlerts = 0;
      if (profileData?.plan === 'vip') {
        try {
          const churnData = await api.getChurnScores();
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          realtimeAlerts = (churnData || []).filter(s => {
            const cs = s.churn_scores?.[0];
            return cs?.alerted && cs.score >= 80 && cs.calculated_at >= oneDayAgo;
          }).length;
        } catch (e) {
          console.error('リアルタイムアラート取得エラー:', e);
        }
      }

      setStats({
        lps: lps.length,
        followers: followers.length,
        alerts: alertCount,
        realtimeAlerts,
      });
    } catch (err) {
      console.error('データ読み込みエラー:', err);
    }
  }

  const isVip = profile?.plan === 'vip';

  const cards = [
    { label: '作成LP数', value: stats.lps, color: 'bg-blue-500', link: '/lp' },
    { label: 'LINE友達数', value: stats.followers, color: 'bg-green-500', link: '/followers' },
    {
      label: '離脱アラート',
      value: stats.alerts,
      color: 'bg-red-500',
      link: '/churn',
      badge: isVip ? 'リアルタイム' : null,
      sub: isVip ? `24h: ${stats.realtimeAlerts}件` : null,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
        <p className="text-gray-500 mt-1">
          {profile ? `${profile.email} / ${profile.plan.toUpperCase()}プラン` : '読み込み中...'}
        </p>
      </div>

      {/* VIP専用機能バナー */}
      {isVip && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-300 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🌟</span>
            <h3 className="text-lg font-bold text-gray-800">VIP専用機能</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/step-config"
              className="flex items-center gap-3 p-4 bg-white border border-yellow-200 rounded-lg hover:border-yellow-400 transition"
            >
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-gray-800">ステップ設計</p>
                <p className="text-sm text-gray-500">カスタムステップ配信を設計・管理</p>
              </div>
            </Link>
            <Link to="/churn"
              className="flex items-center gap-3 p-4 bg-white border border-yellow-200 rounded-lg hover:border-yellow-400 transition"
            >
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-medium text-gray-800">リアルタイム離脱検知</p>
                <p className="text-sm text-gray-500">離脱リスクをリアルタイムで監視</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map(card => (
          <Link key={card.label} to={card.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {card.value}
              </div>
              {card.badge && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="text-gray-600 font-medium">{card.label}</p>
            {card.sub && (
              <p className="text-xs text-red-500 mt-1">{card.sub}</p>
            )}
          </Link>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/lp/generate"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition"
          >
            <span className="text-2xl">🚀</span>
            <div>
              <p className="font-medium text-gray-800">新しいLPを作成</p>
              <p className="text-sm text-gray-500">商品情報を入力してLPを自動生成</p>
            </div>
          </Link>
          <Link to="/churn"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition"
          >
            <span className="text-2xl">🔍</span>
            <div>
              <p className="font-medium text-gray-800">離脱スコアを確認</p>
              <p className="text-sm text-gray-500">友達の冷め度をチェック</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
