/**
 * Turns a fast token stream into a readable reveal.
 *
 * The model returns whole sentences per chunk, and a small panel that repaints
 * at model speed reads as a flash rather than as speech. This holds a visible
 * prefix of the answer and advances it on a frame clock.
 *
 * The pace follows the backlog, not a fixed number: with a short answer the
 * reveal runs at reading speed, and with a long one it speeds up so the visible
 * text never trails the model by more than a sentence. A short tail is never
 * drained early, because that is what made the reply feel like a flash.
 *
 * Pure apart from the injected clock and scheduler, so the tests can tick it
 * by hand.
 */
export type StreamingRevealOptions = {
  onUpdate: (visibleText: string) => void;
  /** Comfortable reading pace for a chat bubble. */
  charsPerSecond?: number;
  /** Ceiling for a fast stream, so a burst still reads as typing. */
  maxCharsPerSecond?: number;
  /** How far the visible text may trail the stream. */
  maxLagMs?: number;
  /** Tail long enough that finishing it at reading pace would be tedious. */
  longTail?: number;
  /** Window in which that tail is finished after the stream ends. */
  finishWithinMs?: number;
  /** Reduced motion: no reveal, the full text lands at once. */
  instant?: boolean;
  now?: () => number;
  scheduleFrame?: (callback: () => void) => number;
  cancelFrame?: (handle: number) => void;
};

const DEFAULT_CHARS_PER_SECOND = 70;
const DEFAULT_MAX_CHARS_PER_SECOND = 260;
const DEFAULT_MAX_LAG_MS = 3000;
const DEFAULT_LONG_TAIL = 3000;
const DEFAULT_FINISH_WITHIN_MS = 800;

export class StreamingReveal {
  private source = '';
  private visible = 0;
  private finishing = false;
  private frame: number | null = null;
  private lastTick = 0;

  private readonly charsPerSecond: number;
  private readonly maxCharsPerSecond: number;
  private readonly maxLagMs: number;
  private readonly longTail: number;
  private readonly finishWithinMs: number;
  private readonly instant: boolean;
  private readonly now: () => number;
  private readonly scheduleFrame: (callback: () => void) => number;
  private readonly cancelFrame: (handle: number) => void;
  private readonly onUpdate: (visibleText: string) => void;

  constructor(options: StreamingRevealOptions) {
    this.onUpdate = options.onUpdate;
    this.charsPerSecond = options.charsPerSecond ?? DEFAULT_CHARS_PER_SECOND;
    this.maxCharsPerSecond = options.maxCharsPerSecond ?? DEFAULT_MAX_CHARS_PER_SECOND;
    this.maxLagMs = options.maxLagMs ?? DEFAULT_MAX_LAG_MS;
    this.longTail = options.longTail ?? DEFAULT_LONG_TAIL;
    this.finishWithinMs = options.finishWithinMs ?? DEFAULT_FINISH_WITHIN_MS;
    this.instant = options.instant ?? false;
    this.now = options.now ?? (() => performance.now());
    this.scheduleFrame = options.scheduleFrame ?? ((callback) => requestAnimationFrame(() => callback()));
    this.cancelFrame = options.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));
  }

  get text(): string {
    return this.source.slice(0, this.visible);
  }

  isIdle(): boolean {
    return this.visible >= this.source.length;
  }

  /** The full answer so far, as the stream has delivered it. */
  setSource(full: string): void {
    if (full === this.source) {
      return;
    }

    // A source that no longer starts with what is already visible is a new
    // answer, not a longer one.
    if (!full.startsWith(this.source.slice(0, this.visible))) {
      this.visible = 0;
    }

    this.source = full;

    if (this.instant) {
      this.visible = full.length;
      this.onUpdate(this.text);
      return;
    }

    this.start();
  }

  /** No more tokens are coming. Only a long tail is finished early. */
  finish(): void {
    this.finishing = true;
    this.start();
  }

  reset(): void {
    this.stop();
    this.source = '';
    this.visible = 0;
    this.finishing = false;
    this.onUpdate('');
  }

  dispose(): void {
    this.stop();
  }

  private start(): void {
    if (this.frame !== null || this.isIdle()) {
      return;
    }

    this.lastTick = this.now();
    this.frame = this.scheduleFrame(() => this.tick());
  }

  private stop(): void {
    if (this.frame === null) {
      return;
    }

    this.cancelFrame(this.frame);
    this.frame = null;
  }

  private tick(): void {
    this.frame = null;

    const now = this.now();
    const elapsed = Math.max(0, now - this.lastTick);
    this.lastTick = now;

    const remaining = this.source.length - this.visible;
    if (remaining <= 0) {
      return;
    }

    const step = Math.max(1, Math.round((elapsed * this.rateFor(remaining)) / 1000));
    this.visible = Math.min(this.source.length, this.visible + step);
    this.onUpdate(this.text);

    this.start();
  }

  private rateFor(remaining: number): number {
    // The long tail rule is a safety valve for a wall of text, not a way to
    // skip the reveal: a burst that arrived in one chunk still types itself
    // out, at the faster catch-up pace.
    if (this.finishing && remaining > this.longTail) {
      return Math.max(this.charsPerSecond, (remaining / this.finishWithinMs) * 1000);
    }

    const catchUp = (remaining / this.maxLagMs) * 1000;
    return Math.min(this.maxCharsPerSecond, Math.max(this.charsPerSecond, catchUp));
  }
}
