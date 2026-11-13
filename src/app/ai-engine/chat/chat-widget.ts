import { afterRenderEffect, Component, computed, DestroyRef, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { ChatStore } from '../../store/chat.store';
import { RealtimeService } from '../../services/realtime.service';
import { SafeHtmlDirective } from '../../shared/directives/safe-html.directive';
import { getSiteCopy } from '../../shared/i18n/site-copy';
import { LocaleService } from '../../shared/services/locale.service';
import { StreamingReveal } from './streaming-reveal';

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
  /* What the bubble shows. The store keeps the raw stream; this holds the
     prefix that has been revealed, so a model that answers in one burst still
     reads like someone talking. */
  protected readonly visibleAnswer = signal('');
  private readonly reveal = new StreamingReveal({
    onUpdate: (text) => this.visibleAnswer.set(text),
    instant: typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  private markdownParser: ((content: string) => string) | null = null;
  private markdownParserLoading = false;
  private readonly markdownCache = new Map<string, string>();
  private markdownReady = signal(false);

  /* Text for the polite live region. Announced when a reply finishes, not while
     it streams: a token-by-token announcement is unusable noise. */
  protected readonly liveAnnouncement = signal('');

  private wasTyping = false;
  private wasOpen = false;

  constructor() {
    /* The reveal drives itself on a frame clock, so it has to be stopped when
       the widget goes away. Without this the loop keeps ticking against a
       destroyed component after a route change. */
    inject(DestroyRef).onDestroy(() => this.reveal.dispose());

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
      const prompt = this.chatStore.pendingPrompt();
      if (prompt === null) {
        return;
      }

      /* A question tapped while an answer is still streaming waits its turn
         instead of being dropped: this effect reads isTyping(), so it runs
         again the moment the stream ends. */
      if (this.chatStore.isTyping()) {
        return;
      }

      this.chatStore.consumePendingPrompt();
      void this.loadMarkdownParser();
      this.dispatch(prompt);
    });

    effect(() => {
      const messages = this.chatStore.messages();
      const last = messages.at(-1);

      if (!last || last.role !== 'assistant') {
        this.reveal.reset();
        return;
      }

      this.reveal.setSource(last.content);

      // The stream is done, so the tail should finish at a slightly faster
      // pace instead of typing out the last paragraph at reading speed.
      if (!this.chatStore.isTyping()) {
        this.reveal.finish();
      }
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

  /**
   * True while the newest answer is still arriving or still being revealed.
   * The bubble renders plain text in that window: the caret can sit inline
   * after the last character, and the markdown parser is not re-run on every
   * partial sentence.
   */
  protected isRevealing(index: number): boolean {
    const messages = this.chatStore.messages();
    const message = messages[index];
    if (index !== messages.length - 1 || message?.role !== 'assistant') {
      return false;
    }

    return this.visibleAnswer().length > 0 && (this.chatStore.isTyping() || this.visibleAnswer().length < message.content.length);
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

    /* A draft typed while the twin is still answering stays in the composer.
       Clearing it here would delete the visitor's next question. */
    if (this.chatStore.isTyping()) {
      return;
    }

    const text = this.newMessage().trim();
    if (!text) {
      return;
    }

    this.newMessage.set('');
    this.dispatch(text);
  }

  /** One send path, so a question parked by the page behaves like a typed one. */
  private dispatch(text: string): void {
    this.chatStore.addUserMessage(text);
    this.realtimeService.sendChatMessage(text);
  }

  renderAssistantMessage(content: string): string {
    this.markdownReady();
    if (!this.markdownParser) {
      return this.renderPlainText(content);
    }

    /* Parsing is not cheap and this runs on every change detection pass. The
       reveal repaints the widget on each frame, so without the cache every
       finished answer would be re-parsed 60 times a second. */
    const cached = this.markdownCache.get(content);
    if (cached !== undefined) {
      return cached;
    }

    const html = this.markdownParser(content);
    this.markdownCache.set(content, html);
    return html;
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
