import { describe, expect, it } from 'vitest';
import { skillSpan, splitSkillName } from './skills-bento';

describe('splitSkillName', () => {
  it('leaves a plain name untouched', () => {
    expect(splitSkillName('TypeScript')).toEqual({ name: 'TypeScript', detail: null });
  });

  it('promotes a parenthetical to its own line', () => {
    // One thought, two levels of detail: the name has to stay scannable.
    expect(splitSkillName('State Management(NgRx, Signal Store)')).toEqual({
      name: 'State Management',
      detail: 'NgRx, Signal Store',
    });
  });

  it('tolerates a space before the bracket', () => {
    expect(splitSkillName('State Management (NgRx)')).toEqual({
      name: 'State Management',
      detail: 'NgRx',
    });
  });

  it('keeps a version suffix in the name', () => {
    // "Angular v22" reads as one label; splitting it would invent a detail line
    // that the other versioned skills do not have.
    expect(splitSkillName('Angular v22')).toEqual({ name: 'Angular v22', detail: null });
  });

  it('does not split a bracket that is not at the end', () => {
    expect(splitSkillName('Testing (Unit) & E2E')).toEqual({ name: 'Testing (Unit) & E2E', detail: null });
  });

  it('never returns an empty detail', () => {
    expect(splitSkillName('Name()')).toEqual({ name: 'Name()', detail: null });
  });
});

describe('skillSpan', () => {
  it('fills three exact rows when there are nine tools', () => {
    const spans = Array.from({ length: 9 }, (_, index) => skillSpan(index, 9));

    expect(spans).toEqual([6, 3, 3, 4, 4, 4, 4, 4, 4]);
    expect(spans.reduce((sum, span) => sum + span, 0) % 12).toBe(0);
  });

  it('keeps any other count on the even grid', () => {
    expect(skillSpan(0, 8)).toBe(4);
    expect(skillSpan(2, 4)).toBe(4);
  });
});
