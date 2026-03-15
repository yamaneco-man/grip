import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ lps: 0, followers: 0, alerts: 0 });
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

      setStats({
        lps: lps.length,
        followers: followers.length,
        alerts: alertCount,
      });
    } catch (err) {
      console.error('データ読み込みエラー:', err);
    }
  }

  const cards = [
    { label: '作成LP数', value: stats.lps, color: 'bg-blue-500', link: '/lp' },
    { label: 'LINE友達数', value: stats.followers, color: 'bg-green-500', link: '/followers' },
    { label: '離脱アラート', value: stats.alerts, color: 'bg-red-500', link: '/churn' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
        <p className="text-gray-500 mt-1">
          {profile ? `${profile.email} / ${profile.plan.toUpperCase()}プラン` : '読み込み中...'}
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map(card => (
          <Link key={card.label} to={card.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
          >
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl mb-4`}>
              {card.value}
            </div>
            <p className="text-gray-600 font-medium">{card.label}</p>
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
              <p className="text-sm text-gray-500">商品情報を入力してAIがLPを自動生成</p>
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
