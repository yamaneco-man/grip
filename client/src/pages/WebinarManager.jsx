import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const SCHEDULE_TYPES = [
  { key: 'evergreen', label: 'エバーグリーン（常時公開）' },
  { key: 'scheduled', label: 'スケジュール配信' },
  { key: 'replay', label: 'リプレイのみ' },
];

export default function WebinarManager() {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // フォーム
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [scheduleType, setScheduleType] = useState('evergreen');
  const [scheduledAt, setScheduledAt] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  // 詳細表示
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // AI生成
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingPage, setGeneratingPage] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [generatedPage, setGeneratedPage] = useState('');

  useEffect(() => {
    api.getWebinars().then(setWebinars).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const created = await api.createWebinar({
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl.trim(),
        schedule_type: scheduleType,
        scheduled_at: scheduledAt || null,
        cta_text: ctaText.trim(),
        cta_url: ctaUrl.trim(),
      });
      setWebinars([created, ...webinars]);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setCtaText('');
      setCtaUrl('');
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openStats = async (webinar) => {
    setSelectedWebinar(webinar);
    setLoadingStats(true);
    try {
      const s = await api.getWebinarStats(webinar.id);
      setStats(s);
    } catch {} finally { setLoadingStats(false); }
  };

  const handleGenerateScript = async () => {
    if (!selectedWebinar) return;
    setGeneratingScript(true);
    try {
      const result = await api.aiGenerateWebinarScript(selectedWebinar.id);
      setGeneratedScript(result.script || result.content || '');
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGeneratePage = async () => {
    if (!selectedWebinar) return;
    setGeneratingPage(true);
    try {
      const result = await api.aiGenerateWebinarPage(selectedWebinar.id);
      setGeneratedPage(result.html || result.content || '');
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingPage(false);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>自動ウェビナー管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>ウェビナーの作成・統計・AI台本生成</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ ウェビナー作成
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規ウェビナー</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイトル</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="例: 売上3倍にするLINE活用術" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>動画URL</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..." className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>説明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="ウェビナーの説明" className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>スケジュールタイプ</label>
              <select value={scheduleType} onChange={e => setScheduleType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                {SCHEDULE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            {scheduleType === 'scheduled' && (
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>配信日時</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>CTAボタンテキスト</label>
              <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)}
                placeholder="例: 今すぐ申し込む" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>CTAリンクURL</label>
              <input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {creating ? '作成中...' : '作成する'}
          </button>
        </form>
      )}

      {/* ウェビナー一覧 */}
      {webinars.length > 0 ? (
        <div className="space-y-3">
          {webinars.map(w => (
            <div key={w.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{w.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text3)' }}>
                      {SCHEDULE_TYPES.find(t => t.key === w.schedule_type)?.label || w.schedule_type}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                      登録者: {w.registrant_count || 0}名
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openStats(w)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>統計・詳細</button>
                </div>
              </div>
              {w.description && <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{w.description}</p>}

              {/* 詳細・統計パネル */}
              {selectedWebinar?.id === w.id && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {loadingStats ? (
                    <div className="text-center py-4" style={{ color: 'var(--text3)' }}>読み込み中...</div>
                  ) : stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: '登録者数', value: stats.registrants || 0 },
                        { label: '視聴者数', value: stats.viewers || 0 },
                        { label: '平均視聴率', value: `${stats.avg_watch_rate || 0}%` },
                        { label: 'CTA クリック率', value: `${stats.cta_click_rate || 0}%` },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                          <p className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>{s.label}</p>
                          <p className="text-[16px] font-bold mt-1" style={{ color: 'var(--text)' }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleGenerateScript} disabled={generatingScript}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                      style={{ background: 'var(--accent)' }}>
                      {generatingScript ? 'AI生成中...' : 'AI台本生成'}
                    </button>
                    <button onClick={handleGeneratePage} disabled={generatingPage}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                      style={{ background: 'var(--green)' }}>
                      {generatingPage ? 'AI生成中...' : 'AI登録ページ生成'}
                    </button>
                    <button onClick={() => { setSelectedWebinar(null); setStats(null); setGeneratedScript(''); setGeneratedPage(''); }}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                      style={{ color: 'var(--text3)', border: '1px solid var(--border)' }}>閉じる</button>
                  </div>

                  {generatedScript && (
                    <div className="rounded-lg p-4" style={{ background: 'var(--surface)' }}>
                      <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>AI生成台本</p>
                      <pre className="text-[11px] whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{generatedScript}</pre>
                    </div>
                  )}

                  {generatedPage && (
                    <div className="rounded-lg p-4" style={{ background: 'var(--surface)' }}>
                      <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>AI生成登録ページHTML</p>
                      <pre className="text-[11px] whitespace-pre-wrap overflow-x-auto" style={{ color: 'var(--text)' }}>{generatedPage}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">🎥</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>ウェビナーがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ ウェビナー作成」から作成しましょう</p>
        </div>
      )}
    </div>
  );
}
