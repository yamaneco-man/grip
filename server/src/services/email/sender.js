const { supabaseAdmin } = require('../../config/supabase');
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').substring(0, 64);

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * メール配信サービス
 * SendGrid / AWS SES / SMTP対応のメール送信エンジン
 */

// メール送信設定を取得
async function getEmailConfig(userId) {
  const { data } = await supabaseAdmin
    .from('email_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

// メール送信（プロバイダ別ディスパッチ）
async function sendEmail(userId, to, subject, htmlBody, textBody) {
  const config = await getEmailConfig(userId);
  if (!config) throw new Error('メール配信設定がされていません');

  let result;
  switch (config.provider) {
    case 'sendgrid':
      result = await sendViaSendGrid(config, to, subject, htmlBody, textBody);
      break;
    case 'ses':
      result = await sendViaSES(config, to, subject, htmlBody, textBody);
      break;
    case 'smtp':
      result = await sendViaSMTP(config, to, subject, htmlBody, textBody);
      break;
    default:
      throw new Error(`未対応のメールプロバイダ: ${config.provider}`);
  }

  return result;
}

// SendGrid送信
async function sendViaSendGrid(config, to, subject, htmlBody, textBody) {
  // @sendgrid/mail を動的インポート（インストール済みの場合のみ）
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(decrypt(config.api_key_encrypted));
    const msg = {
      to,
      from: { email: config.from_email, name: config.from_name },
      subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
      trackingSettings: {
        openTracking: { enable: true },
        clickTracking: { enable: true },
      },
    };
    const [response] = await sgMail.send(msg);
    return { provider: 'sendgrid', statusCode: response.statusCode, messageId: response.headers?.['x-message-id'] };
  } catch (e) {
    // SendGridが未インストールの場合はHTTP APIフォールバック
    return await sendViaSendGridHTTP(config, to, subject, htmlBody, textBody);
  }
}

// SendGrid HTTP APIフォールバック
async function sendViaSendGridHTTP(config, to, subject, htmlBody, textBody) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${decrypt(config.api_key_encrypted)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.from_email, name: config.from_name },
      subject,
      content: [
        { type: 'text/plain', value: textBody || htmlBody.replace(/<[^>]*>/g, '') },
        { type: 'text/html', value: htmlBody },
      ],
      tracking_settings: {
        open_tracking: { enable: true },
        click_tracking: { enable: true },
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`SendGrid送信エラー: ${response.status} ${errBody}`);
  }

  return { provider: 'sendgrid', statusCode: response.status };
}

// AWS SES送信
async function sendViaSES(config, to, subject, htmlBody, textBody) {
  // SES HTTP API v2経由
  const region = config.smtp_host || 'ap-northeast-1';
  const endpoint = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
    },
    body: JSON.stringify({
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
            Text: { Data: textBody || htmlBody.replace(/<[^>]*>/g, '') },
          },
        },
      },
      Destination: { ToAddresses: [to] },
      FromEmailAddress: `${config.from_name} <${config.from_email}>`,
    }),
  });

  return { provider: 'ses', statusCode: response.status };
}

// SMTP送信
async function sendViaSMTP(config, to, subject, htmlBody, textBody) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: config.smtp_port === 465,
    auth: { user: config.smtp_user, pass: decrypt(config.smtp_pass_encrypted) },
  });

  const info = await transporter.sendMail({
    from: `${config.from_name} <${config.from_email}>`,
    to,
    subject,
    html: htmlBody,
    text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
  });

  return { provider: 'smtp', messageId: info.messageId };
}

// 一斉配信（キャンペーン）実行
async function executeCampaign(userId, campaignId) {
  const { data: campaign } = await supabaseAdmin
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();

  if (!campaign) throw new Error('キャンペーンが見つかりません');
  if (campaign.status === 'sent') throw new Error('このキャンペーンは既に送信済みです');

  // ステータスを送信中に更新
  await supabaseAdmin.from('email_campaigns').update({ status: 'sending' }).eq('id', campaignId);

  // 対象購読者を取得（セグメント条件があれば適用）
  let query = supabaseAdmin.from('email_subscribers').select('*').eq('user_id', userId).eq('status', 'active');
  // セグメント条件のフィルタリングはJSONB条件で実装
  const { data: subscribers } = await query;

  let sentCount = 0;
  let bouncedCount = 0;

  for (const sub of (subscribers || [])) {
    try {
      await sendEmail(userId, sub.email, campaign.subject, campaign.body_html, campaign.body_text);

      await supabaseAdmin.from('email_send_logs').insert({
        user_id: userId,
        subscriber_id: sub.id,
        campaign_id: campaignId,
        subject: campaign.subject,
        status: 'sent',
      });
      sentCount++;
    } catch (e) {
      await supabaseAdmin.from('email_send_logs').insert({
        user_id: userId,
        subscriber_id: sub.id,
        campaign_id: campaignId,
        subject: campaign.subject,
        status: 'failed',
      });
      bouncedCount++;
    }

    // レート制限: 100ms間隔で送信（1秒10通）
    await new Promise(r => setTimeout(r, 100));
  }

  // キャンペーン結果を更新
  await supabaseAdmin.from('email_campaigns').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    total_sent: sentCount,
    total_bounced: bouncedCount,
  }).eq('id', campaignId);

  return { sent: sentCount, bounced: bouncedCount };
}

// ステップメール配信実行（スケジューラーから呼ばれる）
async function executeSequenceStep(userId) {
  const { data: sequences } = await supabaseAdmin
    .from('email_sequences')
    .select('*, email_sequence_steps(*)')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!sequences) return { processed: 0 };

  let processed = 0;

  for (const seq of sequences) {
    const steps = (seq.email_sequence_steps || []).sort((a, b) => a.step_order - b.step_order);

    // 各購読者の進捗を確認して次のステップを送信
    const { data: subscribers } = await supabaseAdmin
      .from('email_subscribers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    for (const sub of (subscribers || [])) {
      // 最後に送ったステップを取得
      const { data: lastLog } = await supabaseAdmin
        .from('email_send_logs')
        .select('step_id, sent_at')
        .eq('subscriber_id', sub.id)
        .eq('sequence_id', seq.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      let nextStep;
      if (!lastLog) {
        // 初回: ステップ1を送信
        nextStep = steps[0];
      } else {
        // 次のステップを特定
        const lastStepIndex = steps.findIndex(s => s.id === lastLog.step_id);
        if (lastStepIndex < 0 || lastStepIndex >= steps.length - 1) continue;
        nextStep = steps[lastStepIndex + 1];

        // 遅延時間チェック
        const lastSentAt = new Date(lastLog.sent_at);
        const delayMs = (nextStep.delay_days * 86400000) + (nextStep.delay_hours * 3600000);
        if (Date.now() - lastSentAt.getTime() < delayMs) continue;
      }

      if (!nextStep || !nextStep.is_active) continue;

      try {
        await sendEmail(userId, sub.email, nextStep.subject, nextStep.body_html, nextStep.body_text);
        await supabaseAdmin.from('email_send_logs').insert({
          user_id: userId,
          subscriber_id: sub.id,
          sequence_id: seq.id,
          step_id: nextStep.id,
          subject: nextStep.subject,
          status: 'sent',
        });
        processed++;
      } catch (e) {
        console.error(`ステップメール送信エラー: ${sub.email}`, e.message);
      }

      await new Promise(r => setTimeout(r, 100));
    }
  }

  return { processed };
}

module.exports = {
  getEmailConfig,
  sendEmail,
  executeCampaign,
  executeSequenceStep,
  encrypt,
};
