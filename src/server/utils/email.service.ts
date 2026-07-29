import { Resend } from 'resend';
import { getResendConfig } from './env.util';

export type ContactNotificationInput = {
  senderName: string | null;
  senderEmail: string;
  body: string;
};

/**
 * Lazily-initialised Resend client.
 * Returns null when Resend is not configured (graceful degradation).
 */
let resendClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (resendClient !== undefined) {
    return resendClient;
  }
  const config = getResendConfig();
  if (!config) {
    resendClient = null;
    return null;
  }
  resendClient = new Resend(config.apiKey);
  return resendClient;
}

/** Visible for tests. */
export function resetResendClientForTests(): void {
  resendClient = undefined;
}

function buildConfirmationHtml(input: ContactNotificationInput): string {
  const name = input.senderName?.trim() || input.senderEmail.split('@')[0] || 'there';
  return [
    '<!DOCTYPE html>',
    '<html><body style="font-family: sans-serif; padding: 2rem; max-width: 600px;">',
    `<h2>Hi ${escapeHtml(name)},</h2>`,
    '<p>Thank you for reaching out through my portfolio.</p>',
    '<p>I have received your message and will get back to you soon.</p>',
    '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;" />',
    '<p style="color: #6b7280; font-size: 0.875rem;">',
    'This is an automated confirmation. Please do not reply directly to this email.',
    '</p>',
    '</body></html>',
  ].join('\n');
}

function buildNotificationHtml(input: ContactNotificationInput): string {
  const displayName = input.senderName?.trim() || input.senderEmail;
  const shortBody = input.body.length > 500 ? input.body.slice(0, 497) + '...' : input.body;
  return [
    '<!DOCTYPE html>',
    '<html><body style="font-family: sans-serif; padding: 2rem; max-width: 600px;">',
    '<h2>New Contact Form Message</h2>',
    '<table style="width: 100%; border-collapse: collapse;">',
    `<tr><td style="padding: 0.5rem; color: #6b7280; width: 100px;">From</td><td style="padding: 0.5rem;"><strong>${escapeHtml(displayName)}</strong></td></tr>`,
    `<tr><td style="padding: 0.5rem; color: #6b7280;">Email</td><td style="padding: 0.5rem;"><a href="mailto:${escapeHtml(input.senderEmail)}">${escapeHtml(input.senderEmail)}</a></td></tr>`,
    '</table>',
    '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;" />',
    `<p style="white-space: pre-wrap;">${escapeHtml(shortBody)}</p>`,
    '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;" />',
    `<p style="color: #9ca3af; font-size: 0.75rem;">Reply to: <a href="mailto:${escapeHtml(input.senderEmail)}">${escapeHtml(input.senderEmail)}</a></p>`,
    '</body></html>',
  ].join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Resend test senders (onboarding@resend.dev) only accept your own email as recipient. */
function isTestMode(fromEmail: string): boolean {
  return fromEmail.endsWith('@resend.dev');
}

/**  
 * Send email notifications when someone submits the contact form.  
 *  
 * Emails are sent individually so a failure of one never blocks the other.  
 * In Resend test mode (onboarding@resend.dev) the confirmation to the  
 * submitter will fail — only the notification to the site owner works.  
 *  
 * Fails silently (logs to console) so a failed email never blocks the form response.  
 */
export async function sendContactNotification(input: ContactNotificationInput): Promise<void> {
  const client = getResendClient();
  if (!client) {
    return;
  }

  const config = getResendConfig();
  if (!config) {
    return;
  }

  const displayName = input.senderName?.trim() || input.senderEmail;

  // 1) Notification to the site owner (always works — goes to your own mailbox)  
  try {
    const { error } = await client.emails.send({
      from: `"Portfolio Contact" <${config.fromEmail}>`,
      to: config.notificationEmail,
      subject: `New contact form message from ${displayName}`,
      html: buildNotificationHtml(input),
      replyTo: input.senderEmail,
      tags: [{ name: 'source', value: 'contact_form' }, { name: 'type', value: 'notification' }],
    });
    if (error) {
      console.error('[Email] Notification failed:', error.message);
    }
  } catch (error) {
    console.error('[Email] Notification error:', error instanceof Error ? error.message : String(error));
  }

  // 2) Confirmation to the submitter (may fail in test mode — non-critical)  
  try {
    const { error } = await client.emails.send({
      from: `"Portfolio Contact" <${config.fromEmail}>`,
      to: input.senderEmail,
      subject: 'Thank you for your message — Robert Kameni',
      html: buildConfirmationHtml(input),
      tags: [{ name: 'source', value: 'contact_form' }, { name: 'type', value: 'confirmation' }],
    });
    if (error) {
      if (isTestMode(config.fromEmail) && error.name === 'validation_error') {
        console.warn('[Email] Confirmation skipped — Resend test mode only sends to your own address. Configure a verified domain for confirmations.');
      } else {
        console.error('[Email] Confirmation failed:', error.message);
      }
    }
  } catch (error) {
    // Non-critical — silently ignore  
  }
}
