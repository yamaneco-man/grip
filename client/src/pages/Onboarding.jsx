import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const STEPS = [
  {
    title: 'GRIPへようこそ！',
    description: 'AIがあなたのLINEマーケティングを自動化します。3ステップで始めましょう。',
    icon: '🚀',
    content: (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
          <span className="text-[18px]">📄</span>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>AIがLPを自動生成</p>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>商品情報を入力するだけ。プロ品質のLPをAIが即座に作成します。</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
          <span className="text-[18px]">💬</span>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>LINE友達を自動追跡</p>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>LPからLINE登録したユーザーを自動で追跡。AIが7日間ステップ配信します。</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
          <span className="text-[18px]">🎯</span>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>AIがクロージングを支援</p>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>感情分析・成約確率・反論対応まで。離脱しそうなユーザーも自動でフォロー。</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: '最初のLPを作ろう',
    description: '商品・サービスの情報を入力すると、AIが最適なLPを生成します。',
    icon: '📄',
    content: (
      <div className="space-y-3">
        <div className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--text)' }}>必要な情報:</p>
          <ul className="space-y-1.5">
            {['商品名・サービス名', 'ターゲット（誰向けか）', '価格（任意）', '強み・実績', 'LINE友達追加URL'].map(item => (
              <li key={item} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text2)' }}>
                <span style={{ color: 'var(--green)' }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
          LPは後から何度でも再生成できます。まずは気軽に試してみてください。
        </p>
      </div>
    ),
  },
  {
    title: 'LINE公式アカウントを連携',
    description: '連携すると、LP経由のLINE登録者を自動追跡・AIが自動返信します。',
    icon: '💬',
    content: (
      <div className="space-y-3">
        <div className="rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--text)' }}>連携手順:</p>
          <ol className="space-y-2">
            {[
              'LINE Developersでチャネルを作成',
              'チャネルアクセストークンとシークレットを取得',
              '設定ページで入力して連携',
              '表示されるWebhook URLをLINE Developersに設定',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text2)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: 'var(--blue)' }}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
          有料プランにアップグレード後に設定できます。まずは無料でLP生成を試してみましょう。
        </p>
      </div>
    ),
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      await api.completeOnboarding();
    } catch { }
    if (onComplete) onComplete();
    navigate('/lp/generate');
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--white)' }}>
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--blue)' : 'var(--border)' }} />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-4">
          <span className="text-[40px]">{current.icon}</span>
        </div>
        <h2 className="text-[18px] font-bold text-center mb-1" style={{ color: 'var(--text)' }}>{current.title}</h2>
        <p className="text-[13px] text-center mb-5" style={{ color: 'var(--text3)' }}>{current.description}</p>

        <div className="mb-6">
          {current.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
              style={{ color: 'var(--text3)', border: '1px solid var(--border)' }}>
              戻る
            </button>
          ) : (
            <button onClick={handleComplete}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text3)' }}>
              スキップ
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: 'var(--blue)' }}>
              次へ
            </button>
          ) : (
            <button onClick={handleComplete}
              className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: 'var(--green)' }}>
              はじめる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
