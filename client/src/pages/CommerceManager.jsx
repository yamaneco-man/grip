import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const TABS = [
  { key: 'products', label: '商品' },
  { key: 'orders', label: '注文' },
  { key: 'funnels', label: 'ファネル' },
];

export default function CommerceManager() {
  const [tab, setTab] = useState('products');
  const [loading, setLoading] = useState(true);

  // 商品
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodType, setProdType] = useState('digital');
  const [prodBumpEnabled, setProdBumpEnabled] = useState(false);
  const [prodBumpName, setProdBumpName] = useState('');
  const [prodBumpPrice, setProdBumpPrice] = useState(0);
  const [prodUpsellEnabled, setProdUpsellEnabled] = useState(false);
  const [prodUpsellName, setProdUpsellName] = useState('');
  const [prodUpsellPrice, setProdUpsellPrice] = useState(0);
  const [creatingProd, setCreatingProd] = useState(false);

  // 注文
  const [orders, setOrders] = useState([]);

  // ファネル
  const [funnels, setFunnels] = useState([]);
  const [showFunnelForm, setShowFunnelForm] = useState(false);
  const [funnelName, setFunnelName] = useState('');
  const [funnelSteps, setFunnelSteps] = useState([{ name: '', type: 'optin', product_id: '' }]);
  const [creatingFunnel, setCreatingFunnel] = useState(false);

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  const loadTabData = async (t) => {
    setLoading(true);
    try {
      switch (t) {
        case 'products': {
          const p = await api.getProducts();
          setProducts(p || []);
          break;
        }
        case 'orders': {
          const o = await api.getOrders();
          setOrders(o || []);
          break;
        }
        case 'funnels': {
          const f = await api.getFunnels();
          setFunnels(f || []);
          if (!products.length) {
            const p = await api.getProducts();
            setProducts(p || []);
          }
          break;
        }
      }
    } catch {}
    setLoading(false);
  };

  const resetProductForm = () => {
    setEditProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(0);
    setProdType('digital');
    setProdBumpEnabled(false);
    setProdBumpName('');
    setProdBumpPrice(0);
    setProdUpsellEnabled(false);
    setProdUpsellName('');
    setProdUpsellPrice(0);
  };

  const openEditProduct = (p) => {
    setEditProduct(p);
    setProdName(p.name || '');
    setProdDesc(p.description || '');
    setProdPrice(p.price || 0);
    setProdType(p.type || 'digital');
    setProdBumpEnabled(!!p.order_bump);
    setProdBumpName(p.order_bump?.name || '');
    setProdBumpPrice(p.order_bump?.price || 0);
    setProdUpsellEnabled(!!p.upsell);
    setProdUpsellName(p.upsell?.name || '');
    setProdUpsellPrice(p.upsell?.price || 0);
    setShowProductForm(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    setCreatingProd(true);
    try {
      const payload = {
        name: prodName.trim(),
        description: prodDesc.trim(),
        price: prodPrice,
        type: prodType,
        order_bump: prodBumpEnabled ? { name: prodBumpName.trim(), price: prodBumpPrice } : null,
        upsell: prodUpsellEnabled ? { name: prodUpsellName.trim(), price: prodUpsellPrice } : null,
      };
      if (editProduct) {
        const updated = await api.updateProduct?.(editProduct.id, payload);
        setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...updated } : p));
      } else {
        const created = await api.createProduct(payload);
        setProducts([created, ...products]);
      }
      resetProductForm();
      setShowProductForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingProd(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('この商品を削除しますか？')) return;
    try {
      await api.deleteProduct?.(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const result = await api.generateInvoice(orderId);
      if (result.url) window.open(result.url, '_blank');
      else alert('請求書を生成しました');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateFunnel = async (e) => {
    e.preventDefault();
    if (!funnelName.trim()) return;
    setCreatingFunnel(true);
    try {
      const created = await api.createFunnel({
        name: funnelName.trim(),
        steps: funnelSteps.filter(s => s.name.trim()),
      });
      setFunnels([created, ...funnels]);
      setFunnelName('');
      setFunnelSteps([{ name: '', type: 'optin', product_id: '' }]);
      setShowFunnelForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingFunnel(false);
    }
  };

  const addFunnelStep = () => setFunnelSteps([...funnelSteps, { name: '', type: 'sales', product_id: '' }]);
  const removeFunnelStep = (i) => setFunnelSteps(funnelSteps.filter((_, idx) => idx !== i));
  const updateFunnelStep = (i, key, val) => setFunnelSteps(funnelSteps.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>EC・商品管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>商品・注文・ファネルの管理</p>
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
          {/* 商品タブ */}
          {tab === 'products' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => { resetProductForm(); setShowProductForm(!showProductForm); }}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--text)' }}>＋ 商品追加</button>
              </div>

              {showProductForm && (
                <form onSubmit={handleCreateProduct} className="rounded-xl p-5 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{editProduct ? '商品編集' : '新規商品'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>商品名</label>
                      <input type="text" value={prodName} onChange={e => setProdName(e.target.value)} required
                        placeholder="例: GRIPプロプラン" className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>価格（円）</label>
                      <input type="number" value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} min={0}
                        className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイプ</label>
                      <select value={prodType} onChange={e => setProdType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[12px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                        <option value="digital">デジタル</option>
                        <option value="subscription">サブスクリプション</option>
                        <option value="physical">物理商品</option>
                        <option value="service">サービス</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>説明</label>
                    <textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={2}
                      placeholder="商品の説明" className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                      style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                  </div>

                  {/* オーダーバンプ */}
                  <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="bumpEnabled" checked={prodBumpEnabled} onChange={e => setProdBumpEnabled(e.target.checked)} />
                      <label htmlFor="bumpEnabled" className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>オーダーバンプ</label>
                    </div>
                    {prodBumpEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input type="text" value={prodBumpName} onChange={e => setProdBumpName(e.target.value)}
                            placeholder="バンプ商品名" className="w-full px-3 py-2 rounded-lg text-[12px]"
                            style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                        </div>
                        <div>
                          <input type="number" value={prodBumpPrice} onChange={e => setProdBumpPrice(Number(e.target.value))} min={0}
                            placeholder="価格" className="w-full px-3 py-2 rounded-lg text-[12px]"
                            style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* アップセル */}
                  <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="upsellEnabled" checked={prodUpsellEnabled} onChange={e => setProdUpsellEnabled(e.target.checked)} />
                      <label htmlFor="upsellEnabled" className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>アップセル</label>
                    </div>
                    {prodUpsellEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input type="text" value={prodUpsellName} onChange={e => setProdUpsellName(e.target.value)}
                            placeholder="アップセル商品名" className="w-full px-3 py-2 rounded-lg text-[12px]"
                            style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                        </div>
                        <div>
                          <input type="number" value={prodUpsellPrice} onChange={e => setProdUpsellPrice(Number(e.target.value))} min={0}
                            placeholder="価格" className="w-full px-3 py-2 rounded-lg text-[12px]"
                            style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" disabled={creatingProd}
                      className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                      style={{ background: 'var(--accent)' }}>
                      {creatingProd ? '保存中...' : editProduct ? '更新する' : '作成する'}
                    </button>
                    <button type="button" onClick={() => { resetProductForm(); setShowProductForm(false); }}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium"
                      style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
                  </div>
                </form>
              )}

              {products.length > 0 ? (
                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{p.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text3)' }}>
                            {p.type === 'digital' ? 'デジタル' : p.type === 'subscription' ? 'サブスク' : p.type === 'physical' ? '物理' : 'サービス'}
                          </span>
                        </div>
                        <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--text)' }}>¥{(p.price || 0).toLocaleString()}</p>
                        <div className="flex gap-2 mt-1">
                          {p.order_bump && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--green-l)', color: 'var(--green)' }}>バンプ: {p.order_bump.name}</span>}
                          {p.upsell && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#eff6ff', color: '#3b82f6' }}>アップセル: {p.upsell.name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditProduct(p)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>編集</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3">🛍</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>商品がありません</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ 商品追加」から作成しましょう</p>
                </div>
              )}
            </div>
          )}

          {/* 注文タブ */}
          {tab === 'orders' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              {orders.length > 0 ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>注文ID</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>顧客</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>商品</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>金額</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>日時</th>
                      <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text3)' }}>#{o.id?.toString().slice(-6)}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{o.customer_name || o.customer_email || '—'}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{o.product_name || '—'}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text)' }}>¥{(o.total || 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                            background: o.status === 'paid' ? 'var(--green-l)' : o.status === 'refunded' ? '#fef2f2' : 'var(--surface)',
                            color: o.status === 'paid' ? 'var(--green)' : o.status === 'refunded' ? 'var(--red)' : 'var(--text3)',
                          }}>{o.status === 'paid' ? '支払済み' : o.status === 'refunded' ? '返金' : o.status === 'pending' ? '保留' : o.status}</span>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{o.created_at?.substring(0, 10)}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleGenerateInvoice(o.id)}
                            className="text-[10px] font-medium px-2 py-1 rounded"
                            style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>請求書</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>注文がありません</p>
                </div>
              )}
            </div>
          )}

          {/* ファネルタブ */}
          {tab === 'funnels' && (
            <div>
              <div className="flex justify-end mb-3">
                <button onClick={() => setShowFunnelForm(!showFunnelForm)}
                  className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--text)' }}>＋ ファネル作成</button>
              </div>

              {showFunnelForm && (
                <form onSubmit={handleCreateFunnel} className="rounded-xl p-5 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規ファネル</h3>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>ファネル名</label>
                    <input type="text" value={funnelName} onChange={e => setFunnelName(e.target.value)} required
                      placeholder="例: GRIP販売ファネル" className="w-full px-3 py-2 rounded-lg text-[12px]"
                      style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>ステップ</label>
                    {funnelSteps.map((step, i) => (
                      <div key={i} className="flex gap-2 mb-2 items-center">
                        <span className="text-[11px] font-bold w-6 text-center" style={{ color: 'var(--text3)' }}>{i + 1}</span>
                        <input type="text" value={step.name} onChange={e => updateFunnelStep(i, 'name', e.target.value)}
                          placeholder="ステップ名" className="flex-1 px-3 py-2 rounded-lg text-[12px]"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                        <select value={step.type} onChange={e => updateFunnelStep(i, 'type', e.target.value)}
                          className="px-3 py-2 rounded-lg text-[12px]"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                          <option value="optin">オプトイン</option>
                          <option value="sales">セールス</option>
                          <option value="upsell">アップセル</option>
                          <option value="thankyou">サンクス</option>
                        </select>
                        <select value={step.product_id} onChange={e => updateFunnelStep(i, 'product_id', e.target.value)}
                          className="px-3 py-2 rounded-lg text-[12px]"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                          <option value="">商品を選択</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {funnelSteps.length > 1 && (
                          <button type="button" onClick={() => removeFunnelStep(i)} className="text-[14px] px-2" style={{ color: 'var(--red)' }}>×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addFunnelStep} className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>＋ ステップ追加</button>
                  </div>
                  <button type="submit" disabled={creatingFunnel}
                    className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {creatingFunnel ? '作成中...' : '作成する'}
                  </button>
                </form>
              )}

              {funnels.length > 0 ? (
                <div className="space-y-3">
                  {funnels.map(f => (
                    <div key={f.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{f.name}</span>
                      {f.steps?.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                          {f.steps.map((step, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <div className="flex items-center text-[12px]" style={{ color: 'var(--text3)' }}>→</div>}
                              <div className="rounded-lg p-3 min-w-[120px] shrink-0" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                <p className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>
                                  {step.type === 'optin' ? 'オプトイン' : step.type === 'sales' ? 'セールス' : step.type === 'upsell' ? 'アップセル' : 'サンクス'}
                                </p>
                                <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--text)' }}>{step.name}</p>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3">🔄</div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>ファネルがありません</p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ ファネル作成」から作成しましょう</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
