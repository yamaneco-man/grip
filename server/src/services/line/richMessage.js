const { lineClient } = require('../../config/line');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * リッチメッセージ送信サービス
 * LINE Messaging APIの全メッセージタイプに対応
 */

// テキストメッセージ
function buildTextMessage(text, quickReply) {
  const msg = { type: 'text', text };
  if (quickReply) msg.quickReply = quickReply;
  return msg;
}

// 画像メッセージ
function buildImageMessage(originalUrl, previewUrl) {
  return {
    type: 'image',
    originalContentUrl: originalUrl,
    previewImageUrl: previewUrl || originalUrl,
  };
}

// 動画メッセージ
function buildVideoMessage(videoUrl, previewUrl) {
  return {
    type: 'video',
    originalContentUrl: videoUrl,
    previewImageUrl: previewUrl,
  };
}

// 音声メッセージ
function buildAudioMessage(audioUrl, duration) {
  return {
    type: 'audio',
    originalContentUrl: audioUrl,
    duration: duration || 60000,
  };
}

// ボタンテンプレート
function buildButtonMessage({ title, text, thumbnailUrl, actions }) {
  return {
    type: 'template',
    altText: title || text,
    template: {
      type: 'buttons',
      thumbnailImageUrl: thumbnailUrl || undefined,
      title: title ? title.substring(0, 40) : undefined,
      text: text.substring(0, 160),
      actions: actions.slice(0, 4).map(normalizeAction),
    },
  };
}

// カルーセルメッセージ
function buildCarouselMessage({ altText, columns }) {
  return {
    type: 'template',
    altText: altText || 'カルーセル',
    template: {
      type: 'carousel',
      columns: columns.slice(0, 10).map(col => ({
        thumbnailImageUrl: col.thumbnailUrl || undefined,
        title: col.title ? col.title.substring(0, 40) : undefined,
        text: (col.text || '').substring(0, 120),
        actions: (col.actions || []).slice(0, 3).map(normalizeAction),
      })),
    },
  };
}

// 確認テンプレート
function buildConfirmMessage({ text, actions }) {
  return {
    type: 'template',
    altText: text,
    template: {
      type: 'confirm',
      text: text.substring(0, 240),
      actions: actions.slice(0, 2).map(normalizeAction),
    },
  };
}

// Flex Message
function buildFlexMessage({ altText, contents }) {
  return {
    type: 'flex',
    altText: altText || 'メッセージ',
    contents,
  };
}

// スタンプメッセージ
function buildStickerMessage(packageId, stickerId) {
  return {
    type: 'sticker',
    packageId: String(packageId),
    stickerId: String(stickerId),
  };
}

// アクション正規化
function normalizeAction(action) {
  switch (action.type) {
    case 'uri':
      return { type: 'uri', label: action.label.substring(0, 20), uri: action.uri };
    case 'message':
      return { type: 'message', label: action.label.substring(0, 20), text: action.text };
    case 'postback':
      return { type: 'postback', label: action.label.substring(0, 20), data: action.data, displayText: action.displayText };
    default:
      return { type: 'message', label: action.label?.substring(0, 20) || 'タップ', text: action.text || action.label };
  }
}

// クイックリプライ構築
function buildQuickReply(items) {
  if (!items || items.length === 0) return undefined;
  return {
    items: items.slice(0, 13).map(item => ({
      type: 'action',
      imageUrl: item.imageUrl || undefined,
      action: normalizeAction(item.action || item),
    })),
  };
}

// メッセージタイプに応じて構築
function buildMessage(msgData) {
  const quickReply = msgData.quickReply ? buildQuickReply(msgData.quickReply) : undefined;

  switch (msgData.type) {
    case 'text':
      return buildTextMessage(msgData.text, quickReply);
    case 'image':
      return buildImageMessage(msgData.originalUrl, msgData.previewUrl);
    case 'video':
      return buildVideoMessage(msgData.videoUrl, msgData.previewUrl);
    case 'audio':
      return buildAudioMessage(msgData.audioUrl, msgData.duration);
    case 'button':
    case 'buttons':
      return buildButtonMessage(msgData);
    case 'carousel':
      return buildCarouselMessage(msgData);
    case 'confirm':
      return buildConfirmMessage(msgData);
    case 'flex':
      return buildFlexMessage(msgData);
    case 'sticker':
      return buildStickerMessage(msgData.packageId, msgData.stickerId);
    default:
      return buildTextMessage(msgData.text || String(msgData));
  }
}

// 複数メッセージ一括送信（1リクエスト最大5件）
async function sendMessages(followerLineId, messages) {
  const built = messages.map(buildMessage);
  // LINE APIは1回5メッセージまで
  for (let i = 0; i < built.length; i += 5) {
    const batch = built.slice(i, i + 5);
    await lineClient.pushMessage({ to: followerLineId, messages: batch });
  }
  return built;
}

// セグメント送信（条件分岐対応）
async function sendConditionalMessage(followerId, conditionalMessageId, userId) {
  const { data: cond } = await supabaseAdmin
    .from('conditional_messages')
    .select('*')
    .eq('id', conditionalMessageId)
    .eq('user_id', userId)
    .single();

  if (!cond) throw new Error('条件分岐メッセージが見つかりません');

  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('*, follower_tags(tag_id)')
    .eq('id', followerId)
    .single();

  if (!follower) throw new Error('フォロワーが見つかりません');

  const followerTagIds = (follower.follower_tags || []).map(ft => ft.tag_id);

  // 条件マッチング
  let matchedMessage = null;
  for (const condition of cond.conditions) {
    if (evaluateCondition(condition, follower, followerTagIds)) {
      matchedMessage = condition.message;
      break;
    }
  }

  // マッチしなければデフォルトメッセージ
  const messageToSend = matchedMessage || cond.default_message;
  const built = buildMessage(messageToSend);

  await lineClient.pushMessage({
    to: follower.follower_line_id,
    messages: [built],
  });

  // メッセージログ保存
  await supabaseAdmin.from('messages').insert({
    follower_id: followerId,
    direction: 'out',
    content: JSON.stringify(messageToSend),
  });

  return built;
}

// 条件評価エンジン
function evaluateCondition(condition, follower, followerTagIds) {
  switch (condition.type) {
    case 'has_tag':
      return followerTagIds.includes(condition.value);
    case 'not_has_tag':
      return !followerTagIds.includes(condition.value);
    case 'step_day_gte':
      return follower.step_day >= Number(condition.value);
    case 'step_day_lte':
      return follower.step_day <= Number(condition.value);
    case 'step_day_eq':
      return follower.step_day === Number(condition.value);
    case 'registered_days_gte': {
      const days = Math.floor((Date.now() - new Date(follower.registered_at).getTime()) / 86400000);
      return days >= Number(condition.value);
    }
    case 'emotion_positive':
      return true; // 直近の感情スコアチェックはメッセージログから
    default:
      return false;
  }
}

module.exports = {
  buildMessage,
  buildTextMessage,
  buildImageMessage,
  buildVideoMessage,
  buildAudioMessage,
  buildButtonMessage,
  buildCarouselMessage,
  buildConfirmMessage,
  buildFlexMessage,
  buildStickerMessage,
  buildQuickReply,
  sendMessages,
  sendConditionalMessage,
  evaluateCondition,
};
