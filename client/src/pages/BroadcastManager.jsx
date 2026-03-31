import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const STATUS_MAP = {
  draft: { label: '下書き', color: 'var(--text3)' },
  sent: { label: '送信済み', color: 'var(--green)' },
  scheduled: { label: '予約済み', color: 'var(--accent)' },
  failed: { label: '失敗', color: 'var(--red)' },
};

export default function BroadcastManager() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(null);

  // フォーム
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetTags, setTargetTags] = useState('');

  useEffect(() => {
    api.getBroadcasts().then(setBroadcasts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setTargetType('all');
    setTargetTags('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setCreating(true);
    try {
      const created = await api.createBroadcast({
        title: title.trim(),
        message: message.trim(),
        target_type: targetType,
        target_tags: targetType === 'tags' ? targetTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      setBroadcasts([created, ...broadcasts]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (id) => {
    if (!confirm('この配信を送信しますか？')) return;
    setSending(id);
    try {
      const result = await api.sendBroadcast(id);
      setBroadcasts(broadcasts.map(b => b.id === id ? { ...b, status: 'sent', sent_count: result.sent_count || b.sent_count } : b));
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('この配信を削除しますか？')) return;
    try {
      await api.deleteBroadcast(id);
      setBroadcasts(broadcasts.filter(b => b.id !== id));
    } catch (err) {
      alert(err.message);
    }
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
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>一斉配信</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>フォロワーへのメッセージ一斉配信を管理</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + 新規配信
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規配信作成</h3>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイトル</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="例: 4月キャンペーンのお知らせ" className="w-full px-3 py-2 rounded-lg text-[12px]"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メッセージ内容</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
              placeholder="配信するメッセージを入力..."
              className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ターゲット</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text)' }}>
                <input type="radio" name="targetType" value="all" checked={targetType === 'all'}
                  onChange={e => setTargetType(e.target.value)} />
                全員
              </label>
              <label className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text)' }}>
                <input type="radio" name="targetType" value="tags" checked={targetType === 'tags'}
                  onChange={e => setTargetType(e.target.value)} />
                タグ指定
              </label>
            </div>
            {targetType === 'tags' && (
              <input type="text" value={targetTags} onChange={e => setTargetTags(e.target.value)}
                placeholder="タグ名をカンマ区切りで入力 例: VIP, 高関心層"
                className="w-full px-3 py-2 rounded-lg text-[12px] mt-2"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '作成中...' : '下書き保存'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 配信一覧 */}
      {broadcasts.length > 0 ? (
        <div className="space-y-3">
          {broadcasts.map(bc => {
            const st = STATUS_MAP[bc.status] || STATUS_MAP.draft;
            return (
              <div key={bc.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{bc.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ color: st.color, background: 'var(--surface)' }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                        送信数: {bc.sent_count || 0}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                        {formatDate(bc.sent_at || bc.created_at)}
                      </span>
                      {bc.target_type === 'tags' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                          タグ指定
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {bc.status === 'draft' && (
                      <button onClick={() => handleSend(bc.id)} disabled={sending === bc.id}
                        className="text-[11px] font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'var(--green)' }}>
                        {sending === bc.id ? '送信中...' : '送信'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(bc.id)}
                      className="text-[11px] font-medium px-2 py-1.5 rounded-lg"
                      style={{ color: 'var(--red)' }}>
                      x
                    </button>
                  </div>
                </div>
                <p className="text-[11px] mt-2 whitespace-pre-wrap" style={{ color: 'var(--text3)' }}>{bc.message}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📢</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>配信がありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ 新規配信」から配信を作成しましょう</p>
        </div>
      )}
    </div>
  );
}
