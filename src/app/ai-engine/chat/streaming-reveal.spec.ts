import { describe, expect, it } from 'vitest';
import { StreamingReveal } from './streaming-reveal';

/**
 * The reveal is driven by a frame clock, not by wall time, so the tests own
 * every tick. Each `advance` runs exactly one scheduled frame.
 */
function createReveal(options: Partial<ConstructorParameters<typeof StreamingReveal>[0]> = {}) {
  const frames: Array<() => void> = [];
  const updates: string[] = [];
  let time = 0;

  const reveal = new StreamingReveal({
    onUpdate: (text) => updates.push(text),
    now: () => time,
    scheduleFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelFrame: () => {
      frames.length = 0;
    },
    ...options,
  });

  const advance = (ms: number): void => {
    time += ms;
    const frame = frames.shift();
    frame?.();
  };

  return { reveal, advance, updates, pending: () => frames.length };
}

describe('StreamingReveal', () => {
  it('reveals at the steady rate while text is still arriving', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100 });

    reveal.setSource('a'.repeat(100));
    advance(100);
    expect(updates.at(-1)).toHaveLength(10);

    advance(100);
    expect(updates.at(-1)).toHaveLength(20);
  });

  it('speeds up when a burst lands, so it never lags behind the model', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100, maxCharsPerSecond: 300, maxLagMs: 1200 });

    reveal.setSource('a'.repeat(2000));
    advance(100);

    expect(updates.at(-1)).toHaveLength(30);
  });

  it('drains a wall of text within the finish window once the stream ends', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100, finishWithinMs: 300, longTail: 1000 });

    reveal.setSource('a'.repeat(4000));
    reveal.finish();
    advance(300);

    expect(updates.at(-1)).toHaveLength(4000);
  });

  it('still types out a burst that arrived in one chunk', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100, maxCharsPerSecond: 260, maxLagMs: 3000, longTail: 5000 });

    reveal.setSource('a'.repeat(800));
    reveal.finish();
    advance(100);

    expect(updates.at(-1)).toHaveLength(26);
  });

  it('does not rush a short answer when the stream ends', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100, finishWithinMs: 300 });

    reveal.setSource('a'.repeat(90));
    reveal.finish();
    advance(300);

    // The tail is the answer, so it keeps the reading pace instead of flashing.
    expect(updates.at(-1)).toHaveLength(30);
  });

  it('never reveals past the end of the source', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100 });

    reveal.setSource('abc');
    advance(1000);

    expect(updates.at(-1)).toBe('abc');
  });

  it('stops emitting once the source is fully visible', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100 });

    reveal.setSource('abc');
    advance(1000);
    const emitted = updates.length;
    advance(1000);

    expect(updates).toHaveLength(emitted);
    expect(reveal.isIdle()).toBe(true);
  });

  it('shows the whole answer at once when motion is reduced', () => {
    const { reveal, updates } = createReveal({ instant: true });

    reveal.setSource('the whole answer');

    expect(updates).toEqual(['the whole answer']);
  });

  it('keeps one frame loop when the source grows in place', () => {
    const { reveal, advance, updates, pending } = createReveal({ charsPerSecond: 100 });

    reveal.setSource('abc');
    reveal.setSource('abcdefghij');
    expect(pending()).toBe(1);

    advance(100);
    expect(updates.at(-1)).toHaveLength(10);
  });

  it('starts over when a new answer begins', () => {
    const { reveal, advance, updates } = createReveal({ charsPerSecond: 100 });

    reveal.setSource('first answer');
    advance(1000);
    reveal.reset();

    expect(reveal.text).toBe('');

    reveal.setSource('second answer');
    advance(100);
    expect(updates.at(-1)).toHaveLength(10);
  });
});
