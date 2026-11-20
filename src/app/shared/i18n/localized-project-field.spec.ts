// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { localizedProjectField } from './localized-project-field';

describe('localizedProjectField', () => {
  it('returns EN when locale is en and EN is non-blank', () => {
    expect(localizedProjectField('Deutsch', 'English', 'en')).toBe('English');
  });

  it('falls back to DE when locale is en but EN is blank', () => {
    expect(localizedProjectField('Deutsch', '  ', 'en')).toBe('Deutsch');
    expect(localizedProjectField('Deutsch', null, 'en')).toBe('Deutsch');
  });

  it('returns DE when locale is de even if EN exists', () => {
    expect(localizedProjectField('Deutsch', 'English', 'de')).toBe('Deutsch');
  });

  it('returns null when both are empty', () => {
    expect(localizedProjectField(null, null, 'en')).toBeNull();
    expect(localizedProjectField('  ', '', 'de')).toBeNull();
  });
});
