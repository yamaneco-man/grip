import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const QUESTION_TYPES = [
  { key: 'text', label: 'テキスト' },
  { key: 'radio', label: 'ラジオボタン' },
  { key: 'checkbox', label: 'チェックボックス' },
  { key: 'select', label: 'セレクト' },
];

export default function FormBuilder() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // フォーム作成
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState([]);

  // 回答表示
  const [selectedForm, setSelectedForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // 編集
  const [editingForm, setEditingForm] = useState(null);

  useEffect(() => {
    api.getForms().then(setForms).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { type: 'text', label: '', options: [], required: false }]);
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateOption = (qIdx, oIdx, value) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].options[oIdx] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIdx) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIdx, oIdx) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].options = newQuestions[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(newQuestions);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setQuestions([]);
    setEditingForm(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setCreating(true);
    try {
      if (editingForm) {
        const updated = await api.updateForm(editingForm.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          questions,
        });
        setForms(forms.map(f => f.id === editingForm.id ? { ...f, ...updated } : f));
      } else {
        const created = await api.createForm({
          title: formTitle.trim(),
          description: formDescription.trim(),
          questions,
        });
        setForms([created, ...forms]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (form) => {
    try {
      const detail = await api.getForm(form.id);
      setFormTitle(detail.title || '');
      setFormDescription(detail.description || '');
      setQuestions(detail.questions || []);
      setEditingForm(detail);
      setShowForm(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このフォームを削除しますか？')) return;
    try {
      await api.deleteForm(id);
      setForms(forms.filter(f => f.id !== id));
      if (selectedForm?.id === id) setSelectedForm(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openResponses = async (form) => {
    if (selectedForm?.id === form.id) { setSelectedForm(null); return; }
    setSelectedForm(form);
    setLoadingResponses(true);
    try {
      const r = await api.getFormResponses(form.id);
      setResponses(r || []);
    } catch {} finally { setLoadingResponses(false); }
  };

  const formatDate = (d) => {
    if (!d) return '--';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>回答フォーム管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>フォームを作成してフォロワーから回答を収集</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + フォーム作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            {editingForm ? 'フォーム編集' : '新規フォーム'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイトル</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required
                placeholder="例: アンケート" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>説明</label>
              <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)}
                placeholder="フォームの説明" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>

          {/* 質問一覧 */}
          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>質問</label>
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="rounded-lg p-3 mb-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>Q{qIdx + 1}</span>
                  <select value={q.type} onChange={e => updateQuestion(qIdx, 'type', e.target.value)}
                    className="text-[11px] px-2 py-1 rounded"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                    {QUESTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text3)' }}>
                    <input type="checkbox" checked={q.required} onChange={e => updateQuestion(qIdx, 'required', e.target.checked)} />
                    必須
                  </label>
                  <button type="button" onClick={() => removeQuestion(qIdx)}
                    className="ml-auto text-[12px] px-1" style={{ color: 'var(--red)' }}>x</button>
                </div>
                <input type="text" value={q.label} onChange={e => updateQuestion(qIdx, 'label', e.target.value)}
                  placeholder="質問文を入力" className="w-full px-2 py-1.5 rounded text-[11px] mb-2"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') && (
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-1">
                        <input type="text" value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`選択肢 ${oIdx + 1}`} className="flex-1 px-2 py-1 rounded text-[11px]"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                        <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                          className="text-[11px] px-1" style={{ color: 'var(--red)' }}>x</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(qIdx)}
                      className="text-[10px] px-2 py-0.5 rounded" style={{ color: 'var(--accent)' }}>
                      + 選択肢追加
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addQuestion}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
              + 質問を追加
            </button>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '保存中...' : editingForm ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* フォーム一覧 */}
      {forms.length > 0 ? (
        <div className="space-y-3">
          {forms.map(form => (
            <div key={form.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{form.title}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: form.status === 'active' ? 'var(--green-l, #dcfce7)' : 'var(--surface)', color: form.status === 'active' ? 'var(--green)' : 'var(--text3)' }}>
                      {form.status === 'active' ? '公開中' : '下書き'}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>質問: {form.question_count || 0}件</span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>回答: {form.response_count || 0}件</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openResponses(form)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    {selectedForm?.id === form.id ? '閉じる' : '回答'}
                  </button>
                  <button onClick={() => handleEdit(form)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    編集
                  </button>
                  <button onClick={() => handleDelete(form.id)}
                    className="text-[11px] font-medium px-2 py-1.5 rounded-lg"
                    style={{ color: 'var(--red)' }}>
                    x
                  </button>
                </div>
              </div>
              {form.description && <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{form.description}</p>}

              {/* 回答一覧 */}
              {selectedForm?.id === form.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>回答一覧</span>
                  {loadingResponses ? (
                    <div className="text-center py-4" style={{ color: 'var(--text3)' }}>読み込み中...</div>
                  ) : responses.length > 0 ? (
                    <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr style={{ background: 'var(--surface)' }}>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>回答者</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>回答日時</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>回答内容</th>
                          </tr>
                        </thead>
                        <tbody>
                          {responses.map(r => (
                            <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{r.respondent_name || '匿名'}</td>
                              <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{formatDate(r.created_at)}</td>
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>
                                {typeof r.answers === 'object' ? JSON.stringify(r.answers) : r.answers}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-center py-3" style={{ color: 'var(--text3)' }}>まだ回答がありません</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📋</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>フォームがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ フォーム作成」からフォームを追加しましょう</p>
        </div>
      )}
    </div>
  );
}
