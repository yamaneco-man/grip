import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // フォーム
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('');
    setMessageContent('');
    setEditingTemplate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !messageContent.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        category: category.trim(),
        message: messageContent.trim(),
      };
      if (editingTemplate) {
        const updated = await api.updateTemplate(editingTemplate.id, data);
        setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, ...updated } : t));
      } else {
        const created = await api.createTemplate(data);
        setTemplates([created, ...templates]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tpl) => {
    setName(tpl.name || '');
    setCategory(tpl.category || '');
    setMessageContent(tpl.message || '');
    setEditingTemplate(tpl);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('このテンプレートを削除しますか？')) return;
    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>テンプレート管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>よく使うメッセージをテンプレートとして保存・再利用</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + テンプレート作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            {editingTemplate ? 'テンプレート編集' : '新規テンプレート'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>テンプレート名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: ウェルカムメッセージ" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>カテゴリ</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                placeholder="例: 挨拶, 案内, フォロー" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メッセージ内容</label>
            <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} required rows={5}
              placeholder="テンプレートのメッセージを入力..."
              className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? '保存中...' : editingTemplate ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* テンプレート一覧 */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(tpl => (
            <div key={tpl.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{tpl.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(tpl)}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    編集
                  </button>
                  <button onClick={() => handleDelete(tpl.id)}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ color: 'var(--red)' }}>
                    削除
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {tpl.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                    {tpl.category}
                  </span>
                )}
                <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                  使用: {tpl.use_count || 0}回
                </span>
              </div>
              <p className="text-[11px] line-clamp-3 whitespace-pre-wrap" style={{ color: 'var(--text3)' }}>
                {tpl.message}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📝</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>テンプレートがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ テンプレート作成」からテンプレートを追加しましょう</p>
        </div>
      )}
    </div>
  );
}
