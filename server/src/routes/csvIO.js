const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// === エクスポート ===

// 友だちCSVエクスポート
router.get('/export/followers', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('line_followers')
      .select('display_name, follower_line_id, source_channel, registered_at, is_blocked, step_day, last_replied_at')
      .eq('user_id', req.user.id)
      .order('registered_at', { ascending: false });

    const header = '表示名,LINE ID,流入経路,登録日,ブロック,ステップ日数,最終返信日\n';
    const csv = (data || []).map(r =>
      `"${r.display_name || ''}","${r.follower_line_id}","${r.source_channel || ''}","${r.registered_at}","${r.is_blocked}","${r.step_day}","${r.last_replied_at || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=followers_${new Date().toISOString().slice(0,10)}.csv`);
    res.send('\uFEFF' + header + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// メッセージ履歴エクスポート
router.get('/export/messages', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('messages')
      .select('follower_id, direction, content, emotion_score, created_at, line_followers!inner(display_name)')
      .eq('line_followers.user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10000);

    const header = '友達名,方向,内容,感情スコア,日時\n';
    const csv = (data || []).map(r =>
      `"${r.line_followers?.display_name || ''}","${r.direction}","${(r.content || '').replace(/"/g, '""')}","${r.emotion_score || ''}","${r.created_at}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=messages_${new Date().toISOString().slice(0,10)}.csv`);
    res.send('\uFEFF' + header + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// フォーム回答エクスポート
router.get('/export/form-responses/:formId', authenticate, async (req, res) => {
  try {
    const { data: form } = await supabaseAdmin.from('forms').select('title, form_questions(*)').eq('id', req.params.formId).eq('user_id', req.user.id).single();
    if (!form) return res.status(404).json({ error: 'フォームが見つかりません' });

    const { data: responses } = await supabaseAdmin
      .from('form_responses')
      .select('*, line_followers(display_name)')
      .eq('form_id', req.params.formId)
      .order('submitted_at', { ascending: false });

    const questions = (form.form_questions || []).sort((a, b) => a.sort_order - b.sort_order);
    const header = '回答者,' + questions.map(q => `"${q.question_text}"`).join(',') + ',回答日時\n';
    const csv = (responses || []).map(r => {
      const name = r.line_followers?.display_name || '匿名';
      const answers = questions.map(q => `"${(r.answers[q.id] || '').toString().replace(/"/g, '""')}"`).join(',');
      return `"${name}",${answers},"${r.submitted_at}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=form_${req.params.formId.slice(0,8)}_${new Date().toISOString().slice(0,10)}.csv`);
    res.send('\uFEFF' + header + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 分析データエクスポート
router.get('/export/analytics', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('churn_scores')
      .select('score, alerted, calculated_at, line_followers!inner(display_name, follower_line_id)')
      .eq('line_followers.user_id', req.user.id)
      .order('calculated_at', { ascending: false })
      .limit(5000);

    const header = '友達名,LINE ID,離脱スコア,アラート,計算日時\n';
    const csv = (data || []).map(r =>
      `"${r.line_followers?.display_name || ''}","${r.line_followers?.follower_line_id || ''}","${r.score}","${r.alerted}","${r.calculated_at}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=analytics_${new Date().toISOString().slice(0,10)}.csv`);
    res.send('\uFEFF' + header + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// === インポート ===

// CSVインポート（友だち）
router.post('/import/followers', authenticate, async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'CSVデータが必要です' });
  if (rows.length > 10000) return res.status(400).json({ error: '一度にインポートできるのは10,000行までです' });

  try {
    const { data: job } = await supabaseAdmin
      .from('import_jobs')
      .insert({ user_id: req.user.id, job_type: 'followers', total_rows: rows.length, status: 'processing' })
      .select().single();

    let processed = 0, errorRows = 0;
    const errors = [];

    for (const row of rows) {
      try {
        if (!row.display_name) { errorRows++; errors.push({ row: processed + 1, error: '表示名が必要です' }); continue; }
        await supabaseAdmin.from('line_followers').upsert({
          user_id: req.user.id,
          display_name: row.display_name,
          follower_line_id: row.line_id || `imported_${Date.now()}_${processed}`,
          source_channel: row.source_channel || 'csv_import',
          registered_at: row.registered_at || new Date().toISOString(),
          is_blocked: false, step_day: 0,
        }, { onConflict: 'user_id,follower_line_id' });
        processed++;
      } catch (e) {
        errorRows++;
        errors.push({ row: processed + errorRows, error: e.message });
      }
    }

    await supabaseAdmin.from('import_jobs').update({
      status: 'completed', processed_rows: processed, error_rows: errorRows, errors, completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    res.json({ job_id: job.id, processed, errors: errorRows, total: rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// インポートジョブ一覧
router.get('/import/jobs', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('import_jobs').select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
