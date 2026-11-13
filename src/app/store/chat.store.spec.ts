import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChatStore } from './chat.store';

describe('ChatStore', () => {
  let store: InstanceType<typeof ChatStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ChatStore] });
    store = TestBed.inject(ChatStore);
  });

  it('opens the panel and parks the question when asked from the page', () => {
    store.ask('Erzähl mir von deiner Angular-Erfahrung');

    expect(store.isOpen()).toBe(true);
    expect(store.pendingPrompt()).toBe('Erzähl mir von deiner Angular-Erfahrung');
  });

  it('hands the pending question over exactly once', () => {
    store.ask('Was hast du mit Next.js gebaut?');

    expect(store.consumePendingPrompt()).toBe('Was hast du mit Next.js gebaut?');
    expect(store.pendingPrompt()).toBeNull();
    expect(store.consumePendingPrompt()).toBeNull();
  });

  it('does not queue anything when the panel opens from the launcher', () => {
    store.openChat();

    expect(store.isOpen()).toBe(true);
    expect(store.pendingPrompt()).toBeNull();
  });
});
