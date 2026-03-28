import { Injectable, inject, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { isPlatformBrowser } from '@angular/common';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';

@Injectable({
  providedIn: 'root',
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
      console.warn('[RealtimeService] Skipping SSE on server');
      return;
    }

    if (this.eventSource) return;

    this.currentSessionId = clientSessionId;
    this.connectionStatus.set('connecting');
    this.eventSource = new EventSource(`/api/realtime?sessionId=${clientSessionId}`);

    this.eventSource.onopen = () => {
      this.connectionStatus.set('connected');
      console.log('[RealtimeService] SSE Connection established.');
    };

    this.eventSource.onerror = (error) => {
      this.connectionStatus.set('disconnected');
      console.error('[RealtimeService] SSE Error:', error);
      this.eventSource?.close();
    };

    this.eventSource.addEventListener('visitor_profile_updated', (event) => {
      const newProfile = JSON.parse(event.data) as VisitorProfileAnalysis;
      this.visitorStore.setProfile(newProfile);
    });

    // experience_directive_received removed: AdaptiveSectionHost is not active.
  }

  sendChatMessage(message: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.currentSessionId) return;

    // Close any existing stream before starting a new one
    if (this.currentChatStream) {
      this.currentChatStream.close();
    }

    const encodedMessage = encodeURIComponent(message);
    this.currentChatStream = new EventSource(`/api/ai/chat/stream?sessionId=${this.currentSessionId}&message=${encodedMessage}`);

    this.chatStore.setTyping(true);

    this.currentChatStream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 1. Handle the clean completion signal from the server
        if (data.done) {
          this.chatStore.setTyping(false);
          this.currentChatStream?.close();
          this.currentChatStream = null;
          return;
        }

        // 2. Handle server-side errors sent through the stream
        if (data.error) {
          console.error('[RealtimeService] Server stream error:', data.error);
          this.chatStore.appendAssistantToken(`\n[Error: ${data.error}]`);
          this.chatStore.setTyping(false);
          this.currentChatStream?.close();
          this.currentChatStream = null;
          return;
        }

        // 3. Append valid text chunks
        if (data.token) {
          this.chatStore.appendAssistantToken(data.token);
        }
      } catch (error) {
        console.error('[RealtimeService] Failed to parse stream chunk:', error, event.data);
      }
    };

    this.currentChatStream.onerror = (err) => {
      console.error('[RealtimeService] Chat stream network error:', err);
      this.chatStore.setTyping(false);
      this.currentChatStream?.close();
      this.currentChatStream = null;
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
