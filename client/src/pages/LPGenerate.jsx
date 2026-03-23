import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function LPGenerate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    price: '',
    target: '',
    strengths: '',
    reviews: '',
    lineUrl: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.generateLP(form);
      navigate('/lp');
    } catch (err) {
      alert('LP生成エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'productName', label: '商品名', required: true, placeholder: '例: オンライン英語コーチング' },
    { name: 'price', label: '価格', placeholder: '例: 29800' },
    { name: 'target', label: 'ターゲット', required: true, placeholder: '例: 30代の英語を学び直したい社会人', textarea: true },
    { name: 'strengths', label: '強み・実績', placeholder: '例: 受講者500名突破、TOEIC平均150点アップ', textarea: true },
    { name: 'reviews', label: '口コミ（任意）', placeholder: '例: 3ヶ月で目標達成できました！', textarea: true },
    { name: 'lineUrl', label: 'LINE友達追加URL', placeholder: 'https://lin.ee/xxxxx' },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">LP自動生成</h2>
      <p className="text-gray-500 mb-6">商品情報を入力すると、LP全文をHTMLで自動生成します</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.textarea ? (
              <textarea
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            ) : (
              <input
                type="text"
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? '生成中...（60〜90秒かかります）' : 'LPを自動生成する'}
        </button>
      </form>
    </div>
  );
}
