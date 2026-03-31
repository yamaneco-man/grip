const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// フォーム一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('forms')
      .select('*, form_questions(count), form_responses(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(f => ({
      ...f,
      question_count: f.form_questions?.[0]?.count || 0,
      response_count: f.form_responses?.[0]?.count || 0,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム作成
router.post('/', authenticate, async (req, res) => {
  const { title, description, questions, auto_tag_ids, thank_you_message } = req.body;
  if (!title) return res.status(400).json({ error: 'タイトルは必須です' });
  try {
    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .insert({ user_id: req.user.id, title, description, auto_tag_ids, thank_you_message })
      .select().single();
    if (error) throw error;

    if (questions?.length) {
      const qs = questions.map((q, i) => ({
        form_id: form.id,
        question_text: q.question_text,
        question_type: q.question_type || 'text',
        options: q.options || [],
        is_required: q.is_required || false,
        tag_mapping: q.tag_mapping || {},
        sort_order: i,
      }));
      await supabaseAdmin.from('form_questions').insert(qs);
    }
    res.status(201).json(form);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム詳細（質問付き）
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('forms')
      .select('*, form_questions(*)')
      .eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (error || !data) return res.status(404).json({ error: 'フォームが見つかりません' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム更新
router.put('/:id', authenticate, async (req, res) => {
  const { title, description, status, questions, auto_tag_ids, thank_you_message } = req.body;
  try {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (auto_tag_ids !== undefined) updates.auto_tag_ids = auto_tag_ids;
    if (thank_you_message !== undefined) updates.thank_you_message = thank_you_message;

    const { data, error } = await supabaseAdmin
      .from('forms').update(updates)
      .eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;

    if (questions) {
      await supabaseAdmin.from('form_questions').delete().eq('form_id', req.params.id);
      const qs = questions.map((q, i) => ({
        form_id: req.params.id,
        question_text: q.question_text,
        question_type: q.question_type || 'text',
        options: q.options || [],
        is_required: q.is_required || false,
        tag_mapping: q.tag_mapping || {},
        sort_order: i,
      }));
      if (qs.length) await supabaseAdmin.from('form_questions').insert(qs);
    }
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('forms').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム回答一覧
router.get('/:id/responses', authenticate, async (req, res) => {
  try {
    const { data: form } = await supabaseAdmin.from('forms').select('id').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!form) return res.status(404).json({ error: 'フォームが見つかりません' });

    const { data, error } = await supabaseAdmin
      .from('form_responses')
      .select('*, line_followers(display_name, follower_line_id)')
      .eq('form_id', req.params.id)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム回答送信（公開エンドポイント - 認証不要）
router.post('/:id/submit', async (req, res) => {
  const { answers, follower_id } = req.body;
  try {
    const { data: form } = await supabaseAdmin
      .from('forms').select('*, form_questions(*)').eq('id', req.params.id).eq('status', 'active').single();
    if (!form) return res.status(404).json({ error: 'フォームが見つかりません' });

    // 必須チェック
    for (const q of (form.form_questions || [])) {
      if (q.is_required && (!answers[q.id] || answers[q.id] === '')) {
        return res.status(400).json({ error: `「${q.question_text}」は必須です` });
      }
    }

    const { data: response, error } = await supabaseAdmin
      .from('form_responses')
      .insert({ form_id: form.id, follower_id, answers })
      .select().single();
    if (error) throw error;

    // 自動タグ付与
    if (follower_id && form.auto_tag_ids?.length) {
      for (const tagId of form.auto_tag_ids) {
        await supabaseAdmin.from('follower_tags')
          .insert({ follower_id, tag_id: tagId }).catch(() => {});
      }
    }

    // 回答内容に基づくタグマッピング
    if (follower_id) {
      for (const q of (form.form_questions || [])) {
        if (q.tag_mapping && typeof q.tag_mapping === 'object') {
          const answer = answers[q.id];
          const tagId = q.tag_mapping[answer];
          if (tagId) {
            await supabaseAdmin.from('follower_tags')
              .insert({ follower_id, tag_id: tagId }).catch(() => {});
          }
        }
      }
    }

    res.status(201).json({ success: true, message: form.thank_you_message });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
