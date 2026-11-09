import { computed, inject, isDevMode, OnDestroy, PLATFORM_ID, Service, signal } from '@angular/core';
import { VisitorStore } from '../store/visitor.store';
import { ChatStore } from '../store/chat.store';
import { AnalyticsService } from './analytics.service';
import { isPlatformBrowser } from '@angular/common';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';
import type { ApiSuccess } from '../shared/types/api.types';

type VisitorProfileEvent = {
  profileData: VisitorProfileAnalysis;
  [key: string]: unknown;
};

type RealtimeTokenResponse = {
  sessionId: string;
  token: string;
  expiresInMs: number;
};

const CHAT_STREAM_STALL_MS = 15_000;
const MAX_SSE_RECONNECT_ATTEMPTS = 5;

@Service()
export class RealtimeService implements OnDestroy {
  private readonly visitorStore = inject(VisitorStore);
  private readonly chatStore = inject(ChatStore);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly MAX_TOKEN_RETRIES = 4;
  private readonly TOKEN_RETRY_BASE_DELAY_MS = 300;
  /**
   * After the token endpoint fails, do not hammer it on every navigation.
   * Live updates are an enhancement: when the backend is down the site keeps
   * working, so a quiet cooldown is the right trade-off.
   */
  private readonly TOKEN_FAILURE_COOLDOWN_MS = 60_000;

  /**
   * The visitor session row is created by the analytics sync that runs right
   * after hydration, so the first token request can lose that race. This is how
   * long to wait before asking once more, rather than retrying a rejected request
   * on the short transient-failure backoff.
   */
  private readonly SESSION_SETTLE_DELAY_MS = 2_500;

  /**
   * One deferred attempt covers a slow analytics sync; more than that is a
   * session that will not appear, and asking again forever only burns requests.
   */
  private readonly SESSION_RETRY_MAX = 1;

  private sessionRetryScheduled = false;
  private sessionRetryCount = 0;

  private tokenCooldownUntil = 0;
  private hasLoggedConnectionFailure = false;

  private eventSource: EventSource | null = null;
  private currentChatStream: EventSource | null = null;
  private currentSessionId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

  public readonly connectionStatus = signal<'connecting' | 'connected' | 'disconnected'>('disconnected');
  public readonly isRealtimeActive = computed(() => this.connectionStatus() === 'connected');

