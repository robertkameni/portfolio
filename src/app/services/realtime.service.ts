import { inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { isPlatformBrowser } from '@angular/common';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';
import type { ApiSuccess } from '../shared/types/api.types';

type VisitorProfileEvent = {
  profileData: VisitorProfileAnalysis;
  [key: string]: any;
};

type RealtimeTokenResponse = {
  sessionId: string;
  token: string;
  expiresInMs: number;
};

@Injectable({
  providedIn: 'root',
})
export class RealtimeService implements OnDestroy {
  private readonly visitorStore = inject(VisitorStore);
  private readonly chatStore = inject(ChatStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly MAX_TOKEN_RETRIES = 4;
  private readonly TOKEN_RETRY_BASE_DELAY_MS = 300;

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

    this.obtainRealtimeTokenWithRetry(clientSessionId)
      .then((payload) => {
        const query = new URLSearchParams({
          sessionId: payload.sessionId,
          token: payload.token,
        }).toString();
        this.connectEventStream(query);
      })
      .catch((error) => {
        this.connectionStatus.set('disconnected');
        console.error('[RealtimeService] failed to connect:', error);
      });
  }

  private async obtainRealtimeTokenWithRetry(
    clientSessionId: string,
    attempt = 0,
  ): Promise<RealtimeTokenResponse> {
    try {
      return await this.requestRealtimeToken(clientSessionId);
    } catch (error) {
      if (this.shouldRetryForTokenError(error) && attempt < this.MAX_TOKEN_RETRIES - 1) {
        const delayMs = this.TOKEN_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.obtainRealtimeTokenWithRetry(clientSessionId, attempt + 1);
      }

      throw error;
    }
  }

  private async requestRealtimeToken(clientSessionId: string): Promise<RealtimeTokenResponse> {
    let response: Response;
    try {
      response = await fetch('/api/realtime/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSessionId }),
      });
    } catch {
      const error = new Error('Network error fetching realtime token') as Error & { isNetworkError: boolean };
      error.isNetworkError = true;
      throw error;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const error = new Error(
        `Failed to fetch realtime token: unexpected response type (${response.status})`,
      ) as Error & { status?: number; isNetworkError: boolean };
      error.status = response.status;
      error.isNetworkError = true;
      throw error;
    }

    const payload = (await response.json()) as ApiSuccess<RealtimeTokenResponse> & {
      message?: string;
    };

    if (!response.ok || payload.status !== 'success' || !payload.data?.token) {
      const error = new Error(
        `Failed to fetch realtime token: ${response.status} ${payload.message ?? payload.status}`,
      ) as Error & { status?: number; statusText?: string; body?: unknown };
      error.status = response.status;
      error.statusText = response.statusText;
      error.body = payload;
      throw error;
    }

    return payload.data;
  }

  private shouldRetryForTokenError(error: unknown): boolean {
    const typed = error as { status?: number; message?: string; body?: { message?: string }; isNetworkError?: boolean };

    if (typed.isNetworkError) {
      return true;
    }

    const message = typed.message?.toLowerCase() ?? typed.body?.message?.toLowerCase() ?? '';
    return typed.status === 401 && message.includes('invalid session');
  }

  private connectEventStream(query: string): void {
    this.eventSource = new EventSource(`/api/realtime?${query}`);

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

    // Format history for Gemini
    const allMessages = this.chatStore.messages();
    const history = allMessages
      .slice(0, allMessages.length - 1) // exclude the message currently being sent
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const requestBody = {
      message,
      history,
      sessionId: this.currentSessionId,
    };

    this.chatStore.setTyping(true);

    fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.body;
      })
      .then((body) => {
        if (!body) {
          this.chatStore.setTyping(false);
          return;
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();

        const handleDataLine = (line: string): boolean => {
          if (!line.startsWith('data: ')) {
            return false;
          }

          const jsonStr = line.substring(6);

          try {
            const data = JSON.parse(jsonStr);

            if (data.done) {
              return true;
            }

            if (data.error) {
              this.chatStore.appendAssistantToken(`\n[Error: ${data.error}]`);
              return true;
            }

            if (data.token) {
              this.chatStore.appendAssistantToken(data.token);
            }
          } catch {
            // ignore malformed chunk and continue reading stream
          }

          return false;
        };

        const processStream = async (): Promise<void> => {
          let buffer = '';
          let shouldStop = false;

          try {
            while (!shouldStop) {
              const { done, value } = await reader.read();

              if (done) {
                buffer += decoder.decode();
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (handleDataLine(line)) {
                  shouldStop = true;
                  break;
                }
              }
            }

            if (!shouldStop && buffer.trim().length > 0) {
              handleDataLine(buffer.trim());
            }
          } finally {
            this.chatStore.setTyping(false);
            reader.releaseLock();
          }
        };

        return processStream();
      })
      .catch((error) => {
        console.error('[RealtimeService] chat stream error:', error);
        this.chatStore.appendAssistantToken(`\n[Connection error: ${error.message}]`);
        this.chatStore.setTyping(false);
      });
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
