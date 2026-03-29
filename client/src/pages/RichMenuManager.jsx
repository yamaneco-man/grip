import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function RichMenuManager() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMenu, setEditMenu] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(null);

  // フォーム
  const [name, setName] = useState('');
  const [chatBarText, setChatBarText] = useState('');
  const [areas, setAreas] = useState([{ label: '', action: '' }]);
  const [isDefault, setIsDefault] = useState(false);

  // ルールフォーム
  const [ruleCondition, setRuleCondition] = useState('');
  const [ruleMenuId, setRuleMenuId] = useState('');

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = () => {
    setLoading(true);
    api.getRichMenus().then(setMenus).catch(() => {}).finally(() => setLoading(false));
  };

  const resetForm = () => {
    setName('');
    setChatBarText('');
    setAreas([{ label: '', action: '' }]);
    setIsDefault(false);
    setEditMenu(null);
  };

  const openEdit = (menu) => {
    setEditMenu(menu);
    setName(menu.name || '');
    setChatBarText(menu.chat_bar_text || '');
    setAreas(menu.areas?.length ? menu.areas : [{ label: '', action: '' }]);
    setIsDefault(menu.is_default || false);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const payload = { name: name.trim(), chat_bar_text: chatBarText.trim(), areas, is_default: isDefault };
      if (editMenu) {
        const updated = await api.updateRichMenu(editMenu.id, payload);
        setMenus(menus.map(m => m.id === editMenu.id ? { ...m, ...updated } : m));
      } else {
        const created = await api.createRichMenu(payload);
        setMenus([created, ...menus]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('このリッチメニューを削除しますか？')) return;
    try {
      await api.deleteRichMenu(id);
      setMenus(menus.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.updateRichMenu(id, { is_default: true });
      setMenus(menus.map(m => ({ ...m, is_default: m.id === id })));
    } catch (err) {
      alert(err.message);
    }
  };

  const addArea = () => setAreas([...areas, { label: '', action: '' }]);
  const removeArea = (i) => setAreas(areas.filter((_, idx) => idx !== i));
  const updateArea = (i, key, val) => setAreas(areas.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!ruleCondition.trim() || !ruleMenuId) return;
    try {
      await api.addRichMenuRule({ menu_id: showRuleForm, condition: ruleCondition.trim(), target_menu_id: ruleMenuId });
      setShowRuleForm(null);
      setRuleCondition('');
      setRuleMenuId('');
      fetchMenus();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteRule = async (menuId, ruleId) => {
    if (!confirm('このルールを削除しますか？')) return;
    try {
      await api.deleteRichMenuRule(menuId, ruleId);
      fetchMenus();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>リッチメニュー管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>LINE公式アカウントのリッチメニューを作成・管理</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ メニュー作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-4 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{editMenu ? 'メニュー編集' : '新規メニュー作成'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>メニュー名</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例: メインメニュー"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>チャットバーテキスト</label>
              <input type="text" value={chatBarText} onChange={e => setChatBarText(e.target.value)}
                placeholder="例: メニューを開く"
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>エリア設定</label>
            {areas.map((area, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input type="text" value={area.label} onChange={e => updateArea(i, 'label', e.target.value)}
                  placeholder="ラベル" className="flex-1 px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                <input type="text" value={area.action} onChange={e => updateArea(i, 'action', e.target.value)}
                  placeholder="アクション (URL or テキスト)" className="flex-1 px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                {areas.length > 1 && (
                  <button type="button" onClick={() => removeArea(i)} className="text-[14px] px-2" style={{ color: 'var(--red)' }}>×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addArea} className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>＋ エリア追加</button>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isDefault" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
            <label htmlFor="isDefault" className="text-[11px]" style={{ color: 'var(--text2)' }}>デフォルトメニューに設定</label>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={creating}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {creating ? '保存中...' : editMenu ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border2)' }}>キャンセル</button>
          </div>
        </form>
      )}

      {/* メニュー一覧 */}
      {menus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {menus.map(menu => (
            <div key={menu.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{menu.name}</span>
                  {menu.is_default && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--green)' }}>デフォルト</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(menu)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>編集</button>
                  {!menu.is_default && (
                    <button onClick={() => handleSetDefault(menu.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--green)' }}>デフォルトにする</button>
                  )}
                  <button onClick={() => handleDelete(menu.id)} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--red)' }}>削除</button>
                </div>
              </div>
              {menu.chat_bar_text && (
                <p className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>チャットバー: {menu.chat_bar_text}</p>
              )}
              {menu.areas?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {menu.areas.map((a, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text2)' }}>{a.label || `エリア${i + 1}`}</span>
                  ))}
                </div>
              )}

              {/* 自動切替ルール */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>自動切替ルール</span>
                  <button onClick={() => setShowRuleForm(showRuleForm === menu.id ? null : menu.id)}
                    className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>＋ ルール追加</button>
                </div>
                {menu.rules?.length > 0 ? menu.rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between text-[11px] py-1" style={{ color: 'var(--text3)' }}>
                    <span>{rule.condition}</span>
                    <button onClick={() => handleDeleteRule(menu.id, rule.id)} className="px-1" style={{ color: 'var(--red)' }}>×</button>
                  </div>
                )) : (
                  <p className="text-[10px]" style={{ color: 'var(--text3)' }}>ルールなし</p>
                )}

                {showRuleForm === menu.id && (
                  <form onSubmit={handleAddRule} className="mt-2 flex gap-2 items-end">
                    <div className="flex-1">
                      <input type="text" value={ruleCondition} onChange={e => setRuleCondition(e.target.value)}
                        placeholder="条件 (例: タグ=VIP)" className="w-full px-2 py-1.5 rounded text-[11px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                    </div>
                    <div className="flex-1">
                      <select value={ruleMenuId} onChange={e => setRuleMenuId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded text-[11px]"
                        style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                        <option value="">切替先メニュー</option>
                        {menus.filter(m => m.id !== menu.id).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="px-3 py-1.5 rounded text-[11px] text-white" style={{ background: 'var(--accent)' }}>追加</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📱</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>まだリッチメニューがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ メニュー作成」からリッチメニューを追加しましょう</p>
        </div>
      )}
    </div>
  );
}