  connect(clientSessionId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearReconnectTimeout();

    if (this.connectionStatus() === 'connecting' || this.connectionStatus() === 'connected') {
      return;
    }

    // The token endpoint is still cooling down after a failure: stay disconnected
    // without another round trip.
    if (Date.now() < this.tokenCooldownUntil) {
      this.connectionStatus.set('disconnected');
      return;
    }

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
        this.eventSource?.close();
        this.eventSource = null;
        this.connectionStatus.set('disconnected');

        // Losing the race with the analytics sync is expected once per visit.
        // Asking again a moment later succeeds where an immediate retry burst
        // only produced identical 401s. Bounded: a session that never appears
        // must not become an endless timeout chain.
        if (this.isSessionNotReadyError(error) && !this.sessionRetryScheduled && this.sessionRetryCount < this.SESSION_RETRY_MAX) {
          this.sessionRetryScheduled = true;
          this.sessionRetryCount += 1;
          this.clearReconnectTimeout();
          this.reconnectTimeoutHandle = setTimeout(() => {
            this.reconnectTimeoutHandle = null;
            this.sessionRetryScheduled = false;
            this.connect(clientSessionId);
          }, this.SESSION_SETTLE_DELAY_MS);
          return;
        }

        this.tokenCooldownUntil = Date.now() + this.TOKEN_FAILURE_COOLDOWN_MS;
        this.logConnectionFailureOnce(error);
      });
  }

  private logConnectionFailureOnce(error: unknown): void {
    if (this.hasLoggedConnectionFailure || !isDevMode()) {
      return;
    }

    this.hasLoggedConnectionFailure = true;
    const detail = error instanceof Error ? error.message : String(error);
    console.warn('[RealtimeService] Live updates unavailable, continuing without them:', detail);
  }

  private clearReconnectTimeout(): void {
    if (!this.reconnectTimeoutHandle) return;

    clearTimeout(this.reconnectTimeoutHandle);
    this.reconnectTimeoutHandle = null;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_SSE_RECONNECT_ATTEMPTS) {
      return;
    }

    this.reconnectAttempts++;
    const delayMs = Math.pow(2, this.reconnectAttempts) * 1000;
    this.clearReconnectTimeout();

    const sessionId = this.currentSessionId ?? this.analyticsService.getClientSessionId();
    this.reconnectTimeoutHandle = setTimeout(() => {
      this.reconnectTimeoutHandle = null;
      this.connect(sessionId);
    }, delayMs);
  }

  private async obtainRealtimeTokenWithRetry(clientSessionId: string, attempt = 0): Promise<RealtimeTokenResponse> {
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
      const error = new Error(`Failed to fetch realtime token: unexpected response type (${response.status})`) as Error & { status?: number; isNetworkError: boolean };
      error.status = response.status;
      error.isNetworkError = false;
      throw error;
    }

    const payload = (await response.json()) as ApiSuccess<RealtimeTokenResponse> & {
      message?: string;
      code?: string;
    };

    if (!response.ok || payload.status !== 'success' || !payload.data?.token) {
      const error = new Error(`Failed to fetch realtime token: ${response.status} ${payload.message ?? payload.status}`) as Error & {
        status?: number;
        statusText?: string;
        code?: string;
        body?: unknown;
      };
      error.status = response.status;
      error.statusText = response.statusText;
      error.code = payload.code;
      error.body = payload;
      throw error;
    }

    return payload.data;
  }

  private shouldRetryForTokenError(error: unknown): boolean {
    const typed = error as { status?: number; message?: string; code?: string; body?: { message?: string; code?: string }; isNetworkError?: boolean };

    if (typed.isNetworkError) {
      return true;
    }

    if (typed.status && typed.status >= 500) {
      return true;
    }

    // An unregistered session cannot become valid by asking again in 300ms.
    // Analytics sync creates the row, so the caller schedules one deferred
    // attempt instead of a burst of identical requests.
    const code = typed.code ?? typed.body?.code;
    if (code === 'INVALID_SESSION' || code === 'SESSION_MISMATCH') {
      return false;
    }

    const message = typed.message?.toLowerCase() ?? typed.body?.message?.toLowerCase() ?? '';
    return typed.status === 401 && message.includes('invalid session');
  }

  /** True when the token request failed only because the session is not registered yet. */
  private isSessionNotReadyError(error: unknown): boolean {
    const typed = error as { code?: string; body?: { code?: string } };
    const code = typed.code ?? typed.body?.code;
    return code === 'INVALID_SESSION';
  }

  private connectEventStream(query: string): void {
    this.eventSource = new EventSource(`/api/realtime?${query}`);

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      this.clearReconnectTimeout();
      this.connectionStatus.set('connected');
      this.hasLoggedConnectionFailure = false;
      // A successful connection proves the session exists; a later reconnect in
      // this visit may use the deferred attempt again.
      this.sessionRetryCount = 0;
    };

    this.eventSource.onerror = () => {
      this.connectionStatus.set('disconnected');
      this.eventSource?.close();
      this.eventSource = null;
      this.scheduleReconnect();
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
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sessionIdForChat = this.currentSessionId ?? this.analyticsService.getClientSessionId();

    const allMessages = this.chatStore.messages();
    const history = allMessages.slice(0, allMessages.length - 1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const requestBody = {
      message,
      history,
      sessionId: sessionIdForChat,
    };

    void this.streamChatMessage(requestBody);
  }

  private async streamChatMessage(requestBody: { message: string; history: unknown[]; sessionId: string }): Promise<void> {
    const controller = new AbortController();

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = response.body;
      if (!body) {
        return;
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let stallTimer: ReturnType<typeof setTimeout> | null = null;

      const clearStallTimer = (): void => {
        if (!stallTimer) return;
        clearTimeout(stallTimer);
        stallTimer = null;
      };

      const armStallTimer = (): void => {
        clearStallTimer();
        stallTimer = setTimeout(() => controller.abort(), CHAT_STREAM_STALL_MS);
      };

      const handleDataLine = (rawLine: string): boolean => {
        const line = rawLine.replace(/\r$/, '').trim();
        if (!line.startsWith('data: ')) {
          return false;
        }

        const jsonStr = line.slice(6).trim();

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

      try {
        let buffer = '';
        let shouldStop = false;

        while (!shouldStop) {
          armStallTimer();
          const { done, value } = await reader.read();
          clearStallTimer();

          if (done) {
            buffer += decoder.decode();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            if (handleDataLine(rawLine)) {
              shouldStop = true;
              break;
            }
          }
        }

        if (!shouldStop && buffer.replace(/\r$/, '').trim().length > 0) {
          handleDataLine(buffer);
        }
      } finally {
        clearStallTimer();
        reader.releaseLock();
      }
    } catch (error) {
      if (this.isAbortError(error)) {
        console.warn('[RealtimeService] chat stream aborted:', error);
        this.chatStore.appendAssistantToken('\n[Stream timed out. Please try again.]');
        return;
      }

      console.error('[RealtimeService] chat stream error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.chatStore.appendAssistantToken(`\n[Connection error: ${message}]`);
    } finally {
      this.chatStore.setTyping(false);
    }
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  disconnect(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.clearReconnectTimeout();

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
