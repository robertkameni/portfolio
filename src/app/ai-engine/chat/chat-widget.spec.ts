import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatWidget } from './chat-widget';
import { ChatStore } from '../../store/chat.store';
import { RealtimeService } from '../../services/realtime.service';

const sendChatMessage = vi.fn();

function render() {
  TestBed.configureTestingModule({
    imports: [ChatWidget],
    providers: [provideZonelessChangeDetection(), ChatStore, { provide: RealtimeService, useValue: { sendChatMessage } }],
  });

  const fixture = TestBed.createComponent(ChatWidget);
  fixture.detectChanges();

  return { fixture, chatStore: TestBed.inject(ChatStore) };
}

describe('ChatWidget handover from the page', () => {
  beforeEach(() => {
    sendChatMessage.mockClear();
  });

  it('sends a parked question once, then clears it', async () => {
    const { fixture, chatStore } = render();

    chatStore.ask('Was hast du mit Next.js gebaut?');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(chatStore.pendingPrompt()).toBeNull();
    expect(chatStore.messages()).toEqual([{ role: 'user', content: 'Was hast du mit Next.js gebaut?' }]);
    expect(sendChatMessage).toHaveBeenCalledTimes(1);
    expect(sendChatMessage).toHaveBeenCalledWith('Was hast du mit Next.js gebaut?');

    fixture.detectChanges();
    await fixture.whenStable();

    // A re-render must not turn one question into two.
    expect(sendChatMessage).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when the panel is opened without a question', async () => {
    const { fixture, chatStore } = render();

    chatStore.openChat();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(sendChatMessage).not.toHaveBeenCalled();
    expect(chatStore.messages()).toEqual([]);
  });

  it('holds a parked question until the current answer is done', async () => {
    const { fixture, chatStore } = render();

    chatStore.addUserMessage('first question');
    chatStore.ask('second question');
    fixture.detectChanges();
    await fixture.whenStable();

    // The parking slot survives, so the tap is not silently lost.
    expect(chatStore.pendingPrompt()).toBe('second question');
    expect(sendChatMessage).not.toHaveBeenCalled();

    chatStore.setTyping(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(chatStore.pendingPrompt()).toBeNull();
    expect(sendChatMessage).toHaveBeenCalledTimes(1);
    expect(sendChatMessage).toHaveBeenCalledWith('second question');
  });

  it('keeps the draft when it is submitted mid-answer', async () => {
    const { fixture, chatStore } = render();
    const widget = fixture.componentInstance;

    chatStore.addUserMessage('a question');
    widget.newMessage.set('my next question');
    fixture.detectChanges();

    widget.sendMessage();

    expect(widget.newMessage()).toBe('my next question');
    expect(sendChatMessage).not.toHaveBeenCalled();
  });
});
