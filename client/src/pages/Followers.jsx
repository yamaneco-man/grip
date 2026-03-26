import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const CHANNEL_LABELS = {
  tiktok: { label: 'TikTok', color: 'var(--text)' },
  youtube: { label: 'YouTube', color: 'var(--red)' },
  x: { label: 'X', color: 'var(--text)' },
  note: { label: 'note', color: 'var(--green)' },
  seo: { label: 'SEO', color: 'var(--blue)' },
  referral: { label: '紹介', color: 'var(--purple)' },
  ad: { label: '広告', color: 'var(--amber)' },
  agency: { label: '代理店', color: 'var(--purple)' },
  direct: { label: '直接', color: 'var(--text3)' },
};

export default function Followers() {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFollowers()
      .then(data => setFollowers(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  const getChurnColor = (score) => {
    if (score == null) return 'var(--text3)';
    if (score <= 30) return 'var(--green)';
    if (score <= 60) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div>
      <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>LINE友達一覧</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>{followers.length}名の友達</p>

      {followers.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">👥</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだ友達がいません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>LPからLINE友達追加されると自動で表示されます</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {['名前', '流入経路', '登録日', '最終返信', '冷め度', '成約確率', '状態'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-mono"
                    style={{ color: 'var(--text3)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {followers.map(f => {
                const churnScore = f.churn_scores?.[0]?.score;
                const closingProb = f.closing_scores?.[0]?.probability;
                const channel = CHANNEL_LABELS[f.source_channel] || CHANNEL_LABELS.direct;
                return (
                  <tr key={f.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <Link to={`/followers/${f.id}`} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--blue), var(--green))' }}>
                          {(f.display_name || '?')[0]}
                        </div>
                        <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                          {f.display_name || '不明'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded"
                        style={{ background: 'var(--surface)', color: channel.color, border: '1px solid var(--border)' }}>
                        {channel.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>
                        {new Date(f.registered_at).toLocaleDateString('ja-JP')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11.5px] font-mono" style={{ color: 'var(--text3)' }}>
                        {f.last_replied_at ? new Date(f.last_replied_at).toLocaleDateString('ja-JP') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[40px] h-[4px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${churnScore || 0}%`, background: getChurnColor(churnScore) }} />
                        </div>
                        <span className="text-[11px] font-mono font-medium" style={{ color: getChurnColor(churnScore) }}>
                          {churnScore != null ? churnScore : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11.5px] font-mono font-medium" style={{ color: closingProb != null ? 'var(--blue)' : 'var(--text3)' }}>
                        {closingProb != null ? `${closingProb}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.is_blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono"
                          style={{ background: 'var(--red-l)', color: 'var(--red)', border: '1px solid #ffc9c9' }}>
                          <span className="w-1 h-1 rounded-full bg-current" />ブロック
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono"
                          style={{ background: 'var(--green-l)', color: 'var(--green)', border: '1px solid var(--green-m)' }}>
                          <span className="w-1 h-1 rounded-full bg-current" />アクティブ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
