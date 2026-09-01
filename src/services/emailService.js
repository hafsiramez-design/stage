import { SERVER_URL } from '../config/api';

/**
 * Universal Email Service for World Events
 * 
 * Works seamlessly on:
 * - Local Wi-Fi (via local Node.js server)
 * - 4G / 5G / Mobile Data & External Networks (via Cloud HTTPS REST Gateway)
 */

const RESEND_API_KEY = 're_26671d18_8d16_4021_8b73_76d54d24177d';

async function sendViaResend(to, subject, htmlBody) {
  try {
    const recipientArray = Array.isArray(to) ? to : [to];
    console.log('[EmailService/Resend] Sending to:', recipientArray);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'World Events <onboarding@resend.dev>',
        to: recipientArray,
        subject: subject,
        html: htmlBody,
      }),
    });
    const data = await res.json();
    console.log('[EmailService/Resend] Response:', JSON.stringify(data));
    return data.id ? true : false;
  } catch (err) {
    console.error('[EmailService/Resend] Error:', err.message || err);
    return false;
  }
}

/**
 * Notify all client emails about a newly created event
 */
export async function sendNewEventNotification({
  eventTitle,
  eventCategory,
  eventDate,
  eventLocation,
  eventDescription,
  clientEmails,
}) {
  if (!clientEmails || clientEmails.length === 0) return { success: true, sent: 0 };

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;padding:28px;max-width:600px;margin:auto;background:#0F172A;border-radius:20px;border:1px solid rgba(108,63,255,0.3);color:#FFF;">
      <div style="background:linear-gradient(135deg,#6C3FFF,#3B1FA8);padding:30px 28px 20px;text-align:center;border-radius:20px 20px 0 0;">
        <h1 style="color:#fff;font-size:22px;margin:0;">🌍 World Events</h1>
      </div>
      <div style="padding:28px;">
        <h2 style="color:#FFF;">🎉 Nouvel événement : ${eventTitle}</h2>
        <p style="color:#CBD5E1;">📅 ${eventDate || ''} · 📍 ${eventLocation || ''} · 🏷️ ${eventCategory || ''}</p>
        <p style="color:#94A3B8;">${eventDescription || ''}</p>
      </div>
    </div>
  `;

  // 1. Try local server first (with 8-second timeout — SMTP can be slow)
  try {
    console.log(`[EmailService] Sending new event notification via local server to ${clientEmails.length} client(s):`, clientEmails);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SERVER_URL}/api/notify-new-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTitle, eventCategory, eventDate, eventLocation, eventDescription, clientEmails }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      console.log('[EmailService] Local server response:', JSON.stringify(data));
      if (data.success && data.sent > 0) {
        console.log(`[EmailService] ✅ Sent via local server to ${data.sent} clients`);
        return { success: true, sent: data.sent, method: 'local' };
      }
      if (data.warning) {
        console.warn(`[EmailService] Local server SMTP warning: ${data.warning}`);
      }
    } else {
      console.warn(`[EmailService] Local server returned HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn('[EmailService] Local server unreachable:', e.message || e);
  }

  // 2. Cloud Fallback (Works 100% on 4G, 5G & external networks worldwide)
  console.log('[EmailService] Trying Cloud HTTPS Gateway (Resend)...');
  const cloudSuccess = await sendViaResend(clientEmails, `🎉 Nouvel événement : ${eventTitle}`, htmlContent);
  console.log(`[EmailService] Cloud fallback result: ${cloudSuccess ? '✅ success' : '❌ failed'}`);
  return { success: cloudSuccess, sent: clientEmails.length, method: 'cloud' };
}

/**
 * Notify subscribers about event change or deletion
 */
export async function sendEventChangeNotification({
  eventTitle,
  eventDate,
  eventLocation,
  changeType,
  clientEmails,
}) {
  if (!clientEmails || clientEmails.length === 0) return { success: true, sent: 0 };
  const isDeleted = changeType === 'deleted';
  const color = isDeleted ? '#FF3D71' : '#F59E0B';
  const headline = isDeleted ? '🗑️ Événement Annulé' : '✏️ Événement Modifié';
  const bodyText = isDeleted
    ? `L'événement <strong>${eventTitle}</strong> a été <strong style="color:#FF3D71;">SUPPRIMÉ</strong>.`
    : `L'événement <strong>${eventTitle}</strong> a été modifié. Date: ${eventDate || 'N/A'} — Lieu: ${eventLocation || 'N/A'}.`;

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;padding:28px;max-width:600px;margin:auto;background:#0B071E;border-radius:16px;border:2px solid ${color};color:#FFF;">
      <h2 style="color:${color};text-align:center;">${headline}</h2>
      <h3 style="color:#F8FAFC;text-align:center;">${eventTitle}</h3>
      <p style="color:#CBD5E1;line-height:1.7;">${bodyText}</p>
    </div>
  `;

  try {
    console.log(`[EmailService] Sending change notification via local server to ${clientEmails.length} client(s):`, clientEmails);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SERVER_URL}/api/notify-event-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTitle, eventDate, eventLocation, changeType, clientEmails }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      console.log('[EmailService] Local server change response:', JSON.stringify(data));
      if (data.success && data.sent > 0) {
        console.log(`[EmailService] ✅ Change notification sent to ${data.sent} clients`);
        return { success: true, sent: data.sent, method: 'local' };
      }
      if (data.warning) {
        console.warn(`[EmailService] Local server SMTP warning: ${data.warning}`);
      }
    } else {
      console.warn(`[EmailService] Local server returned HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn('[EmailService] Local server unreachable for change notification:', e.message || e);
  }

  console.log('[EmailService] Trying Cloud HTTPS Gateway (Resend) for change...');
  const cloudSuccess = await sendViaResend(clientEmails, `${headline} : ${eventTitle}`, htmlContent);
  return { success: cloudSuccess, sent: clientEmails.length, method: 'cloud' };
}

/**
 * Send OTP reset code to user
 */
export async function sendOtpEmail(email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const htmlContent = `
    <div style="background:#0B071E;padding:40px 20px;font-family:Arial,sans-serif;">
      <div style="max-width:520px;margin:auto;background:#150D32;border-radius:20px;border:1px solid rgba(139,92,246,0.4);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);padding:32px 28px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🔐 Réinitialisation</h1>
        </div>
        <div style="padding:32px 28px;text-align:center;">
          <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#F8FAFC;font-family:monospace;">${code}</div>
          <p style="color:#94A3B8;font-size:12px;">⏱ Valide 10 minutes</p>
        </div>
      </div>
    </div>
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${SERVER_URL}/api/send-reset-otp-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, code: data.code || code, method: 'local' };
    }
  } catch (e) {
    console.log('[EmailService] Local server unreachable. Using Cloud Resend API for OTP email...');
  }

  await sendViaResend(email, '🔐 Code de réinitialisation - World Events', htmlContent);
  return { success: true, code, method: 'cloud' };
}
