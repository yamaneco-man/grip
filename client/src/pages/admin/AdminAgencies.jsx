import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  // 決済リンク発行
  const [showForm, setShowForm] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [amount, setAmount] = useState(500000);
  const [generating, setGenerating] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    adminApi.getAgencies()
      .then(data => { if (Array.isArray(data)) setAgencies(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setPaymentUrl('');
    try {
      const result = await adminApi.createAgencyCheckout(agencyName, agencyEmail, amount);
      if (result?.url) setPaymentUrl(result.url);
    } catch (err) {
      alert(err.message || '決済リンクの作成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>代理店管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>全{agencies.length}社の代理店パートナー</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--purple)' }}>
          ＋ 代理店契約リンク発行
        </button>
      </div>

      {/* 決済リンク発行フォーム */}
      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--purple-m)' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--purple)' }}>代理店契約 決済リンク発行</h3>

          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text2)' }}>代理店名</label>
                <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} required
                  placeholder="例: 山田代理店"
                  className="w-full px-3 py-2 rounded-lg text-[13px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メールアドレス（任意）</label>
                <input type="email" value={agencyEmail} onChange={e => setAgencyEmail(e.target.value)}
                  placeholder="agency@example.com"
                  className="w-full px-3 py-2 rounded-lg text-[13px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--text2)' }}>契約料（円）</label>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required
                  className="w-full px-3 py-2 rounded-lg text-[13px] font-mono"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
            </div>
            <button type="submit" disabled={generating || !agencyName}
              className="px-5 py-2 rounded-lg text-[13px] font-medium text-white transition-all hover:-translate-y-px disabled:opacity-50"
              style={{ background: 'var(--purple)' }}>
              {generating ? '生成中...' : '決済リンクを生成'}
            </button>
          </form>

          {/* 生成されたURL */}
          {paymentUrl && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[12px] font-medium mb-2" style={{ color: 'var(--green)' }}>決済リンクが生成されました</div>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border2)' }}>
                <div className="flex-1 px-3 py-2 font-mono text-[11px] truncate"
                  style={{ background: 'var(--white)', color: 'var(--text2)' }}>{paymentUrl}</div>
                <button onClick={handleCopy}
                  className="px-4 py-2 text-[12px] font-medium text-white shrink-0 transition-colors"
                  style={{ background: copied ? 'var(--green)' : 'var(--text)' }}>
                  {copied ? '✓ コピー済' : 'コピー'}
                </button>
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--text3)' }}>
                このリンクを代理店候補に送付してください。決済完了後、手動でpartnerロールを付与してください。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 代理店一覧 */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            代理店一覧
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              {agencies.length}社
            </span>
          </div>
        </div>
        {agencies.length > 0 ? agencies.map(a => (
          <div key={a.id} className="flex items-center gap-3 px-5 py-4 border-b hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px] shrink-0"
              style={{ background: 'var(--purple-l)', border: '1px solid var(--purple-m)' }}>🤝</div>
            <div className="flex-1">
              <div className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{a.email}</div>
              <div className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>
                契約開始: {new Date(a.created_at).toLocaleDateString('ja-JP')} / 還元率 50%
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              PARTNER
            </span>
          </div>
        )) : (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだ代理店がいません</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>上の「代理店契約リンク発行」から決済リンクを作成して代理店候補に送付してください</p>
          </div>
        )}
      </div>

      {/* 代理店モデル概要 */}
      <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>代理店収益モデル</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: '契約料', val: '¥500,000', sub: 'パートナーと折半', color: 'var(--text)' },
            { label: '最初の半年', val: '100%還元', sub: '月額全額キャッシュバック', color: 'var(--green)' },
            { label: '半年後〜永久', val: '50%還元', sub: '月額の50%を代理店に', color: 'var(--purple)' },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.label}</div>
              <div className="text-[18px] font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10.5px] font-mono mt-0.5" style={{ color: 'var(--text3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
