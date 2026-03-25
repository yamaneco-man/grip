import React from 'react';

const MATERIALS = [
  { category: '提案書', items: [
    { name: 'GRIP紹介資料（PDF）', desc: 'GRIPの機能・料金・導入メリットをまとめた提案書', icon: '📄', format: 'PDF' },
    { name: '競合比較表', desc: 'Lステップ・エルメ・UTAGEとの比較資料', icon: '📊', format: 'PDF' },
  ]},
  { category: 'ウェビナー', items: [
    { name: 'ウェビナー録画（課題共感型）', desc: 'TikTok/YouTube向け。LINE集客の課題から入るパターン', icon: '🎥', format: 'MP4' },
    { name: 'ウェビナー録画（実績データ型）', desc: 'note/SEO向け。ROIと数字で語るパターン', icon: '🎥', format: 'MP4' },
    { name: 'ウェビナー録画（ストーリー型）', desc: 'X/紹介向け。開発者の想いで共感を得るパターン', icon: '🎥', format: 'MP4' },
  ]},
  { category: 'LP素材', items: [
    { name: 'クロージングLP URL', desc: 'ウェビナー後に送るクロージング用ランディングページ', icon: '🔗', format: 'URL' },
    { name: 'バナー画像セット', desc: 'SNS投稿・広告用のバナー画像（複数サイズ）', icon: '🖼', format: 'ZIP' },
  ]},
];

export default function PartnerMaterials() {
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>販売素材</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>提案書・ウェビナー録画・LP素材のダウンロード</p>

      {MATERIALS.map(cat => (
        <div key={cat.category} className="mb-5">
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>{cat.category}</h3>
          <div className="space-y-2">
            {cat.items.map(item => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:shadow-sm cursor-pointer"
                style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] shrink-0"
                  style={{ background: 'var(--surface)' }}>{item.icon}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{item.name}</div>
                  <div className="text-[11.5px]" style={{ color: 'var(--text3)' }}>{item.desc}</div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
                  {item.format}
                </span>
                <button className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
                  style={{ background: 'var(--text)', color: '#fff' }}>
                  📥 DL
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
          新しい素材が追加されるとここに表示されます。リクエストは「お問い合わせ」からどうぞ。
        </p>
      </div>
    </div>
  );
}
