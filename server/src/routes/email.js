const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const emailSender = require('../services/email/sender');
const { generateEmailSequence, generateCampaignEmail } = require('../services/ai/aiExtended');
const { supabaseAdmin } = require('../config/supabase');

// ── メール設定 ──

router.get('/settings', authenticate, async (req, res) => {
  try {
    const config = await emailSender.getEmailConfig(req.user.id);
    if (config) { config.api_key_encrypted = '***'; config.smtp_pass_encrypted = '***'; }
    res.json(config || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', authenticate, async (req, res) => {
  try {
    const { provider, api_key_encrypted, from_email, from_name, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, is_verified } = req.body;
    const allowed = { user_id: req.user.id, provider, api_key_encrypted, from_email, from_name, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, is_verified };
    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .upsert(allowed, { onConflict: 'user_id' })
      .select().single();
    if (error) throw error;
    data.api_key_encrypted = '***'; data.smtp_pass_encrypted = '***';
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── 購読者 ──

router.get('/subscribers', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('email_subscribers')
      .select('*').eq('user_id', req.user.id).order('subscribed_at', { ascending: false });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/subscribers', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('email_subscribers')
      .insert({ user_id: req.user.id, email: req.body.email, name: req.body.name, follower_id: req.body.followerId })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/subscribers/:id', authenticate, async (req, res) => {
  try {
    const { email, name, status, tags } = req.body;
    const { data, error } = await supabaseAdmin.from('email_subscribers')
      .update({ email, name, status, tags }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── キャンペーン（一斉配信） ──

router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('email_campaigns')
      .select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/campaigns', authenticate, async (req, res) => {
  try {
    const { name, subject, body_html, body_text, segment_conditions, scheduled_at } = req.body;
    const { data, error } = await supabaseAdmin.from('email_campaigns')
      .insert({ user_id: req.user.id, name, subject, body_html, body_text, segment_conditions, scheduled_at }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/campaigns/:id', authenticate, async (req, res) => {
  try {
    const { name, subject, body_html, body_text, segment_conditions, scheduled_at } = req.body;
    const { data, error } = await supabaseAdmin.from('email_campaigns')
      .update({ name, subject, body_html, body_text, segment_conditions, scheduled_at }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/campaigns/:id/send', authenticate, async (req, res) => {
  try {
    const result = await emailSender.executeCampaign(req.user.id, req.params.id);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── ステップメール ──

router.get('/sequences', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('email_sequences')
      .select('*, email_sequence_steps(*)').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sequences', authenticate, async (req, res) => {
  try {
    const { steps, name, trigger_type, trigger_value, is_active } = req.body;
    const { data: seq, error } = await supabaseAdmin.from('email_sequences')
      .insert({ user_id: req.user.id, name, trigger_type, trigger_value, is_active }).select().single();
    if (error) throw error;

    if (steps && steps.length > 0) {
      const stepsData = steps.map((s, i) => ({ sequence_id: seq.id, step_order: i + 1, subject: s.subject, body_html: s.body_html, body_text: s.body_text, delay_days: s.delay_days, delay_hours: s.delay_hours, is_active: s.is_active }));
      await supabaseAdmin.from('email_sequence_steps').insert(stepsData);
    }

    const { data: full } = await supabaseAdmin.from('email_sequences')
      .select('*, email_sequence_steps(*)').eq('id', seq.id).single();
    res.status(201).json(full);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/sequences/:id', authenticate, async (req, res) => {
  try {
    const { steps, name, trigger_type, trigger_value, is_active } = req.body;
    const { data, error } = await supabaseAdmin.from('email_sequences')
      .update({ name, trigger_type, trigger_value, is_active }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;

    if (steps) {
      await supabaseAdmin.from('email_sequence_steps').delete().eq('sequence_id', req.params.id);
      const stepsData = steps.map((s, i) => ({ sequence_id: req.params.id, step_order: i + 1, subject: s.subject, body_html: s.body_html, body_text: s.body_text, delay_days: s.delay_days, delay_hours: s.delay_hours, is_active: s.is_active }));
      await supabaseAdmin.from('email_sequence_steps').insert(stepsData);
    }

    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/sequences/:id', authenticate, async (req, res) => {
  try {
    await supabaseAdmin.from('email_sequences').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── AI メール生成 ──

router.post('/ai/generate-sequence', authenticate, async (req, res) => {
  try {
    const steps = await generateEmailSequence(req.body, req.body.sequenceLength);
    res.json(steps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/ai/generate-campaign', authenticate, async (req, res) => {
  try {
    const email = await generateCampaignEmail(req.body.topic, req.body.tone, req.body.productInfo);
    res.json(email);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 配信ログ ──

router.get('/logs', authenticate, async (req, res) => {
  try {
    const { data } = await supabaseAdmin.from('email_send_logs')
      .select('*, email_subscribers(email, name)')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false })
      .limit(100);
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
