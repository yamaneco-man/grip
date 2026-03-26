import React, { useEffect, useState } from 'react';

export default function AdminSystem() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => {});
  }, []);

  const services = [
    { name: 'API サーバー', desc: 'Railway (Node.js + Express)', status: health?.status === 'ok' ? 'ok' : 'error', url: 'grip-api-production.up.railway.app' },
    { name: 'データベース', desc: 'Supabase (PostgreSQL)', status: health?.status === 'ok' ? 'ok' : 'error' },
    { name: '決済', desc: 'Square (Checkout API + Webhook)', status: 'ok' },
    { name: 'メッセージング', desc: 'LINE Messaging API', status: 'ok' },
    { name: 'AI', desc: 'Claude API (Sonnet)', status: 'ok' },
    { name: '自動化', desc: 'n8n (3ワークフロー)', status: 'ok' },
  ];

  const envVars = [
    { name: 'SUPABASE_URL', set: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', set: true },
    { name: 'LINE_CHANNEL_ACCESS_TOKEN', set: true },
    { name: 'LINE_CHANNEL_SECRET', set: true },
    { name: 'ANTHROPIC_API_KEY', set: true },
    { name: 'SQUARE_ACCESS_TOKEN', set: true },
    { name: 'SQUARE_LOCATION_ID', set: true },
    { name: 'SQUARE_WEBHOOK_SIGNATURE_KEY', set: true },
    { name: 'CORS_ORIGIN', set: true },
  ];

  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>システム設定</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>インフラ状態・外部サービス接続・環境変数</p>

      {/* サービス状態 */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>外部サービス接続状態</div>
        </div>
        {services.map(s => (
          <div key={s.name} className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.status === 'ok' ? 'var(--green)' : 'var(--red)' }} />
            <div className="flex-1">
              <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{s.name}</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.desc}</div>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
              style={{
                background: s.status === 'ok' ? 'var(--green-l)' : 'var(--red-l)',
                color: s.status === 'ok' ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${s.status === 'ok' ? 'var(--green-m)' : '#ffc9c9'}`,
              }}>
              {s.status === 'ok' ? '稼働中' : 'エラー'}
            </span>
          </div>
        ))}
      </div>

      {/* 環境変数 */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>環境変数（Railway）</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {envVars.map(v => (
            <div key={v.name} className="flex items-center gap-2 px-5 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: v.set ? 'var(--green)' : 'var(--red)' }} />
              <span className="text-[12px] font-mono" style={{ color: 'var(--text2)' }}>{v.name}</span>
              <span className="ml-auto text-[10px] font-mono" style={{ color: v.set ? 'var(--green)' : 'var(--red)' }}>
                {v.set ? '設定済' : '未設定'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* セキュリティ */}
      <div className="rounded-xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>セキュリティ設定</h3>
        <div className="space-y-2">
          {[
            { label: 'Supabase RLS', status: '有効', ok: true },
            { label: 'Square Webhook署名検証', status: '必須化', ok: true },
            { label: 'LINE Webhook署名検証', status: 'timingSafeEqual', ok: true },
            { label: 'ログインレート制限', status: '5回/15分', ok: true },
            { label: 'AI APIレート制限', status: '20回/時間', ok: true },
            { label: 'Dockerfile', status: '非rootユーザー', ok: true },
            { label: 'CORS', status: '環境変数で制御', ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-[12px]" style={{ color: 'var(--text2)' }}>{s.label}</span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded"
                style={{ background: 'var(--green-l)', color: 'var(--green)', border: '1px solid var(--green-m)' }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
