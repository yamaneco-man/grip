import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Followers() {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFollowers()
      .then(setFollowers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  const getScoreColor = (score) => {
    if (!score && score !== 0) return 'text-gray-400';
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    if (score <= 80) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">LINE友達一覧</h2>

      {followers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">まだ友達がいません</p>
          <p className="text-sm text-gray-400 mt-2">LPからLINE友達追加されると自動で表示されます</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最終返信</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">冷め度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">成約確率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {followers.map(f => {
                const churnScore = f.churn_scores?.[0]?.score;
                const closingProb = f.closing_scores?.[0]?.probability;
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{f.display_name || '不明'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(f.registered_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.last_replied_at ? new Date(f.last_replied_at).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td className={`px-6 py-4 font-bold ${getScoreColor(churnScore)}`}>
                      {churnScore != null ? churnScore : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {closingProb != null ? `${closingProb}%` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {f.is_blocked ? (
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">ブロック</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">アクティブ</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
