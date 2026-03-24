import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const TONE_OPTIONS = [
  { value: 'friendly', label: 'フレンドリー' },
  { value: 'professional', label: 'プロフェッショナル' },
  { value: 'casual', label: 'カジュアル' },
  { value: 'urgent', label: '緊急性' },
];

const DEFAULT_PURPOSES = {
  1: '悩みに対する価値提供コンテンツ。信頼構築。',
  2: 'お客様の声・実績データ。社会的証明の構築。',
  3: '別の成功事例を紹介。信頼の強化。',
  4: '商品の核心的なベネフィット。欲求の最大化。',
  5: '商品の具体的な活用イメージ。行動促進。',
  6: '期間限定オファー。希少性・緊急性。',
  7: 'オファー終了リマインド。最終クロージング。',
};

function DayCard({ day, config, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Day {day}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600">
            {config.enabled ? '有効' : '無効'}
          </span>
          <button
            type="button"
            onClick={() => onChange({ ...config, enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              config.enabled ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            目的
          </label>
          <input
            type="text"
            value={config.purpose}
            onChange={(e) => onChange({ ...config, purpose: e.target.value })}
            placeholder={DEFAULT_PURPOSES[day]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            トーン
          </label>
          <select
            value={config.tone}
            onChange={(e) => onChange({ ...config, tone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カスタムプロンプト（任意）
          </label>
          <textarea
            value={config.custom_prompt}
            onChange={(e) => onChange({ ...config, custom_prompt: e.target.value })}
            placeholder="AI生成時の追加指示を入力..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function StepConfig() {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVIP, setIsVIP] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // プラン確認
      const profile = await api.getProfile();
      if (profile.plan !== 'vip') {
        setIsVIP(false);
        setLoading(false);
        return;
      }
      setIsVIP(true);

      // カスタム設定を取得
      const data = await api.getStepConfig();
      const configMap = {};
      for (let d = 1; d <= 7; d++) {
        const existing = data.find((c) => c.day === d);
        configMap[d] = existing || {
          day: d,
          purpose: DEFAULT_PURPOSES[d],
          tone: 'friendly',
          custom_prompt: '',
          enabled: true,
        };
      }
      setConfigs(configMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      for (let day = 1; day <= 7; day++) {
        const c = configs[day];
        if (!c.purpose) continue;
        await api.updateStepConfig(day, {
          purpose: c.purpose,
          tone: c.tone,
          custom_prompt: c.custom_prompt,
          enabled: c.enabled,
        });
      }
      setMessage('保存しました');
    } catch (err) {
      setMessage('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm('全てのカスタム設定をデフォルトに戻しますか？')) return;
    setSaving(true);
    setMessage('');
    try {
      await api.resetStepConfig();
      // デフォルト値に戻す
      const configMap = {};
      for (let d = 1; d <= 7; d++) {
        configMap[d] = {
          day: d,
          purpose: DEFAULT_PURPOSES[d],
          tone: 'friendly',
          custom_prompt: '',
          enabled: true,
        };
      }
      setConfigs(configMap);
      setMessage('デフォルトに戻しました');
    } catch (err) {
      setMessage('リセットに失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(day, newConfig) {
    setConfigs((prev) => ({ ...prev, [day]: newConfig }));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // VIPプラン以外はロック画面
  if (!isVIP) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-12">
          <div className="text-6xl mb-4">&#128274;</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            VIPプラン専用機能
          </h2>
          <p className="text-gray-600 mb-6">
            カスタムステップ設計はVIPプランでご利用いただけます。
            7日間のステップ配信を自由にカスタマイズし、
            ターゲットに最適なメッセージ戦略を構築できます。
          </p>
          <a
            href="/settings"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            プランをアップグレード
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ステップ設計</h1>
          <p className="text-gray-600 mt-1">
            7日間ステップ配信の各Dayの内容・トーン・目的をカスタマイズ
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            デフォルトに戻す
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('失敗')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <DayCard
            key={day}
            day={day}
            config={configs[day] || { purpose: '', tone: 'friendly', custom_prompt: '', enabled: true }}
            onChange={(newConfig) => handleChange(day, newConfig)}
          />
        ))}
      </div>
    </div>
  );
}
