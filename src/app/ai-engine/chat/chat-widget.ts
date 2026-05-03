import { afterRenderEffect, Component, computed, ElementRef, inject, SecurityContext, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ChatStore } from '../../store/chat.store';
import { RealtimeService } from '../../services/realtime.service';
import { getSiteCopy } from '../../shared/i18n/site-copy';
import { LocaleService } from '../../shared/services/locale.service';

@Component({
  selector: 'chat-widget',
  standalone: true,
  imports: [],
  templateUrl: './chat-widget.html',
})
export class ChatWidgetComponent {
  public chatStore = inject(ChatStore);
  public realtimeService = inject(RealtimeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly localeService = inject(LocaleService);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()));

  messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  newMessage = signal('');
  private markdownParser: ((content: string) => string) | null = null;
  private markdownParserLoading = false;
  private markdownReady = signal(false);

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
  }

  toggleChat() {
    if (!this.chatStore.isOpen()) {
      this.loadMarkdownParser();
    }
    this.chatStore.toggleChat();
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newMessage.set(target.value);
  }

  sendMessage(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.newMessage().trim()) return;

    const message = this.newMessage();
    this.newMessage.set('');

    console.log('Sending message:', message);

    this.chatStore.addUserMessage(message);
    this.realtimeService.sendChatMessage(message);
  }

  renderAssistantMessage(content: string): string {
    this.markdownReady();
    const html = this.markdownParser ? this.markdownParser(content) : this.renderPlainText(content);
    const normalized = html
      .replace(/<ul>/g, '<ul class="list-disc pl-5 my-2 space-y-1">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-5 my-2 space-y-1">')
      .replace(/<p>/g, '<p class="leading-relaxed mb-2">');

    return this.sanitizer.sanitize(SecurityContext.HTML, normalized) ?? '';
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
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return `<p>${escaped.replace(/\n/g, '<br/>')}</p>`;
  }
}
