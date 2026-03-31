import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function ReminderManager() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // フォーム
  const [name, setName] = useState('');
  const [eventId, setEventId] = useState('');
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    api.getReminders().then(setReminders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setName('');
    setEventId('');
    setSteps([]);
    setEditingReminder(null);
  };

  const addStep = () => {
    setSteps([...steps, { days_before: 1, message: '' }]);
  };

  const updateStep = (idx, field, value) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        event_id: eventId || null,
        steps,
      };
      if (editingReminder) {
        const updated = await api.updateReminder(editingReminder.id, data);
        setReminders(reminders.map(r => r.id === editingReminder.id ? { ...r, ...updated } : r));
      } else {
        const created = await api.createReminder(data);
        setReminders([created, ...reminders]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reminder) => {
    setName(reminder.name || '');
    setEventId(reminder.event_id || '');
    setSteps(reminder.steps || []);
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('このリマインダを削除しますか？')) return;
    try {
      await api.deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (reminder) => {
    try {
      const updated = await api.updateReminder(reminder.id, { enabled: !reminder.enabled });
      setReminders(reminders.map(r => r.id === reminder.id ? { ...r, enabled: !r.enabled, ...updated } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>リマインダ配信</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>イベント前のリマインドメッセージを自動配信</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + リマインダ作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            {editingReminder ? 'リマインダ編集' : '新規リマインダ'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>リマインダ名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: セミナー前リマインド" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>関連イベントID（任意）</label>
              <input type="text" value={eventId} onChange={e => setEventId(e.target.value)}
                placeholder="イベントIDを入力" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>

          {/* ステップ */}
          <div>
            <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>配信ステップ</label>
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-2 rounded-lg p-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: 'var(--text3)' }}>Step {idx + 1}</span>
                  <input type="number" value={step.days_before} onChange={e => updateStep(idx, 'days_before', Number(e.target.value))}
                    min={0} className="w-16 px-2 py-1 rounded text-[11px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                  <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text3)' }}>日前</span>
                </div>
                <textarea value={step.message} onChange={e => updateStep(idx, 'message', e.target.value)}
                  placeholder="メッセージを入力..." rows={2}
                  className="flex-1 px-2 py-1.5 rounded text-[11px] resize-none"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                <button type="button" onClick={() => removeStep(idx)}
                  className="text-[12px] px-1 mt-1" style={{ color: 'var(--red)' }}>x</button>
              </div>
            ))}
            <button type="button" onClick={addStep}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
              + ステップ追加
            </button>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? '保存中...' : editingReminder ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* リマインダ一覧 */}
      {reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map(rem => (
            <div key={rem.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{rem.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: rem.enabled !== false ? 'var(--green-l, #dcfce7)' : 'var(--surface)', color: rem.enabled !== false ? 'var(--green)' : 'var(--text3)' }}>
                      {rem.enabled !== false ? '有効' : '無効'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {rem.event_name && (
                      <span className="text-[11px]" style={{ color: 'var(--text3)' }}>イベント: {rem.event_name}</span>
                    )}
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                      {rem.steps?.length || 0}ステップ
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(rem)}
                    className="w-8 h-4 rounded-full relative transition-colors"
                    style={{ background: rem.enabled !== false ? 'var(--green)' : 'var(--border2)' }}>
                    <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                      style={{ left: rem.enabled !== false ? '16px' : '2px' }} />
                  </button>
                  <button onClick={() => handleEdit(rem)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    編集
                  </button>
                  <button onClick={() => handleDelete(rem.id)}
                    className="text-[11px] font-medium px-2 py-1.5 rounded-lg"
                    style={{ color: 'var(--red)' }}>
                    x
                  </button>
                </div>
              </div>
              {rem.steps && rem.steps.length > 0 && (
                <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                  {rem.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text3)' }}>
                        {step.days_before}日前
                      </span>
                      <span className="line-clamp-1" style={{ color: 'var(--text2)' }}>{step.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">⏰</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>リマインダがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ リマインダ作成」から設定しましょう</p>
        </div>
      )}
    </div>
  );
}
