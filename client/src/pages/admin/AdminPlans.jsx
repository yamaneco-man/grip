import React from 'react';

export default function AdminPlans() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>プラン設定</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text3)' }}>プラン定義・価格・機能制限の管理</p>
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">💳</div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>プラン設定ページ</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>プラン追加・価格変更・機能制限設定・Square連携管理を実装予定</p>
      </div>
    </div>
  );
}
