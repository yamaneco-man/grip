import React from 'react';

export default function PartnerMaterials() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>販売素材</h2>
      <p className="text-[13px] mb-6" style={{ color: 'var(--text3)' }}>LP・提案書・ウェビナー録画のダウンロード</p>
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">📁</div>
        <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>販売素材ページ</p>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>提案書テンプレ・ウェビナー録画・LP素材のダウンロードを実装予定</p>
      </div>
    </div>
  );
}
