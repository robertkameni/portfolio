import { afterRenderEffect, Component, computed, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { ChatStore } from '../../store/chat.store';
import { RealtimeService } from '../../services/realtime.service';
import { SafeHtmlDirective } from '../../shared/directives/safe-html.directive';
import { getSiteCopy } from '../../shared/i18n/site-copy';
import { LocaleService } from '../../shared/services/locale.service';

@Component({
  selector: 'chat-widget',
  standalone: true,
  imports: [SafeHtmlDirective],
  templateUrl: './chat-widget.html',
})
export class ChatWidget {
  public chatStore = inject(ChatStore);
  public realtimeService = inject(RealtimeService);
  private readonly localeService = inject(LocaleService);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));

  messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private readonly composer = viewChild<ElementRef<HTMLInputElement>>('composer');
  private readonly launcher = viewChild<ElementRef<HTMLButtonElement>>('launcher');

  newMessage = signal('');
  private markdownParser: ((content: string) => string) | null = null;
  private markdownParserLoading = false;
  private markdownReady = signal(false);

  /* Text for the polite live region. Announced when a reply finishes, not while
     it streams: a token-by-token announcement is unusable noise. */
  protected readonly liveAnnouncement = signal('');

  private wasTyping = false;
  private wasOpen = false;

  constructor() {
    // Restore the automatic scroll logic
    afterRenderEffect({
      write: () => {
        const messages = this.chatStore.messages();
        const container = this.messagesContainer();

        if (container && messages.length > 0) {
          const el = container.nativeElement;
          el.scrollTop = el.scrollHeight;
        }
      },
    });

    // Move focus into the panel when it opens, so keyboard users do not have to
    // tab from the page start. On close, hand it back to the launcher instead of
    // dropping focus on a detached node. Only on the transition, otherwise a
    // re-render would pull focus back out of the send button.
    afterRenderEffect({
      write: () => {
        const open = this.chatStore.isOpen();
        if (open && !this.wasOpen) {
          this.composer()?.nativeElement.focus();
        } else if (!open && this.wasOpen) {
          this.launcher()?.nativeElement.focus();
        }
        this.wasOpen = open;
      },
    });

    effect(() => {
      const typing = this.chatStore.isTyping();
      if (this.wasTyping && !typing) {
        const last = this.chatStore.messages().at(-1);
        if (last?.role === 'assistant') {
          this.liveAnnouncement.set(last.content);
        }
      }
      this.wasTyping = typing;
    });
  }

  toggleChat() {
    if (!this.chatStore.isOpen()) {
      this.loadMarkdownParser();
    }
    this.chatStore.toggleChat();
  }

  /* A panel that declares itself a dialog has to answer Escape. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.chatStore.isOpen()) {
      this.chatStore.toggleChat();
    }
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newMessage.set(target.value);
  }

  sendMessage(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (this.chatStore.isTyping()) return;

    if (!this.newMessage().trim()) return;

    const message = this.newMessage();
    this.newMessage.set('');

    this.chatStore.addUserMessage(message);
    this.realtimeService.sendChatMessage(message);
  }

  renderAssistantMessage(content: string): string {
    this.markdownReady();
    /* `marked` output is styled by the .chat-markdown block in styles.css, not by
       utility classes injected here: the chat panel is narrow, so its typography
       has its own rules rather than the page's. */
    return this.markdownParser ? this.markdownParser(content) : this.renderPlainText(content);
  }

  private async loadMarkdownParser(): Promise<void> {
    if (this.markdownParser || this.markdownParserLoading) {
      return;
    }

    this.markdownParserLoading = true;
    try {
      const { marked } = await import('marked');
      this.markdownParser = (content: string) =>
        marked.parse(content, {
          gfm: true,
          breaks: true,
        }) as string;
      this.markdownReady.set(true);
    } finally {
      this.markdownParserLoading = false;
    }
  }

  private renderPlainText(content: string): string {
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return `<p>${escaped.replace(/\n/g, '<br/>')}</p>`;
  }
}
