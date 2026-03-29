import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const TABS = [
  { key: 'settings', label: '設定' },
  { key: 'subscribers', label: '購読者' },
  { key: 'campaigns', label: 'キャンペーン' },
  { key: 'sequences', label: 'ステップメール' },
  { key: 'logs', label: 'ログ' },
];

const PROVIDERS = ['SendGrid', 'Mailgun', 'Amazon SES', 'Resend', 'SMTP'];

export default function EmailManager() {
  const [tab, setTab] = useState('settings');
  const [loading, setLoading] = useState(true);

  // 設定
  const [settings, setSettings] = useState({ provider: '', api_key: '', from_email: '', from_name: '' });
  const [saving, setSaving] = useState(false);

  // キャンペーン
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // ステップメール
  const [sequences, setSequences] = useState([]);
  const [showSeqForm, setShowSeqForm] = useState(false);
  const [seqName, setSeqName] = useState('');
  const [seqTopic, setSeqTopic] = useState('');
  const [seqSteps, setSeqSteps] = useState(5);
  const [generatingSeq, setGeneratingSeq] = useState(false);

  // 購読者・ログ
  const [subscribers, setSubscribers] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  const loadTabData = async (t) => {
    setLoading(true);
    try {
      switch (t) {
        case 'settings': {
          const s = await api.getEmailSettings();
          if (s) setSettings(s);
          break;
        }
        case 'subscribers': {
          const subs = await api.getEmailSubscribers?.() || [];
          setSubscribers(subs);
          break;
        }
        case 'campaigns': {
          const c = await api.getEmailCampaigns();
          setCampaigns(c || []);
          break;
        }
        case 'sequences': {
          const sq = await api.getEmailSequences();
          setSequences(sq || []);
          break;
        }
        case 'logs': {
          const l = await api.getEmailLogs?.() || [];
          setLogs(l);
          break;
        }
      }
    } catch {}
    setLoading(false);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveEmailSettings(settings);
      alert('設定を保存しました');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName.trim() || !campaignSubject.trim()) return;
    setCreatingCampaign(true);
    try {
      const created = await api.createEmailCampaign({
        name: campaignName.trim(),
        subject: campaignSubject.trim(),
        body: campaignBody.trim(),
      });
      setCampaigns([created, ...campaigns]);
      setCampaignName('');
      setCampaignSubject('');
      setCampaignBody('');
      setShowCampaignForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleSendCampaign = async (id) => {
    if (!confirm('このキャンペーンを送信しますか？')) return;
    try {
      await api.sendEmailCampaign(id);
      loadTabData('campaigns');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAiGenerateSequence = async (e) => {
    e.preventDefault();
    if (!seqName.trim() || !seqTopic.trim()) return;
    setGeneratingSeq(true);
    try {
      const generated = await api.aiGenerateEmailSequence({
        name: seqName.trim(),
        topic: seqTopic.trim(),
        steps: seqSteps,
      });
      setSequences([generated, ...sequences]);
      setSeqName('');
      setSeqTopic('');
      setShowSeqForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingSeq(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>メール配信管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>メールキャンペーン・ステップメールの作成と管理</p>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-5 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="text-[12px] font-medium px-4 py-2.5 transition-all whitespace-nowrap"
            style={{
              color: tab === t.key ? 'var(--accent)' : 'var(--text3)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>
      ) : (
        <>
          {/* 設定タブ */}
          {tab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="rounded-xl p-5 space-y-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>メール設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>プロバイダ</label>
                  <select value={settings.provider} onChange={e => setSettings({ ...settings, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                    <option value="">選択してください</option>
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>APIキー</label>
                  <input type="password" value={settings.api_key} onChange={e => setSettings({ ...settings, api_key: e.target.value })}
                    placeholder="APIキーを入力" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>送信元メールアドレス</label>
                  <input type="email" value={settings.from_email} onChange={e => setSettings({ ...settings, from_email: e.target.value })}
                    placeholder="info@example.com" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>送信元名</label>
                  <input type="text" value={settings.from_name} onChange={e => setSettings({ ...settings, from_name: e.target.value })}
                    placeholder="GRIP" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
                {saving ? '保存中...' : '設定を保存'}
              </button>
            </form>
          )}

          {/* 購読者タブ */}
          {tab === 'subscribers' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              {subscribers.length > 0 ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>メールアドレス</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>登録日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map(s => (
                      <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{s.email}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{s.name || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                            background: s.status === 'active' ? 'var(--green-l)' : 'var(--surface)',
                            color: s.status === 'active' ? 'var(--green)' : 'var(--text3)',
                          }}>{s.status === 'active' ? '有効' : '無効'}</span>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{s.created_at?.substring(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>購読者がいません</p>
                </div>
              )}
            </div>
          )}

          {/* キャンペーンタブ */}
          {tab === 'campaigns' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowCampaignForm(!showCampaignForm)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--text)' }}>
                  ＋ キャンペーン作成
                </button>
              </div>

              {showCampaignForm && (
                <form onSubmit={handleCreateCampaign} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>キャンペーン名</label>
                      <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} required
                        placeholder="例: 新機能リリースのお知らせ" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>件名</label>
                      <input type="text" value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} required
                        placeholder="メールの件名" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>本文（HTML可）</label>
                    <textarea value={campaignBody} onChange={e => setCampaignBody(e.target.value)} rows={6}
                      placeholder="メール本文を入力..." className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                      style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                  </div>
                  <button type="submit" disabled={creatingCampaign}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {creatingCampaign ? '作成中...' : '作成する'}
                  </button>
                </form>
              )}

              {campaigns.length > 0 ? (
                <div className="space-y-2">
                  {campaigns.map(c => (
                    <div key={c.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                      <div>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{c.name}</span>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>件名: {c.subject}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                          ステータス: {c.status === 'sent' ? '送信済み' : c.status === 'draft' ? '下書き' : c.status}
                          {c.sent_count != null && ` / 送信数: ${c.sent_count}`}
                        </p>
                      </div>
                      {c.status !== 'sent' && (
                        <button onClick={() => handleSendCampaign(c.id)}
                          className="text-[11px] font-medium px-3 py-1.5 rounded-lg text-white"
                          style={{ background: 'var(--green)' }}>送信</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3">📨</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>キャンペーンがありません</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ キャンペーン作成」から作成しましょう</p>
                </div>
              )}
            </div>
          )}

          {/* ステップメールタブ */}
          {tab === 'sequences' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowSeqForm(!showSeqForm)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--text)' }}>
                  ＋ ステップメール作成（AI生成）
                </button>
              </div>

              {showSeqForm && (
                <form onSubmit={handleAiGenerateSequence} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>AIステップメール生成</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>シーケンス名</label>
                      <input type="text" value={seqName} onChange={e => setSeqName(e.target.value)} required
                        placeholder="例: 新規登録フォローアップ" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>トピック・テーマ</label>
                      <input type="text" value={seqTopic} onChange={e => setSeqTopic(e.target.value)} required
                        placeholder="例: SaaSの使い方ガイド" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ステップ数</label>
                      <input type="number" value={seqSteps} onChange={e => setSeqSteps(Number(e.target.value))} min={1} max={30}
                        className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                  </div>
                  <button type="submit" disabled={generatingSeq}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {generatingSeq ? 'AI生成中...' : 'AIで生成する'}
                  </button>
                </form>
              )}

              {sequences.length > 0 ? (
                <div className="space-y-2">
                  {sequences.map(s => (
                    <div key={s.id} className="rounded-xl p-4"
                      style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{s.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text3)' }}>
                          {s.steps?.length || 0}ステップ
                        </span>
                      </div>
                      {s.steps?.map((step, i) => (
                        <div key={i} className="text-[11px] py-1 flex gap-2" style={{ color: 'var(--text3)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                          <span className="font-medium" style={{ color: 'var(--text2)' }}>Day {step.day || i + 1}:</span>
                          <span>{step.subject}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3">🤖</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>ステップメールがありません</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>AIで自動生成してみましょう</p>
                </div>
              )}
            </div>
          )}

          {/* ログタブ */}
          {tab === 'logs' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              {logs.length > 0 ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>宛先</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>件名</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{l.sent_at?.substring(0, 16)}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{l.to_email}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{l.subject}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                            background: l.status === 'delivered' ? 'var(--green-l)' : l.status === 'bounced' ? '#fef2f2' : 'var(--surface)',
                            color: l.status === 'delivered' ? 'var(--green)' : l.status === 'bounced' ? 'var(--red)' : 'var(--text3)',
                          }}>{l.status === 'delivered' ? '配信済み' : l.status === 'bounced' ? 'バウンス' : l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>ログがありません</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
