import { describe, expect, it } from 'vitest';
import { stackFamilies } from './project-stack';

describe('stackFamilies', () => {
  it('recognises Angular whatever version suffix the tag carries', () => {
    expect(stackFamilies(['Angular'])).toEqual(['angular']);
    expect(stackFamilies(['Angular 22'])).toEqual(['angular']);
    expect(stackFamilies(['Angular 15', 'RxJS'])).toEqual(['angular']);
  });

  it('recognises Next.js and React as the same family', () => {
    expect(stackFamilies(['Next.js 16'])).toEqual(['react']);
    expect(stackFamilies(['React 19'])).toEqual(['react']);
  });

  it('does not treat a tag that merely starts with the name as part of the family', () => {
    // "Angularly" and "Reactive" must not match; the regex is word-bounded.
    expect(stackFamilies(['Angularly'])).toEqual([]);
    expect(stackFamilies(['Reactive Extensions'])).toEqual([]);
  });

  it('returns both families when a project spans stacks', () => {
    expect(stackFamilies(['Angular 22', 'Next.js 16'])).toEqual(['angular', 'react']);
  });

  it('returns an empty list for unrelated or empty tags', () => {
    expect(stackFamilies(['NestJS', 'DeepSeek'])).toEqual([]);
    expect(stackFamilies([])).toEqual([]);
  });

  it('is insensitive to surrounding whitespace', () => {
    expect(stackFamilies(['  Angular 22  '])).toEqual(['angular']);
  });
});
