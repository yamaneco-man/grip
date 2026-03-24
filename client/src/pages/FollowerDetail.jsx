import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function FollowerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [follower, setFollower] = useState(null);
  const [closingData, setClosingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFollower(id),
      api.getClosingScore(id).catch(() => null),
    ])
      .then(([f, cs]) => {
        setFollower(f);
        setClosingData(cs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">読み込み中...</p>;
  if (!follower) return <p className="text-gray-500">友達が見つかりません</p>;

  const messages = follower.messages || [];
  const churnScore = follower.churn_scores?.[0]?.score;
  const closingProb = closingData?.probability ?? follower.closing_scores?.[0]?.probability;

  const getScoreColor = (score) => {
    if (score == null) return 'text-gray-400';
    if (score <= 30) return 'text-green-600';
    if (score <= 60) return 'text-yellow-600';
    if (score <= 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const getClosingColor = (prob) => {
    if (prob == null) return 'text-gray-400';
    if (prob >= 70) return 'text-green-600';
    if (prob >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/followers')}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ← 戻る
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {follower.display_name || '不明'}
          </h2>
          {follower.is_blocked ? (
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">ブロック</span>
          ) : (
            <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">アクティブ</span>
          )}
        </div>
        <Link
          to={`/followers/${id}/objection`}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          反論処理AI
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: 友達情報 + チャット */}
        <div className="lg:col-span-2 space-y-6">
          {/* 友達情報カード */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">基本情報</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">登録日</p>
                <p className="font-medium text-gray-800">
                  {follower.registered_at
                    ? new Date(follower.registered_at).toLocaleDateString('ja-JP')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">ステップ日</p>
                <p className="font-medium text-gray-800">
                  {follower.step_day != null
                    ? `Day ${follower.step_day}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">最終返信</p>
                <p className="font-medium text-gray-800">
                  {follower.last_replied_at
                    ? new Date(follower.last_replied_at).toLocaleDateString('ja-JP')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">状態</p>
                <p className="font-medium text-gray-800">
                  {follower.is_blocked ? 'ブロック中' : 'アクティブ'}
                </p>
              </div>
            </div>
          </div>

          {/* メッセージ履歴 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">メッセージ履歴</h3>
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">メッセージがありません</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {messages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        msg.direction === 'out'
                          ? 'bg-indigo-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.direction === 'out' ? 'text-indigo-200' : 'text-gray-400'
                        }`}
                      >
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleString('ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右: スコアパネル */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">スコア</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">成約確率</p>
                <p className={`text-3xl font-bold ${getClosingColor(closingProb)}`}>
                  {closingProb != null ? `${closingProb}%` : '-'}
                </p>
                {closingData?.reason && (
                  <p className="text-xs text-gray-400 mt-1">{closingData.reason}</p>
                )}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">離脱スコア（冷め度）</p>
                <p className={`text-3xl font-bold ${getScoreColor(churnScore)}`}>
                  {churnScore != null ? churnScore : '-'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {churnScore == null
                    ? '未計測'
                    : churnScore <= 30
                    ? '良好'
                    : churnScore <= 60
                    ? '注意'
                    : '要対応'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
