const SCHEDULING_KEYWORDS = [
  'termin',
  'call',
  'meeting',
  'gespräch',
  'gespraech',
  'einladung',
  'anruf',
  'vereinbaren',
  'schedule',
  'book',
  'calendar',
  'e-mail adresse',
  'mail senden',
  'mail schicken',
  'kalender',
  'intro call',
  'video call',
  'zoom',
  'google meet',
  'teams',
] as const;

const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;

export function detectSchedulingIntent(message: string): boolean {
  const text = message.toLowerCase();
  return SCHEDULING_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function extractEmailFromMessage(message: string): string | null {
  const match = message.match(EMAIL_PATTERN);
  return match?.[0]?.toLowerCase() ?? null;
}
