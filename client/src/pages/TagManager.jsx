import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#6b7280', '#84cc16',
];

export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#6366f1');
  const [creating, setCreating] = useState(false);

  // セグメント配信
  const [showSend, setShowSend] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [message, setMessage] = useState('');
  const [matchAll, setMatchAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    api.getTags().then(setTags).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    setCreating(true);
    try {
      const tag = await api.createTag(tagName.trim(), tagColor);
      setTags([{ ...tag, follower_count: 0 }, ...tags]);
      setTagName('');
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このタグを削除しますか？関連する全てのタグ付けも解除されます。')) return;
    await api.deleteTag(id);
    setTags(tags.filter(t => t.id !== id));
  };

  const toggleTagSelection = (id) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSegmentSend = async (e) => {
    e.preventDefault();
    if (!selectedTags.length || !message.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = await api.segmentSend(selectedTags, message.trim(), matchAll);
      setSendResult(result);
      setMessage('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>タグ管理 & セグメント配信</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>フォロワーにタグを付けて、条件で絞り込み配信</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSend(!showSend)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
            style={{ background: 'var(--green)' }}>
            セグメント配信
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
            style={{ background: 'var(--text)' }}>
            ＋ タグ作成
          </button>
        </div>
      </div>

      {/* タグ作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-4 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タグ名</label>
              <input type="text" value={tagName} onChange={e => setTagName(e.target.value)} required
                placeholder="例: 高関心層, 要フォロー, VIP候補"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>カラー</label>
              <div className="flex gap-2 items-center">
                {TAG_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setTagColor(c)}
                    className="w-6 h-6 rounded-full transition-transform"
                    style={{ background: c, border: tagColor === c ? '2px solid var(--text)' : '2px solid transparent', transform: tagColor === c ? 'scale(1.2)' : 'scale(1)' }} />
                ))}
              </div>
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: tagColor }}>
            {creating ? '作成中...' : 'タグを作成'}
          </button>
        </form>
      )}

      {/* セグメント配信フォーム */}
      {showSend && (
        <div className="rounded-xl p-5 mb-5" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>セグメント配信</h3>

          {sendResult && (
            <div className="rounded-lg px-4 py-2.5 mb-3 text-[12px]"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}>
              {sendResult.message}
            </div>
          )}

          <form onSubmit={handleSegmentSend} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>送信対象タグを選択</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button key={tag.id} type="button" onClick={() => toggleTagSelection(tag.id)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: selectedTags.includes(tag.id) ? tag.color : 'var(--surface)',
                      color: selectedTags.includes(tag.id) ? '#fff' : 'var(--text2)',
                      border: `1px solid ${selectedTags.includes(tag.id) ? tag.color : 'var(--border)'}`,
                    }}>
                    {tag.name} ({tag.follower_count})
                  </button>
                ))}
              </div>
              {tags.length === 0 && (
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>まずタグを作成してください</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="matchAll" checked={matchAll} onChange={e => setMatchAll(e.target.checked)} />
              <label htmlFor="matchAll" className="text-[11px]" style={{ color: 'var(--text2)' }}>
                全てのタグに一致するフォロワーのみに送信（AND条件）
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メッセージ</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3}
                placeholder="送信するメッセージを入力..."
                className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>

            <button type="submit" disabled={sending || !selectedTags.length}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--green)' }}>
              {sending ? '送信中...' : `${selectedTags.length}個のタグに一致するフォロワーに送信`}
            </button>
          </form>
        </div>
      )}

      {/* タグ一覧 */}
      {tags.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map(tag => (
            <div key={tag.id} className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: 'var(--white)', border: '1px solid var(--border)', borderLeft: `4px solid ${tag.color}` }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: tag.color }} />
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{tag.name}</span>
                </div>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                  {tag.follower_count}名のフォロワー
                </span>
              </div>
              <button onClick={() => handleDelete(tag.id)}
                className="text-[14px] px-2 py-1 rounded transition-colors hover:bg-red-50"
                style={{ color: 'var(--red)' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">🏷</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだタグがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ タグ作成」からタグを追加して、フォロワーを分類しましょう</p>
        </div>
      )}
    </div>
  );
}
