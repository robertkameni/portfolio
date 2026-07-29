// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { detectSchedulingIntent, extractEmailFromMessage } from './intent-router';

describe('intent-router', () => {
  it('detects English scheduling keywords', () => {
    expect(detectSchedulingIntent('Can we schedule a call?')).toBe(true);
    expect(detectSchedulingIntent('Book a meeting with Robert')).toBe(true);
  });

  it('detects German scheduling keywords', () => {
    expect(detectSchedulingIntent('Erstelle mir einen Termin für einen Call')).toBe(true);
    expect(detectSchedulingIntent('Schick mir eine Einladung per Mail')).toBe(true);
    expect(detectSchedulingIntent('Können wir ein Gespräch vereinbaren?')).toBe(true);
  });

  it('does not flag unrelated messages', () => {
    expect(detectSchedulingIntent('Erzähl mir von deiner Angular-Erfahrung')).toBe(false);
  });

  it('extracts email addresses from messages', () => {
    expect(extractEmailFromMessage('email: lucastar18@gmx.de')).toBe('lucastar18@gmx.de');
    expect(extractEmailFromMessage('no email here')).toBeNull();
  });
});
