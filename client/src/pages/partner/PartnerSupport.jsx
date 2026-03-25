import React from 'react';

export default function PartnerSupport() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>お問い合わせ</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text3)' }}>GRIP運営へのお問い合わせ・サポート</p>
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">💬</div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>サポートページ</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>チャットサポート・FAQ・お問い合わせフォームを実装予定</p>
      </div>
    </div>
  );
}
