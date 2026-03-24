import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const PATTERN_LABELS = {
  A: { title: '共感型', color: 'border-blue-400 bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  B: { title: '論理型', color: 'border-green-400 bg-green-50', badge: 'bg-green-100 text-green-700' },
  C: { title: '感情型', color: 'border-purple-400 bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
};

export default function ObjectionHandling() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [follower, setFollower] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getFollower(id),
      api.getCurrentPlan().catch(() => ({ plan: 'free' })),
    ])
      .then(([f, plan]) => {
        setFollower(f);
        setCurrentPlan(plan);
        // 最新の受信メッセージをデフォルトで入力欄に設定
        const lastInMsg = (f.messages || [])
          .filter(m => m.direction === 'in')
          .pop();
        if (lastInMsg) setMessage(lastInMsg.content);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const isPro = currentPlan && ['pro', 'vip'].includes(currentPlan.plan);

  async function handleGenerate() {
    if (!message.trim()) return;
    setGenerating(true);
    setResults(null);
    try {
      const data = await api.handleObjection(id, message);
      setResults(data.patterns || data);
    } catch (err) {
      alert(err.message || '生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/followers/${id}`)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ← 戻る
        </button>
        <h2 className="text-2xl font-bold text-gray-800">反論処理AI</h2>
        {follower && (
          <span className="text-gray-500">— {follower.display_name || '不明'}</span>
        )}
      </div>

      {!isPro ? (
        /* PROプラン未満の制限表示 */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">PROプラン以上でご利用いただけます</h3>
          <p className="text-gray-500 mb-6">
            反論処理AI機能は、PROプランまたはVIPプランでご利用いただけます。
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            プランをアップグレード
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 入力エリア */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ユーザーメッセージ</h3>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="ユーザーのメッセージを入力してください..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={generating || !message.trim()}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {generating ? '生成中...' : '反論処理を生成'}
              </button>
            </div>
          </div>

          {/* 結果表示 */}
          {results && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">生成結果</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(PATTERN_LABELS).map(([key, label]) => {
                  const pattern = Array.isArray(results)
                    ? results.find(r => r.type === key || r.label === key)
                    : results[key];
                  const text = pattern?.message || pattern?.text || pattern || '';

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border-2 p-6 ${label.color}`}
                    >
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${label.badge}`}>
                        パターン{key}: {label.title}
                      </span>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
                        {typeof text === 'string' ? text : JSON.stringify(text)}
                      </p>
                      <button
                        onClick={() => handleCopy(typeof text === 'string' ? text : JSON.stringify(text), key)}
                        className="w-full py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        {copied === key ? 'コピーしました！' : 'このメッセージをコピー'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
