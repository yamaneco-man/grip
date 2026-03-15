import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function ChurnScores() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [recoveryMessages, setRecoveryMessages] = useState({});

  useEffect(() => {
    loadScores();
  }, []);

  async function loadScores() {
    try {
      const data = await api.getChurnScores();
      setScores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchCalculate() {
    setCalculating(true);
    try {
      await api.batchCalculate();
      await loadScores();
    } catch (err) {
      alert('計算エラー: ' + err.message);
    } finally {
      setCalculating(false);
    }
  }

  async function handleRecovery(followerId) {
    try {
      const msgs = await api.getRecoveryMessage(followerId);
      setRecoveryMessages(prev => ({ ...prev, [followerId]: msgs }));
    } catch (err) {
      alert('生成エラー: ' + err.message);
    }
  }

  const getStatusBadge = (score) => {
    if (score == null) return { label: '未計算', bg: 'bg-gray-100', text: 'text-gray-600' };
    if (score <= 30) return { label: 'アクティブ', bg: 'bg-green-100', text: 'text-green-700' };
    if (score <= 60) return { label: '要注意', bg: 'bg-yellow-100', text: 'text-yellow-700' };
    if (score <= 80) return { label: '危険', bg: 'bg-orange-100', text: 'text-orange-700' };
    return { label: 'ブロック直前', bg: 'bg-red-100', text: 'text-red-700' };
  };

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">離脱検知</h2>
          <p className="text-gray-500 text-sm mt-1">友達の冷め度スコアを監視</p>
        </div>
        <button
          onClick={handleBatchCalculate}
          disabled={calculating}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {calculating ? '計算中...' : '全員のスコアを再計算'}
        </button>
      </div>

      {scores.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">友達データがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scores.map(item => {
            const latestScore = item.churn_scores?.[0]?.score;
            const badge = getStatusBadge(latestScore);
            const recovery = recoveryMessages[item.id];

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-800">{item.display_name || '不明'}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    {latestScore != null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              latestScore <= 30 ? 'bg-green-500' :
                              latestScore <= 60 ? 'bg-yellow-500' :
                              latestScore <= 80 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${latestScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-600">{latestScore}/100</span>
                      </div>
                    )}
                  </div>
                  {latestScore >= 61 && (
                    <button
                      onClick={() => handleRecovery(item.id)}
                      className="px-3 py-1 text-sm bg-orange-50 text-orange-600 rounded hover:bg-orange-100"
                    >
                      復活メッセージ生成
                    </button>
                  )}
                </div>

                {/* 復活メッセージ表示 */}
                {recovery && (
                  <div className="mt-4 border-t pt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-600">復活メッセージ候補:</p>
                    {recovery.map((msg, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <span className="text-xs text-gray-400 mr-2">{msg.type}</span>
                        {msg.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
