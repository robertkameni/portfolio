import { Component, computed, inject, input } from '@angular/core';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { ChatStore } from '../../../store/chat.store';
import type { AppLocale } from '../../../shared/i18n/app-locale';
import { getSiteCopy } from '../../../shared/i18n/site-copy';

/**
 * The entry point to the twin, inside the page instead of behind a corner
 * button. Each row is a real question, so the visitor does not have to invent
 * their own or type anything to see what the chat can do.
 *
 * The room is not rendered from here: this only parks the question in the
 * store. The panel is a deferred block and may not exist yet, and the store
 * outlives both.
 */
@Component({
  selector: 'twin-invite',
  standalone: true,
  imports: [TrackBehaviorDirective],
  templateUrl: './twin-invite.html',
})
export class TwinInvite {
  private readonly chatStore = inject(ChatStore);

  locale = input<AppLocale>('en');

  protected readonly copy = computed(() => getSiteCopy(this.locale()));

  protected ask(prompt: string): void {
    this.chatStore.ask(prompt);
  }
}
