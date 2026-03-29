const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// シナリオテンプレート一覧（公開テンプレート + 自分のテンプレート）
router.get('/', authenticate, async (req, res) => {
  try {
    // 公開テンプレートと自分のテンプレートを別クエリで取得してマージ（SQLインジェクション防止）
    const { data: publicData } = await supabaseAdmin
      .from('scenario_templates')
      .select('*')
      .eq('is_public', true)
      .order('download_count', { ascending: false });
    const { data: myData } = await supabaseAdmin
      .from('scenario_templates')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_public', false)
      .order('download_count', { ascending: false });
    // マージして重複排除
    const seen = new Set();
    const data = [...(publicData || []), ...(myData || [])].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 自分のシナリオをテンプレートとしてエクスポート
router.post('/export', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('scenario_templates')
      .insert({
        user_id: req.user.id,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category || 'general',
        template_data: req.body.templateData,
        is_public: req.body.isPublic || false,
      })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// テンプレートをインポート（自分のアカウントに適用）
router.post('/:id/import', authenticate, async (req, res) => {
  try {
    const { data: template } = await supabaseAdmin
      .from('scenario_templates')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (!template) return res.status(404).json({ error: 'テンプレートが見つかりません' });
    // 非公開テンプレートは所有者のみアクセス可
    if (!template.is_public && template.user_id !== req.user.id) {
      return res.status(403).json({ error: 'このテンプレートへのアクセス権がありません' });
    }

    // ダウンロードカウント更新
    await supabaseAdmin.from('scenario_templates')
      .update({ download_count: (template.download_count || 0) + 1 })
      .eq('id', req.params.id);

    // テンプレートデータを返す（クライアント側で適用処理）
    res.json({ templateData: template.template_data, name: template.name });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// テンプレート更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, category, template_data, is_public } = req.body;
    const { data, error } = await supabaseAdmin.from('scenario_templates')
      .update({ name, description, category, template_data, is_public }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// テンプレート削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('scenario_templates')
      .delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// BAN検知ログ
router.get('/ban-logs', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('ban_detection_logs')
      .select('*').eq('user_id', req.user.id).order('detected_at', { ascending: false });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
