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

const CHANNELS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'note', label: 'note' },
  { value: 'seo', label: 'SEO / ブログ' },
  { value: 'referral', label: '紹介' },
  { value: 'ad', label: '広告' },
  { value: 'qr', label: 'QRコード' },
  { value: 'richmenu', label: 'リッチメニュー' },
  { value: 'other', label: 'その他' },
];

function TrackingLinksSection() {
  const [links, setLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('tiktok');
  const [lineUrl, setLineUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    api.getTrackingLinks().then(setLinks).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !lineUrl) return;
    setCreating(true);
    try {
      const result = await api.createTrackingLink(name, channel, lineUrl);
      setLinks([result, ...links]);
      setName(''); setLineUrl(''); setShowForm(false);
    } catch (err) {
      alert(err.message || '作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このリンクを削除しますか？')) return;
    await api.deleteTrackingLink(id);
    setLinks(links.filter(l => l.id !== id));
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">📊</span>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>流入経路トラッキングリンク</h3>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ リンク作成
        </button>
      </div>

      <p className="text-[11.5px] mb-4" style={{ color: 'var(--text3)' }}>
        経路ごとにトラッキングリンクを作成すると、どのチャネルからLINE友達が来たか自動で判別できます。
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg p-4 mb-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>リンク名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: TikTokプロフリンク"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>チャネル</label>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>LINE友達追加URL</label>
              <input type="url" value={lineUrl} onChange={e => setLineUrl(e.target.value)} required
                placeholder="https://lin.ee/xxxxx"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--green)' }}>
            {creating ? '作成中...' : 'トラッキングリンクを作成'}
          </button>
        </form>
      )}

      {links.length > 0 ? (
        <div className="space-y-2">
          {links.map(link => {
            const trackingUrl = `https://grip-api-production.up.railway.app/t/${link.tracking_code}`;
            const ch = CHANNELS.find(c => c.value === link.channel) || { label: link.channel };
            return (
              <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{link.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--blue-l)', color: 'var(--blue)', border: '1px solid var(--border)' }}>
                      {ch.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono truncate" style={{ color: 'var(--text3)' }}>{trackingUrl}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10.5px] font-mono" style={{ color: 'var(--text3)' }}>
                    <span>クリック: {link.click_count || 0}</span>
                    <span>登録: {link.follow_count || 0}</span>
                  </div>
                </div>
                <button onClick={() => handleCopy(trackingUrl, link.id)}
                  className="px-3 py-1.5 rounded text-[11px] font-medium shrink-0 transition-colors"
                  style={{ background: copiedId === link.id ? 'var(--green)' : 'var(--text)', color: '#fff' }}>
                  {copiedId === link.id ? '✓' : 'コピー'}
                </button>
                <button onClick={() => handleDelete(link.id)}
                  className="text-[14px] shrink-0 px-1" style={{ color: 'var(--red)' }} title="削除">×</button>
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="text-center py-4 text-[12px]" style={{ color: 'var(--text3)' }}>
          まだリンクがありません。「＋ リンク作成」から経路ごとのリンクを発行してください。
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // LINE連携
  const [lineSettings, setLineSettings] = useState(null);
  const [lineToken, setLineToken] = useState('');
  const [lineSecret, setLineSecret] = useState('');
  const [lineSaving, setLineSaving] = useState(false);
  const [lineMsg, setLineMsg] = useState('');
  const [webhookCopied, setWebhookCopied] = useState(false);

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

      // LINE設定を取得（有料プランのみ）
      if (planData?.plan && planData.plan !== 'free') {
        api.getLineSettings().then(setLineSettings).catch(() => {});
      }
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

      {/* LINE公式アカウント連携 */}
      {currentPlan?.plan && currentPlan.plan !== 'free' && (
        <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[18px]">💬</span>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>LINE公式アカウント連携</h3>
            {lineSettings?.hasToken && (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
                style={{ background: 'var(--green-l)', color: 'var(--green)', border: '1px solid var(--green-m)' }}>接続済み</span>
            )}
          </div>

          {lineMsg && (
            <div className="rounded-lg px-4 py-2.5 mb-4 text-[12px]"
              style={{ background: lineMsg.includes('失敗') ? 'var(--red-l)' : 'var(--green-l)', color: lineMsg.includes('失敗') ? 'var(--red)' : 'var(--green)' }}>
              {lineMsg}
            </div>
          )}

          {lineSettings?.hasToken ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>チャネルアクセストークン</div>
                  <div className="text-[13px] font-mono" style={{ color: 'var(--text)' }}>{lineSettings.tokenPreview}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>チャネルシークレット</div>
                  <div className="text-[13px] font-mono" style={{ color: 'var(--text)' }}>設定済み</div>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] mb-1.5" style={{ color: 'var(--text3)' }}>Webhook URL（LINE Developersに設定してください）</div>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border2)' }}>
                  <div className="flex-1 px-3 py-2 font-mono text-[11px] truncate" style={{ background: 'var(--white)', color: 'var(--text2)' }}>
                    {lineSettings.webhookUrl}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(lineSettings.webhookUrl); setWebhookCopied(true); setTimeout(() => setWebhookCopied(false), 2000); }}
                    className="px-3 py-2 text-[11px] font-medium text-white shrink-0 transition-colors"
                    style={{ background: webhookCopied ? 'var(--green)' : 'var(--text)' }}>
                    {webhookCopied ? '✓' : 'コピー'}
                  </button>
                </div>
              </div>

              <button onClick={async () => {
                if (!confirm('LINE連携を解除しますか？')) return;
                await api.deleteLineSettings();
                setLineSettings(null);
                setLineMsg('LINE連携を解除しました');
              }}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-red-50"
                style={{ color: 'var(--red)', border: '1px solid var(--border)' }}>
                連携を解除
              </button>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLineSaving(true);
              setLineMsg('');
              try {
                const result = await api.saveLineSettings(lineToken, lineSecret);
                setLineSettings({ hasToken: true, tokenPreview: '****' + lineToken.slice(-8), webhookUrl: result.webhookUrl });
                setLineMsg('LINE公式アカウントを連携しました！Webhook URLをLINE Developersに設定してください。');
                setLineToken('');
                setLineSecret('');
              } catch (err) {
                setLineMsg(err.message || '保存に失敗しました');
              } finally {
                setLineSaving(false);
              }
            }} className="space-y-3">
              <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
                LINE Developers（<span className="font-mono">developers.line.biz</span>）でMessaging APIチャネルを作成し、以下の情報を入力してください。
              </p>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text2)' }}>チャネルアクセストークン（長期）</label>
                <input type="password" value={lineToken} onChange={e => setLineToken(e.target.value)} required
                  placeholder="LINE Developers → Messaging API → チャネルアクセストークン"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] font-mono"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text2)' }}>チャネルシークレット</label>
                <input type="password" value={lineSecret} onChange={e => setLineSecret(e.target.value)} required
                  placeholder="LINE Developers → チャネル基本設定 → チャネルシークレット"
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] font-mono"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
              <button type="submit" disabled={lineSaving}
                className="px-5 py-2 rounded-lg text-[13px] font-medium text-white transition-all hover:-translate-y-px disabled:opacity-50"
                style={{ background: 'var(--green)' }}>
                {lineSaving ? '保存中...' : 'LINE公式アカウントを連携する'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* トラッキングリンク管理 */}
      {currentPlan?.plan && currentPlan.plan !== 'free' && (
        <TrackingLinksSection />
      )}

      {/* FREEプランの場合 */}
      {(!currentPlan?.plan || currentPlan.plan === 'free') && (
        <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[18px]">🔒</span>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text3)' }}>LINE公式アカウント連携</h3>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
            有料プランにアップグレードすると、あなたのLINE公式アカウントをGRIPに連携できます。
          </p>
        </div>
      )}

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
