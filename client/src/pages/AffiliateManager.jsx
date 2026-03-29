import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const TABS = [
  { key: 'dashboard', label: 'ダッシュボード' },
  { key: 'programs', label: 'プログラム' },
  { key: 'partners', label: 'パートナー' },
  { key: 'conversions', label: 'コンバージョン' },
  { key: 'payouts', label: '支払い' },
];

export default function AffiliateManager() {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // 統計
  const [stats, setStats] = useState(null);

  // プログラム
  const [programs, setPrograms] = useState([]);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [progName, setProgName] = useState('');
  const [progRate, setProgRate] = useState(50);
  const [progType, setProgType] = useState('percentage');
  const [creatingProg, setCreatingProg] = useState(false);

  // パートナー
  const [partners, setPartners] = useState([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerProgram, setPartnerProgram] = useState('');
  const [creatingPartner, setCreatingPartner] = useState(false);

  // コンバージョン
  const [conversions, setConversions] = useState([]);

  // 支払い
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  const loadTabData = async (t) => {
    setLoading(true);
    try {
      switch (t) {
        case 'dashboard': {
          const s = await api.getAffiliateStats();
          setStats(s);
          break;
        }
        case 'programs': {
          const p = await api.getAffiliatePrograms();
          setPrograms(p || []);
          break;
        }
        case 'partners': {
          const p = await api.getAffiliatePartners();
          setPartners(p || []);
          if (!programs.length) {
            const progs = await api.getAffiliatePrograms();
            setPrograms(progs || []);
          }
          break;
        }
        case 'conversions': {
          const c = await api.getAffiliateConversions();
          setConversions(c || []);
          break;
        }
        case 'payouts': {
          const p = await api.getAffiliatePayouts?.() || [];
          setPayouts(p);
          break;
        }
      }
    } catch {}
    setLoading(false);
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!progName.trim()) return;
    setCreatingProg(true);
    try {
      const created = await api.createAffiliateProgram?.({
        name: progName.trim(),
        commission_rate: progRate,
        commission_type: progType,
      });
      if (created) setPrograms([created, ...programs]);
      setProgName('');
      setProgRate(50);
      setShowProgramForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingProg(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!partnerName.trim() || !partnerEmail.trim()) return;
    setCreatingPartner(true);
    try {
      const created = await api.createAffiliatePartner?.({
        name: partnerName.trim(),
        email: partnerEmail.trim(),
        program_id: partnerProgram || null,
      });
      if (created) setPartners([created, ...partners]);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerProgram('');
      setShowPartnerForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingPartner(false);
    }
  };

  const handleApproveConversion = async (id) => {
    try {
      await api.approveAffiliateConversion?.(id);
      setConversions(conversions.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>アフィリエイト管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>アフィリエイトプログラム・パートナー・コンバージョン管理</p>
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
          {/* ダッシュボード */}
          {tab === 'dashboard' && stats && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: '総クリック数', value: stats.total_clicks?.toLocaleString() || '0' },
                  { label: '総コンバージョン', value: stats.total_conversions?.toLocaleString() || '0' },
                  { label: 'CV率', value: `${stats.conversion_rate || 0}%` },
                  { label: '総報酬額', value: `¥${(stats.total_commission || 0).toLocaleString()}` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text3)' }}>{s.label}</p>
                    <p className="text-[20px] font-bold mt-1" style={{ color: 'var(--text)' }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {stats.top_partners?.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>トップパートナー</h3>
                  {stats.top_partners.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-[12px]"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ color: 'var(--text)' }}>{p.name}</span>
                      <span className="font-mono" style={{ color: 'var(--text3)' }}>¥{(p.commission || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* プログラム */}
          {tab === 'programs' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowProgramForm(!showProgramForm)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--text)' }}>＋ プログラム作成</button>
              </div>

              {showProgramForm && (
                <form onSubmit={handleCreateProgram} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>プログラム名</label>
                      <input type="text" value={progName} onChange={e => setProgName(e.target.value)} required
                        placeholder="例: GRIP紹介プログラム" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>報酬率/額</label>
                      <input type="number" value={progRate} onChange={e => setProgRate(Number(e.target.value))} min={0}
                        className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>報酬タイプ</label>
                      <select value={progType} onChange={e => setProgType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                        <option value="percentage">パーセンテージ（%）</option>
                        <option value="fixed">固定額（円）</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={creatingProg}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {creatingProg ? '作成中...' : '作成する'}
                  </button>
                </form>
              )}

              {programs.length > 0 ? (
                <div className="space-y-2">
                  {programs.map(p => (
                    <div key={p.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                      <div>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{p.name}</span>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                          報酬: {p.commission_rate}{p.commission_type === 'percentage' ? '%' : '円'} / パートナー: {p.partner_count || 0}名
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>プログラムがありません</p>
                </div>
              )}
            </div>
          )}

          {/* パートナー */}
          {tab === 'partners' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowPartnerForm(!showPartnerForm)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--text)' }}>＋ パートナー追加</button>
              </div>

              {showPartnerForm && (
                <form onSubmit={handleCreatePartner} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>名前</label>
                      <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)} required
                        placeholder="パートナー名" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メール</label>
                      <input type="email" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} required
                        placeholder="email@example.com" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>プログラム</label>
                      <select value={partnerProgram} onChange={e => setPartnerProgram(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                        <option value="">選択してください</option>
                        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={creatingPartner}
                    className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {creatingPartner ? '追加中...' : '追加する'}
                  </button>
                </form>
              )}

              {partners.length > 0 ? (
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ background: 'var(--surface)' }}>
                        <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                        <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>メール</th>
                        <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>アフィリエイトコード</th>
                        <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>クリック</th>
                        <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>CV</th>
                        <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>報酬</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map(p => (
                        <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{p.name}</td>
                          <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{p.email}</td>
                          <td className="px-4 py-2.5">
                            <code className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>{p.affiliate_code || '—'}</code>
                          </td>
                          <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text3)' }}>{p.clicks || 0}</td>
                          <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text3)' }}>{p.conversions || 0}</td>
                          <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text)' }}>¥{(p.total_commission || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3">🤝</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>パートナーがいません</p>
                </div>
              )}
            </div>
          )}

          {/* コンバージョン */}
          {tab === 'conversions' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              {conversions.length > 0 ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>パートナー</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>商品</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>金額</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>報酬</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.map(c => (
                      <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{c.created_at?.substring(0, 16)}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{c.partner_name}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{c.product_name || '—'}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text)' }}>¥{(c.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text)' }}>¥{(c.commission || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                            background: c.status === 'approved' ? 'var(--green-l)' : c.status === 'pending' ? 'var(--surface)' : '#fef2f2',
                            color: c.status === 'approved' ? 'var(--green)' : c.status === 'pending' ? 'var(--text3)' : 'var(--red)',
                          }}>{c.status === 'approved' ? '承認済み' : c.status === 'pending' ? '保留' : c.status}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.status === 'pending' && (
                            <button onClick={() => handleApproveConversion(c.id)}
                              className="text-[10px] font-medium px-2 py-1 rounded text-white"
                              style={{ background: 'var(--green)' }}>承認</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>コンバージョンがありません</p>
                </div>
              )}
            </div>
          )}

          {/* 支払い */}
          {tab === 'payouts' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              {payouts.length > 0 ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>パートナー</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>金額</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(p => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{p.created_at?.substring(0, 10)}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{p.partner_name}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text)' }}>¥{(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                            background: p.status === 'paid' ? 'var(--green-l)' : 'var(--surface)',
                            color: p.status === 'paid' ? 'var(--green)' : 'var(--text3)',
                          }}>{p.status === 'paid' ? '支払済み' : '未払い'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">💰</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>支払い記録がありません</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
