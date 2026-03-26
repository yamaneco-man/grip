import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const PLAN_COLORS = {
  free: 'var(--text3)', monitor: 'var(--green)', standard: 'var(--blue)',
  pro: 'var(--purple)', vip: 'var(--amber)',
};

const FEATURES = {
  free: ['LP生成 3件', 'LINE追跡 50人', 'ダッシュボード'],
  monitor: ['LP無制限', 'LINE追跡 500人', '固定テンプレステップ', '週次離脱検知', '先着30名限定'],
  standard: ['LP無制限', 'LINE追跡 500人', '固定テンプレステップ', '週次離脱検知'],
  pro: ['LP無制限', 'LINE追跡 無制限', 'AI自動ステップ', '日次離脱検知', '反論処理AI'],
  vip: ['全機能無制限', 'カスタムステップ', 'リアルタイム離脱検知', '専用コンサル', '優先サポート'],
};

export default function Settings() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [planData, plansData, profileData] = await Promise.all([
        api.getCurrentPlan().catch(() => ({ plan: 'free' })),
        api.getPlans().catch(() => null),
        api.getProfile().catch(() => null),
      ]);
      setCurrentPlan(planData);
      setPlans(plansData);
      setProfile(profileData);
    } catch (err) {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planKey) {
    setUpgrading(planKey);
    try {
      const result = await api.checkout(planKey);
      if (result?.url) window.location.href = result.url;
    } catch (err) {
      alert(err.message || '決済リンクの作成に失敗しました');
    } finally {
      setUpgrading(null);
    }
  }

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  const planOrder = ['free', 'monitor', 'standard', 'pro', 'vip'];
  const currentIndex = planOrder.indexOf(currentPlan?.plan || 'free');

  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>設定</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>アカウント情報・プラン管理</p>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-5 text-[13px]" style={{ background: 'var(--red-l)', color: 'var(--red)' }}>{error}</div>
      )}

      {/* アカウント情報 */}
      <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>アカウント情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[12px] mb-0.5" style={{ color: 'var(--text3)' }}>メールアドレス</div>
            <div className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{profile?.email || '—'}</div>
          </div>
          <div>
            <div className="text-[12px] mb-0.5" style={{ color: 'var(--text3)' }}>現在のプラン</div>
            <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold font-mono"
              style={{ background: 'var(--surface)', color: PLAN_COLORS[currentPlan?.plan || 'free'], border: '1px solid var(--border)' }}>
              {(currentPlan?.plan || 'FREE').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* プラン選択 */}
      <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>プラン</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {plans && planOrder.map((key, index) => {
          const plan = plans[key];
          if (!plan) return null;
          const isCurrent = key === (currentPlan?.plan || 'free');
          const isDowngrade = index < currentIndex;
          const color = PLAN_COLORS[key];

          return (
            <div key={key} className="rounded-xl p-5"
              style={{
                background: isCurrent ? 'var(--surface)' : 'var(--white)',
                border: `1px solid var(--border)`,
                borderTop: `3px solid ${color}`,
              }}>
              <div className="mb-3">
                <div className="text-[12px] font-mono font-semibold mb-1" style={{ color }}>{plan.name}</div>
                <div className="text-[22px] font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
                  {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}`}
                  {plan.price > 0 && <span className="text-[11px] font-normal" style={{ color: 'var(--text3)' }}>/月</span>}
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {(FEATURES[key] || []).map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11.5px]" style={{ color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--green)' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <button disabled className="w-full py-2 rounded-lg text-[12px] font-medium"
                  style={{ background: 'var(--border)', color: 'var(--text3)' }}>
                  現在のプラン
                </button>
              ) : isDowngrade ? (
                <button disabled className="w-full py-2 rounded-lg text-[12px]"
                  style={{ background: 'var(--surface)', color: 'var(--text3)' }}>—</button>
              ) : (
                <button onClick={() => handleUpgrade(key)} disabled={upgrading === key}
                  className="w-full py-2 rounded-lg text-[12px] font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50"
                  style={{ background: 'var(--text)' }}>
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
