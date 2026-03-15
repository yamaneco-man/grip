import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function LPList() {
  const [lps, setLps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLPs()
      .then(setLps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">LP管理</h2>
        <Link to="/lp/generate"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          + 新規LP作成
        </Link>
      </div>

      {lps.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">まだLPがありません</p>
          <Link to="/lp/generate" className="text-indigo-600 font-medium hover:underline">
            最初のLPを作成する
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {lps.map(lp => (
            <div key={lp.id} className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">{lp.product_name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ターゲット: {lp.target} / PV: {lp.pv_count} / 登録: {lp.registration_count}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  作成日: {new Date(lp.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div className="flex gap-2">
                {lp.html_url && (
                  <a href={lp.html_url} target="_blank" rel="noreferrer"
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    公開LP
                  </a>
                )}
                <a href={`/api/lp/view/${lp.id}`} target="_blank" rel="noreferrer"
                  className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                >
                  プレビュー
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
