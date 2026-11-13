import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TwinInvite } from './twin-invite';
import { ChatStore } from '../../../store/chat.store';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

const PROMPTS = getSiteCopy('en').twinInvite.prompts;

function render() {
  TestBed.configureTestingModule({
    imports: [TwinInvite],
    providers: [provideZonelessChangeDetection(), ChatStore],
  });

  const fixture = TestBed.createComponent(TwinInvite);
  fixture.detectChanges();

  return { fixture, chatStore: TestBed.inject(ChatStore) };
}

describe('TwinInvite', () => {
  it('offers one row per starter question', () => {
    const { fixture } = render();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.map((button) => button.textContent?.trim().replace(/\s*→$/, '').trim())).toEqual(PROMPTS);
  });

  it('parks the question and opens the panel when a row is pressed', () => {
    const { fixture, chatStore } = render();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    buttons[0]?.click();

    expect(chatStore.pendingPrompt()).toBe(PROMPTS[0]);
    expect(chatStore.isOpen()).toBe(true);
  });

  it('keeps the analytics contract for the section', () => {
    const { fixture } = render();

    expect(fixture.nativeElement.querySelector('section').getAttribute('trackBehavior')).toBe('twin_invite_viewed');
  });
});
