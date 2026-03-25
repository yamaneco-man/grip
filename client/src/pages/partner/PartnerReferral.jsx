import React, { useState } from 'react';

export default function PartnerReferral() {
  const [copied, setCopied] = useState(false);
  const referralUrl = 'https://grip.jp/r/yamada-2025';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>紹介リンク管理</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>紹介URL・QRコード・クリック分析</p>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* メインリンク */}
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text)' }}>あなたの紹介URL</h3>

          <div className="flex rounded-lg overflow-hidden mb-5" style={{ border: '1px solid var(--border2)' }}>
            <div className="flex-1 px-4 py-3 font-mono text-[13px] truncate"
              style={{ background: 'var(--surface)', color: 'var(--text2)' }}>{referralUrl}</div>
            <button onClick={handleCopy}
              className="px-5 py-3 text-[13px] font-medium text-white shrink-0 transition-colors"
              style={{ background: copied ? 'var(--green)' : 'var(--text)' }}>
              {copied ? '✓ コピー済' : 'コピー'}
            </button>
          </div>

          <h4 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>リンク実績（今月）</h4>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'クリック数', val: '342', color: 'var(--amber)' },
              { label: 'LP到達', val: '18', color: 'var(--blue)' },
              { label: '契約数', val: '4', color: 'var(--purple)' },
              { label: '成約率', val: '2.3%', color: 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[22px] font-bold" style={{ color: s.color, letterSpacing: '-0.5px' }}>{s.val}</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h4 className="text-[13px] font-semibold mt-5 mb-2" style={{ color: 'var(--text)' }}>使い方</h4>
          <div className="space-y-2 text-[12.5px]" style={{ color: 'var(--text2)' }}>
            <p>1. 上のURLをコピーして、SNSやメールで見込み客に共有</p>
            <p>2. クリックされるとあなた専用のタグが付き、契約時に自動で紐付けされます</p>
            <p>3. 契約が成立すると、月額の50%があなたの収益になります</p>
          </div>
        </div>

        {/* QRコード */}
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text)' }}>QRコード</h3>
          <div className="rounded-lg p-5 flex flex-col items-center gap-3 mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-32 h-32 rounded-md flex items-center justify-center text-[48px]"
              style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>⬛</div>
            <div className="text-[11px] text-center" style={{ color: 'var(--text3)' }}>
              名刺・提案書・チラシに<br />貼り付けて使用できます
            </div>
          </div>
          <button className="w-full py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
            📥 PNG画像をダウンロード
          </button>
          <button className="w-full py-2.5 rounded-lg text-[13px] font-medium mt-2 transition-all"
            style={{ background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
            📄 PDF（名刺サイズ）をダウンロード
          </button>
        </div>
      </div>
    </div>
  );
}
