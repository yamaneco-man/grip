const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// キーワード応答ルール一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('keyword_rules')
      .select('*')
      .eq('user_id', req.user.id)
      .order('priority', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ルール作成
router.post('/', authenticate, async (req, res) => {
  const { keyword, match_type, response_type, response_content, action_tag_ids, priority } = req.body;
  if (!keyword || !response_content) return res.status(400).json({ error: 'キーワードと応答内容は必須です' });
  try {
    const { data, error } = await supabaseAdmin
      .from('keyword_rules')
      .insert({ user_id: req.user.id, keyword, match_type: match_type || 'partial', response_type: response_type || 'text', response_content, action_tag_ids, priority: priority || 0 })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ルール更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { keyword, match_type, response_type, response_content, action_tag_ids, priority, is_active } = req.body;
    const updates = {};
    if (keyword !== undefined) updates.keyword = keyword;
    if (match_type !== undefined) updates.match_type = match_type;
    if (response_type !== undefined) updates.response_type = response_type;
    if (response_content !== undefined) updates.response_content = response_content;
    if (action_tag_ids !== undefined) updates.action_tag_ids = action_tag_ids;
    if (priority !== undefined) updates.priority = priority;
    if (is_active !== undefined) updates.is_active = is_active;
    const { data, error } = await supabaseAdmin
      .from('keyword_rules').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ルール削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('keyword_rules').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// キーワードマッチング（Webhookから呼ばれる内部関数）
async function matchKeywordRule(userId, messageText) {
  const { data: rules } = await supabaseAdmin
    .from('keyword_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (!rules?.length) return null;

  for (const rule of rules) {
    let matched = false;
    switch (rule.match_type) {
      case 'exact':
        matched = messageText === rule.keyword;
        break;
      case 'partial':
        matched = messageText.includes(rule.keyword);
        break;
      case 'regex':
        try {
          if (rule.keyword.length > 200) break;
          matched = new RegExp(rule.keyword).test(messageText.slice(0, 1000));
        } catch {}
        break;
    }
    if (matched) return rule;
  }
  return null;
}

module.exports = router;
module.exports.matchKeywordRule = matchKeywordRule;
