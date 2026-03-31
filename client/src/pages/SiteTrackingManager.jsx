import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function SiteTrackingManager() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [embedScript, setEmbedScript] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsId, setStatsId] = useState(null);
  const [statsDays, setStatsDays] = useState(7);
  const [copied, setCopied] = useState(false);

  // フォーム
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = () => {
    setLoading(true);
    api.getSiteTrackingScripts().then(setScripts).catch(() => {}).finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetUrl.trim()) return;
    setCreating(true);
    try {
      const created = await api.createSiteTrackingScript({ name: name.trim(), target_url: targetUrl.trim() });
      setScripts([created, ...scripts]);
      setName('');
      setTargetUrl('');
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このスクリプトを削除しますか？')) return;
    try {
      await api.deleteSiteTrackingScript(id);
      setScripts(scripts.filter(s => s.id !== id));
      if (statsId === id) { setStats(null); setStatsId(null); }
      if (embedScript?.id === id) setEmbedScript(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const showEmbed = async (script) => {
    if (embedScript?.id === script.id) { setEmbedScript(null); return; }
    try {
      const data = await api.getSiteTrackingEmbed(script.id);
      setEmbedScript({ ...script, code: data.code || data });
    } catch (err) {
      alert(err.message);
    }
  };

  const copyEmbed = () => {
    if (!embedScript?.code) return;
    navigator.clipboard.writeText(embedScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showStats = async (id) => {
    if (statsId === id) { setStats(null); setStatsId(null); return; }
    setStatsId(id);
    try {
      const data = await api.getSiteTrackingStats(id, statsDays);
      setStats(data);
    } catch (err) {
      alert(err.message);
      setStatsId(null);
    }
  };

  const refreshStats = async () => {
    if (!statsId) return;
    try {
      const data = await api.getSiteTrackingStats(statsId, statsDays);
      setStats(data);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>サイトトラッキング</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Webサイトにスクリプトを埋め込み、PV・クリックを計測</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ スクリプト作成
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規スクリプト</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>スクリプト名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: LPトラッキング"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>対象URL</label>
              <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required
                placeholder="例: https://example.com"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '作成中...' : '作成する'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* スクリプト一覧 */}
      {scripts.length > 0 ? (
        <div className="space-y-3">
          {scripts.map(script => (
            <div key={script.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{script.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ background: script.enabled !== false ? 'var(--green)' : 'var(--text3)' }}>
                      {script.enabled !== false ? '有効' : '無効'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{script.target_url}</span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>イベント: {script.event_count || 0}件</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => showEmbed(script)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>埋め込みコード</button>
                  <button onClick={() => showStats(script.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--green)' }}>統計</button>
                  <button onClick={() => handleDelete(script.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                </div>
              </div>

              {/* 埋め込みコード */}
              {embedScript?.id === script.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>埋め込みコード</span>
                    <button onClick={copyEmbed}
                      className="text-[10px] px-2 py-1 rounded text-white"
                      style={{ background: copied ? 'var(--green)' : 'var(--accent)' }}>
                      {copied ? 'コピーしました' : 'コピー'}
                    </button>
                  </div>
                  <pre className="text-[11px] p-3 rounded-lg overflow-x-auto" style={{ background: 'var(--surface)', color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {embedScript.code}
                  </pre>
                </div>
              )}

              {/* 統計 */}
              {statsId === script.id && stats && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>統計情報</span>
                    <div className="flex items-center gap-2">
                      <select value={statsDays} onChange={e => { setStatsDays(Number(e.target.value)); }}
                        className="text-[10px] px-2 py-1 rounded"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                        <option value={7}>7日間</option>
                        <option value={30}>30日間</option>
                        <option value={90}>90日間</option>
                      </select>
                      <button onClick={refreshStats} className="text-[10px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>更新</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                      <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{(stats.pv || 0).toLocaleString()}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>PV</div>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                      <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{(stats.clicks || 0).toLocaleString()}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>クリック</div>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface)' }}>
                      <div className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{stats.pv ? ((stats.clicks / stats.pv) * 100).toFixed(1) : 0}%</div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>CTR</div>
                    </div>
                  </div>
                  {stats.top_pages?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>上位ページ</span>
                      <div className="mt-1 space-y-1">
                        {stats.top_pages.map((page, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] py-1">
                            <span style={{ color: 'var(--text)' }}>{page.path}</span>
                            <span className="font-mono" style={{ color: 'var(--text3)' }}>{page.count}回</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだスクリプトがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ スクリプト作成」からトラッキングを始めましょう</p>
        </div>
      )}
    </div>
  );
}
