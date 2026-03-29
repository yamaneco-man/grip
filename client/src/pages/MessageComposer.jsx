import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const MESSAGE_TYPES = [
  { key: 'text', label: 'テキスト' },
  { key: 'image', label: '画像' },
  { key: 'video', label: '動画' },
  { key: 'carousel', label: 'カルーセル' },
  { key: 'buttons', label: 'ボタン' },
  { key: 'flex', label: 'Flex' },
];

export default function MessageComposer() {
  const [mode, setMode] = useState('single'); // single / broadcast
  const [msgType, setMsgType] = useState('text');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // メッセージフォーム
  const [targetUserId, setTargetUserId] = useState('');
  const [textContent, setTextContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [flexJson, setFlexJson] = useState('');
  const [buttonTitle, setButtonTitle] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonActions, setButtonActions] = useState([{ label: '', action: '' }]);

  // 条件分岐メッセージ
  const [conditionals, setConditionals] = useState([]);
  const [loadingCond, setLoadingCond] = useState(true);
  const [showCondForm, setShowCondForm] = useState(false);
  const [condName, setCondName] = useState('');
  const [condCondition, setCondCondition] = useState('');
  const [condMessage, setCondMessage] = useState('');
  const [creatingCond, setCreatingCond] = useState(false);

  useEffect(() => {
    api.getConditionalMessages().then(setConditionals).catch(() => {}).finally(() => setLoadingCond(false));
  }, []);

  const buildPayload = () => {
    const base = { type: msgType };
    switch (msgType) {
      case 'text': return { ...base, text: textContent };
      case 'image': return { ...base, image_url: imageUrl, alt_text: altText || '画像' };
      case 'video': return { ...base, video_url: videoUrl, alt_text: altText || '動画' };
      case 'buttons': return { ...base, title: buttonTitle, text: buttonText, actions: buttonActions };
      case 'flex': try { return { ...base, flex: JSON.parse(flexJson) }; } catch { alert('Flex JSONが不正です'); return null; }
      case 'carousel': return { ...base, text: textContent };
      default: return base;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    setSending(true);
    setResult(null);
    try {
      if (mode === 'single') {
        if (!targetUserId.trim()) { alert('送信先ユーザーIDを入力してください'); return; }
        await api.sendRichMessage({ user_id: targetUserId.trim(), ...payload });
      } else {
        await api.broadcastRichMessage(payload);
      }
      setResult({ success: true, message: mode === 'single' ? '送信しました' : '一斉配信しました' });
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleCreateConditional = async (e) => {
    e.preventDefault();
    if (!condName.trim() || !condCondition.trim() || !condMessage.trim()) return;
    setCreatingCond(true);
    try {
      const created = await api.createConditionalMessage({
        name: condName.trim(),
        condition: condCondition.trim(),
        message: condMessage.trim(),
      });
      setConditionals([created, ...conditionals]);
      setCondName('');
      setCondCondition('');
      setCondMessage('');
      setShowCondForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingCond(false);
    }
  };

  const addButtonAction = () => setButtonActions([...buttonActions, { label: '', action: '' }]);
  const updateButtonAction = (i, key, val) => setButtonActions(buttonActions.map((a, idx) => idx === i ? { ...a, [key]: val } : a));
  const removeButtonAction = (i) => setButtonActions(buttonActions.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>メッセージ配信</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>リッチメッセージの作成・送信・条件分岐メッセージ管理</p>
        </div>
        <button onClick={() => setShowCondForm(!showCondForm)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--green)' }}>
          ＋ 条件分岐メッセージ
        </button>
      </div>

      {result && (
        <div className="rounded-lg px-4 py-2.5 mb-4 text-[12px]"
          style={{ background: result.success ? 'var(--green-l)' : '#fef2f2', color: result.success ? 'var(--green)' : 'var(--red)' }}>
          {result.message}
        </div>
      )}

      {/* 送信モード切替 */}
      <div className="flex gap-2 mb-4">
        {[{ key: 'single', label: '個別送信' }, { key: 'broadcast', label: '一斉配信' }].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all"
            style={{
              background: mode === m.key ? 'var(--accent)' : 'var(--surface)',
              color: mode === m.key ? '#fff' : 'var(--text2)',
              border: `1px solid ${mode === m.key ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* メッセージ作成フォーム */}
      <form onSubmit={handleSend} className="rounded-xl p-5 mb-5 space-y-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>メッセージ作成</h3>

        {mode === 'single' && (
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>送信先ユーザーID</label>
            <input type="text" value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
              placeholder="LINE ユーザーID" className="w-full px-3 py-2 rounded-lg text-[12px]"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
        )}

        {/* メッセージタイプ選択 */}
        <div>
          <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>メッセージタイプ</label>
          <div className="flex flex-wrap gap-2">
            {MESSAGE_TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => setMsgType(t.key)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: msgType === t.key ? 'var(--accent)' : 'var(--surface)',
                  color: msgType === t.key ? '#fff' : 'var(--text2)',
                  border: `1px solid ${msgType === t.key ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* タイプ別フォーム */}
        {msgType === 'text' && (
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>テキスト</label>
            <textarea value={textContent} onChange={e => setTextContent(e.target.value)} rows={4}
              placeholder="メッセージ本文を入力..." className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
        )}

        {msgType === 'image' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>画像URL</label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>代替テキスト</label>
              <input type="text" value={altText} onChange={e => setAltText(e.target.value)}
                placeholder="画像の説明" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            {imageUrl && <img src={imageUrl} alt="プレビュー" className="max-w-[200px] rounded-lg" style={{ border: '1px solid var(--border)' }} />}
          </div>
        )}

        {msgType === 'video' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>動画URL</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>代替テキスト</label>
              <input type="text" value={altText} onChange={e => setAltText(e.target.value)}
                placeholder="動画の説明" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
        )}

        {msgType === 'buttons' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイトル</label>
              <input type="text" value={buttonTitle} onChange={e => setButtonTitle(e.target.value)}
                placeholder="ボタンメッセージのタイトル" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>本文</label>
              <textarea value={buttonText} onChange={e => setButtonText(e.target.value)} rows={2}
                placeholder="ボタンメッセージの本文" className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>アクション</label>
              {buttonActions.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input type="text" value={a.label} onChange={e => updateButtonAction(i, 'label', e.target.value)}
                    placeholder="ラベル" className="flex-1 px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                  <input type="text" value={a.action} onChange={e => updateButtonAction(i, 'action', e.target.value)}
                    placeholder="URL or テキスト" className="flex-1 px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                  {buttonActions.length > 1 && (
                    <button type="button" onClick={() => removeButtonAction(i)} className="text-[14px] px-2" style={{ color: 'var(--red)' }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addButtonAction} className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>＋ アクション追加</button>
            </div>
          </div>
        )}

        {msgType === 'flex' && (
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Flex Message JSON</label>
            <textarea value={flexJson} onChange={e => setFlexJson(e.target.value)} rows={8}
              placeholder='{"type": "bubble", "body": {...}}' className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
        )}

        {msgType === 'carousel' && (
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>カルーセル内容（テキスト）</label>
            <textarea value={textContent} onChange={e => setTextContent(e.target.value)} rows={4}
              placeholder="カルーセルの内容を入力..." className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
        )}

        <button type="submit" disabled={sending}
          className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
          style={{ background: mode === 'broadcast' ? 'var(--green)' : 'var(--accent)' }}>
          {sending ? '送信中...' : mode === 'single' ? '送信する' : '一斉配信する'}
        </button>
      </form>

      {/* 条件分岐メッセージ */}
      {showCondForm && (
        <form onSubmit={handleCreateConditional} className="rounded-xl p-4 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>条件分岐メッセージ作成</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>名前</label>
              <input type="text" value={condName} onChange={e => setCondName(e.target.value)} required
                placeholder="例: VIP歓迎メッセージ" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>条件</label>
              <input type="text" value={condCondition} onChange={e => setCondCondition(e.target.value)} required
                placeholder="例: tag=VIP AND days>=30" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メッセージ</label>
            <textarea value={condMessage} onChange={e => setCondMessage(e.target.value)} required rows={3}
              placeholder="条件に一致した場合に送信するメッセージ" className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <button type="submit" disabled={creatingCond}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {creatingCond ? '作成中...' : '作成する'}
          </button>
        </form>
      )}

      {/* 条件分岐メッセージ一覧 */}
      <h3 className="text-[14px] font-semibold mb-3" style={{ color: 'var(--text)' }}>条件分岐メッセージ一覧</h3>
      {loadingCond ? (
        <div className="text-center py-8" style={{ color: 'var(--text3)' }}>読み込み中...</div>
      ) : conditionals.length > 0 ? (
        <div className="space-y-2">
          {conditionals.map(c => (
            <div key={c.id} className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{c.name}</span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>条件: {c.condition}</p>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>メッセージ: {c.message?.substring(0, 50)}{c.message?.length > 50 ? '...' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">💬</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>条件分岐メッセージがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ 条件分岐メッセージ」から作成しましょう</p>
        </div>
      )}
    </div>
  );
}
