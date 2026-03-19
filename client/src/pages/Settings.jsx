import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const PLAN_COLORS = {
  free: 'border-gray-300',
  standard: 'border-blue-500',
  pro: 'border-purple-500',
  vip: 'border-yellow-500',
};

const PLAN_BADGES = {
  free: 'bg-gray-100 text-gray-700',
  standard: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  vip: 'bg-yellow-100 text-yellow-700',
};

export default function Settings() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [planData, plansData, profileData] = await Promise.all([
        api.getCurrentPlan(),
        api.getPlans(),
        api.getProfile(),
      ]);
      setCurrentPlan(planData);
      setPlans(plansData);
      setProfile(profileData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planKey) {
    setUpgrading(planKey);
    try {
      const { url } = await api.checkout(planKey);
      if (url) window.location.href = url;
    } catch (err) {
      alert(err.message);
    } finally {
      setUpgrading(null);
    }
  }

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  const planOrder = ['free', 'standard', 'pro', 'vip'];
  const currentIndex = planOrder.indexOf(currentPlan?.plan || 'free');

  const features = {
    free: ['LP生成 3件/月', 'LINE追跡 50人', 'ダッシュボード'],
    standard: ['LP生成 無制限', 'LINE追跡 500人', '固定テンプレステップ配信', '週次離脱検知', 'AI自動返信'],
    pro: ['LP生成 無制限', 'LINE追跡 無制限', 'AIステップ自動生成', '日次離脱検知', '反論処理AI', 'AI自動返信'],
    vip: ['全機能無制限', 'カスタムステップ設計', 'リアルタイム離脱検知', '優先サポート', '専用コンサルティング'],
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">設定</h2>
      <p className="text-gray-500 mb-8">アカウント情報・プラン管理</p>

      {/* アカウント情報 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">アカウント情報</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">メールアドレス</p>
            <p className="font-medium text-gray-800">{profile?.email}</p>
          </div>
          <div>
            <p className="text-gray-500">現在のプラン</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${PLAN_BADGES[currentPlan?.plan || 'free']}`}>
              {currentPlan?.details?.name || 'FREE'}
            </span>
          </div>
        </div>
      </div>

      {/* プラン選択 */}
      <h3 className="text-lg font-bold text-gray-800 mb-4">プラン</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans && planOrder.map((key, index) => {
          const plan = plans[key];
          const isCurrent = key === (currentPlan?.plan || 'free');
          const isDowngrade = index < currentIndex;

          return (
            <div
              key={key}
              className={`rounded-xl border-2 p-6 ${isCurrent ? PLAN_COLORS[key] + ' bg-gray-50' : 'border-gray-200'}`}
            >
              <div className="mb-4">
                <h4 className="font-bold text-gray-800">{plan.name}</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}`}
                  {plan.price > 0 && <span className="text-sm text-gray-500 font-normal">/月</span>}
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {features[key].map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="w-full py-2 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium">
                  現在のプラン
                </button>
              ) : isDowngrade ? (
                <button disabled className="w-full py-2 rounded-lg bg-gray-50 text-gray-400 text-sm">
                  -
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={upgrading === key}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {upgrading === key ? '処理中...' : 'アップグレード'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
