import React, { useState } from 'react';

export default function PartnerSupport() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    // TODO: サポートAPIに送信
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>お問い合わせ</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>GRIP運営へのお問い合わせ・サポート</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* お問い合わせフォーム */}
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text)' }}>お問い合わせフォーム</h3>

          {sent && (
            <div className="rounded-lg px-4 py-3 mb-4 text-[13px]"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}>
              送信しました。1営業日以内に回答いたします。
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>カテゴリ</label>
              <select className="w-full px-4 py-2.5 rounded-lg text-[14px]"
                style={{ background: 'var(--white)', border: '1px solid var(--border2)', color: 'var(--text)' }}>
                <option>技術的な質問</option>
                <option>販売素材のリクエスト</option>
                <option>還元率・契約について</option>
                <option>不具合報告</option>
                <option>その他</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>メッセージ</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                placeholder="お問い合わせ内容を入力してください"
                className="w-full px-4 py-2.5 rounded-lg text-[14px] resize-none"
                style={{ background: 'var(--white)', border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <button type="submit"
              className="px-6 py-2.5 rounded-lg text-[14px] font-medium text-white transition-all hover:-translate-y-px"
              style={{ background: 'var(--purple)' }}>
              送信する
            </button>
          </form>
        </div>

        {/* FAQ */}
        <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text)' }}>よくある質問</h3>
          <div className="space-y-4">
            {[
              { q: '還元率はいつから適用？', a: '契約後の最初の半年は100%キャッシュバック。半年後から50%永久還元です。' },
              { q: '振込はいつ？', a: '毎月5日に前月分をまとめて振込みます。' },
              { q: '紹介リンクは複数作れる？', a: '現在は1つです。複数リンク対応は今後実装予定です。' },
              { q: '顧客が解約したら？', a: '解約月から還元は停止します。再契約時は自動で紐付けされます。' },
            ].map((faq, i) => (
              <div key={i} className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{faq.q}</div>
                <div className="text-[11.5px]" style={{ color: 'var(--text3)' }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
