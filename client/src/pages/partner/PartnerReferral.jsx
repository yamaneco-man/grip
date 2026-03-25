import React from 'react';

export default function PartnerReferral() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>紹介リンク管理</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text3)' }}>紹介URL・QRコード・クリック分析</p>
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">🔗</div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>紹介リンク管理ページ</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>複数リンク作成・UTM管理・クリック分析・QRコード生成を実装予定</p>
      </div>
    </div>
  );
}
