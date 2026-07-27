/**
 * Security & observability utilities for chat stream endpoint.
 */

import { randomUUID } from 'crypto';

type ChatHistoryItem = {
  role?: unknown;
  parts?: { text?: unknown }[];
};

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 20; // max message pairs
const MAX_HISTORY_ITEM_LENGTH = 1500;
const PHONE_CANDIDATE_PATTERN = /(?<![\w@])\+?\d[\d\s().-]{6,}\d(?![\w@])/g;

function redactPhoneLikeValues(text: string): string {
  return text.replace(PHONE_CANDIDATE_PATTERN, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    const hasPhoneFormatting = match.startsWith('+') || /[\s().-]/.test(match);

    if (digitsOnly.length < 8 || digitsOnly.length > 15 || !hasPhoneFormatting) {
      return match;
    }

    return '[PHONE]';
  });
}

export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Redact sensitive data from user messages before logging.
 * Removes emails, phone numbers, and personal identifiers.
 */
export function redactSensitiveData(text: string): string {
  const withoutEmails = text
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]') // emails
    .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN]') // SSN-like
    .replace(/\b\d{13,19}\b/g, '[CARD]'); // card number-like

  return redactPhoneLikeValues(withoutEmails);
}

/**
 * Validate and sanitize chat input.
 */
export function validateChatInput(message: string, history: ChatHistoryItem[]): { valid: boolean; error?: string } {
  if (!message) {
    return { valid: false, error: 'Message is required' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` };
  }

  if (!Array.isArray(history)) {
    return { valid: false, error: 'History must be an array' };
  }

  if (history.length > MAX_HISTORY_LENGTH) {
    return { valid: false, error: `History exceeds ${MAX_HISTORY_LENGTH} messages` };
  }

  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `History item ${i} is invalid` };
    }
    if (typeof item.role !== 'string' || !['user', 'model'].includes(item.role)) {
      return { valid: false, error: `History item ${i} has invalid role` };
    }
    if (!Array.isArray(item.parts) || item.parts.length === 0) {
      return { valid: false, error: `History item ${i} has invalid parts` };
    }
    for (let j = 0; j < item.parts.length; j++) {
      const part = item.parts[j];
      if (!part || typeof part.text !== 'string' || part.text.length > MAX_HISTORY_ITEM_LENGTH) {
        return { valid: false, error: `History item ${i}, part ${j} exceeds length limit` };
      }
    }
  }

  return { valid: true };
}

/**
 * Log chat interaction with request ID, redacted message, and no sensitive data in logs.
 */
export function logChatInteraction(requestId: string, sessionId: string | undefined, message: string, status: 'started' | 'completed' | 'error', error?: Error): void {
  const redacted = redactSensitiveData(message);
  const msgPreview = redacted.substring(0, 100);

  if (status === 'error') {
    console.error(`[chat-stream] requestId=${requestId} sessionId=${sessionId} status=error message="${msgPreview}" error=${error?.message}`);
  } else {
    console.log(`[chat-stream] requestId=${requestId} sessionId=${sessionId} status=${status} message="${msgPreview}"`);
  }
}
