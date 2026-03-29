import {inject, Injectable, OnDestroy, PLATFORM_ID, signal} from '@angular/core';
import {VisitorStore} from '../store/visitor.store';
import {ChatStore} from '../store/chat.store';
import {isPlatformBrowser} from '@angular/common';
import type {VisitorProfileAnalysis} from '../shared/types/visitor.types';

type VisitorProfileEvent = {
  profileData: VisitorProfileAnalysis;
  [key: string]: any;
};

@Injectable({
  providedIn: 'root'
})
export class RealtimeService implements OnDestroy {
  private readonly visitorStore = inject(VisitorStore);
  private readonly chatStore = inject(ChatStore);
  private readonly platformId = inject(PLATFORM_ID);

  private eventSource: EventSource | null = null;
  private currentChatStream: EventSource | null = null;
  private currentSessionId: string | null = null;

  public readonly connectionStatus = signal<'connecting' | 'connected' | 'disconnected'>('disconnected');

  connect(clientSessionId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.eventSource) return;

    this.currentSessionId = clientSessionId;
    this.connectionStatus.set('connecting');
    this.eventSource = new EventSource(`/api/realtime?sessionId=${clientSessionId}`);

    this.eventSource.onopen = () => {
      this.connectionStatus.set('connected');
    };

    this.eventSource.onerror = () => {
      this.connectionStatus.set('disconnected');
      this.eventSource?.close();
    };

    this.eventSource.addEventListener('visitor_profile_updated', (event) => {
      try {
        const eventData = JSON.parse(event.data) as VisitorProfileEvent;

        if (eventData?.profileData) {
          this.visitorStore.setProfile(eventData.profileData);
        }
      } catch (e) {
        // Fail silently if JSON parsing fails
      }
    });
  }

  sendChatMessage(message: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentSessionId) return;

    if (this.currentChatStream) {
      this.currentChatStream.close();
    }

    // Format history for Gemini
    const allMessages = this.chatStore.messages();
    const history = allMessages
      .slice(0, allMessages.length - 1) // exclude the message currently being sent
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{text: msg.content}]
      }));

    const encodedMessage = encodeURIComponent(message);
    const encodedHistory = encodeURIComponent(JSON.stringify(history));

    this.currentChatStream = new EventSource(`/api/ai/chat/stream?sessionId=${this.currentSessionId}&message=${encodedMessage}&history=${encodedHistory}`);

    this.chatStore.setTyping(true);

    this.currentChatStream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.done) {
          this.chatStore.setTyping(false);
          this.currentChatStream?.close();
          return;
        }

        if (data.error) {
          this.chatStore.appendAssistantToken(`\n[Error: ${data.error}]`);
          this.chatStore.setTyping(false);
          this.currentChatStream?.close();
          return;
        }

        if (data.token) {
          this.chatStore.appendAssistantToken(data.token);
        }
      } catch (error) {
        // noop
      }
    };

    this.currentChatStream.onerror = () => {
      this.chatStore.setTyping(false);
      this.currentChatStream?.close();
    };
  }

  disconnect(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStatus.set('disconnected');
    }
    if (this.currentChatStream) {
      this.currentChatStream.close();
      this.currentChatStream = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
