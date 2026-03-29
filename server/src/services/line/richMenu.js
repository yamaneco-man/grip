const { lineClient } = require('../../config/line');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * リッチメニュー管理サービス
 * CRUD + LINE API連携 + 自動切替ルール
 */

// リッチメニュー作成（LINE API + DB保存）
async function createRichMenu(userId, menuData) {
  // LINE APIでリッチメニュー作成
  const richMenuObject = {
    size: { width: 2500, height: menuData.height || 1686 },
    selected: menuData.selected || false,
    name: menuData.name,
    chatBarText: menuData.chatBarText || 'メニュー',
    areas: (menuData.areas || []).map(area => ({
      bounds: area.bounds,
      action: normalizeRichMenuAction(area.action),
    })),
  };

  const lineRichMenuId = await lineClient.createRichMenu(richMenuObject);

  // 画像アップロード（Base64 or URL）
  if (menuData.imageData) {
    const buffer = Buffer.from(menuData.imageData, 'base64');
    await lineClient.setRichMenuImage(lineRichMenuId, buffer, 'image/png');
  }

  // DB保存
  const { data, error } = await supabaseAdmin
    .from('rich_menus')
    .insert({
      user_id: userId,
      name: menuData.name,
      line_rich_menu_id: lineRichMenuId,
      chat_bar_text: menuData.chatBarText || 'メニュー',
      areas: menuData.areas || [],
      image_url: menuData.imageUrl || null,
      is_default: menuData.isDefault || false,
    })
    .select()
    .single();

  if (error) throw error;

  // デフォルト設定の場合、LINE APIにもデフォルト登録
  if (menuData.isDefault) {
    await lineClient.setDefaultRichMenu(lineRichMenuId);
    // 他のデフォルトを解除
    await supabaseAdmin
      .from('rich_menus')
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('id', data.id);
  }

  return data;
}

// リッチメニュー一覧取得
async function getRichMenus(userId) {
  const { data, error } = await supabaseAdmin
    .from('rich_menus')
    .select('*, rich_menu_rules(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// リッチメニュー更新
async function updateRichMenu(userId, menuId, updates) {
  const { data: existing } = await supabaseAdmin
    .from('rich_menus')
    .select('line_rich_menu_id')
    .eq('id', menuId)
    .eq('user_id', userId)
    .single();

  if (!existing) throw new Error('リッチメニューが見つかりません');

  // LINE上の古いメニューを削除して再作成
  if (existing.line_rich_menu_id && (updates.areas || updates.name || updates.chatBarText)) {
    try { await lineClient.deleteRichMenu(existing.line_rich_menu_id); } catch (e) { /* ignore */ }

    const richMenuObject = {
      size: { width: 2500, height: updates.height || 1686 },
      selected: false,
      name: updates.name || 'GRIP Menu',
      chatBarText: updates.chatBarText || 'メニュー',
      areas: (updates.areas || []).map(area => ({
        bounds: area.bounds,
        action: normalizeRichMenuAction(area.action),
      })),
    };
    const newLineId = await lineClient.createRichMenu(richMenuObject);
    updates.line_rich_menu_id = newLineId;

    if (updates.imageData) {
      const buffer = Buffer.from(updates.imageData, 'base64');
      await lineClient.setRichMenuImage(newLineId, buffer, 'image/png');
    }
  }

  const { data, error } = await supabaseAdmin
    .from('rich_menus')
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.chatBarText && { chat_bar_text: updates.chatBarText }),
      ...(updates.areas && { areas: updates.areas }),
      ...(updates.line_rich_menu_id && { line_rich_menu_id: updates.line_rich_menu_id }),
      ...(updates.isDefault !== undefined && { is_default: updates.isDefault }),
    })
    .eq('id', menuId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  if (updates.isDefault && data.line_rich_menu_id) {
    await lineClient.setDefaultRichMenu(data.line_rich_menu_id);
    await supabaseAdmin
      .from('rich_menus')
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('id', menuId);
  }

  return data;
}

// リッチメニュー削除
async function deleteRichMenu(userId, menuId) {
  const { data: existing } = await supabaseAdmin
    .from('rich_menus')
    .select('line_rich_menu_id')
    .eq('id', menuId)
    .eq('user_id', userId)
    .single();

  if (existing?.line_rich_menu_id) {
    try { await lineClient.deleteRichMenu(existing.line_rich_menu_id); } catch (e) { /* ignore */ }
  }

  await supabaseAdmin
    .from('rich_menus')
    .update({ is_active: false })
    .eq('id', menuId)
    .eq('user_id', userId);
}

// ユーザー個別にリッチメニューを適用
async function linkRichMenuToUser(followerLineId, lineRichMenuId) {
  await lineClient.linkRichMenuIdToUser(followerLineId, lineRichMenuId);
}

// 自動切替ルール追加
async function addSwitchRule(userId, menuId, rule) {
  const { data, error } = await supabaseAdmin
    .from('rich_menu_rules')
    .insert({
      user_id: userId,
      rich_menu_id: menuId,
      trigger_type: rule.triggerType,
      trigger_value: rule.triggerValue,
      priority: rule.priority || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 自動切替ルール削除
async function deleteSwitchRule(userId, ruleId) {
  await supabaseAdmin
    .from('rich_menu_rules')
    .delete()
    .eq('id', ruleId)
    .eq('user_id', userId);
}

// 自動切替の評価・実行（Webhookやステップ完了時に呼ばれる）
async function evaluateAndSwitchMenu(userId, followerLineId, triggerType, triggerValue) {
  const { data: rules } = await supabaseAdmin
    .from('rich_menu_rules')
    .select('*, rich_menus!inner(line_rich_menu_id, is_active)')
    .eq('user_id', userId)
    .eq('trigger_type', triggerType)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    if (!rule.rich_menus?.is_active || !rule.rich_menus?.line_rich_menu_id) continue;

    let matched = false;
    switch (rule.trigger_type) {
      case 'tag_added':
      case 'tag_removed':
      case 'keyword':
        matched = rule.trigger_value === triggerValue;
        break;
      case 'step_day':
        matched = String(rule.trigger_value) === String(triggerValue);
        break;
      case 'follow':
        matched = true;
        break;
      default:
        matched = false;
    }

    if (matched) {
      await linkRichMenuToUser(followerLineId, rule.rich_menus.line_rich_menu_id);
      return rule;
    }
  }

  return null;
}

function normalizeRichMenuAction(action) {
  if (!action) return { type: 'message', text: 'メニュー' };
  switch (action.type) {
    case 'uri':
      return { type: 'uri', uri: action.uri, label: action.label || '' };
    case 'message':
      return { type: 'message', text: action.text, label: action.label || '' };
    case 'postback':
      return { type: 'postback', data: action.data, label: action.label || '' };
    case 'richmenuswitch':
      return { type: 'richmenuswitch', richMenuAliasId: action.richMenuAliasId, data: action.data || '' };
    default:
      return { type: 'message', text: action.text || 'メニュー' };
  }
}

module.exports = {
  createRichMenu,
  getRichMenus,
  updateRichMenu,
  deleteRichMenu,
  linkRichMenuToUser,
  addSwitchRule,
  deleteSwitchRule,
  evaluateAndSwitchMenu,
};
