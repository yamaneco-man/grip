import React from 'react';

export default function AdminPermissions() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>権限管理</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text3)' }}>管理者アカウント・ロール・アクセス制御</p>
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">🔐</div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>権限管理ページ</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>管理者招待・ロール設定・操作ログを実装予定</p>
      </div>
    </div>
  );
}
