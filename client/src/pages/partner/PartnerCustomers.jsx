import React from 'react';

export default function PartnerCustomers() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>紹介顧客一覧</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text3)' }}>紹介経由の全顧客を管理</p>
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">👥</div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>紹介顧客一覧ページ</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>全顧客の詳細表示・フィルタ・契約状況追跡を実装予定</p>
      </div>
    </div>
  );
}
