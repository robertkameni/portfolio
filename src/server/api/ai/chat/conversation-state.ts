type SessionSchedulingState = {
  schedulingMode: boolean;
  confirmedEmail: string | null;
  toolCallCount: number;
  expiresAt: number;
};

const SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_TOOL_CALLS_PER_SESSION = 3;

const sessions = new Map<string, SessionSchedulingState>();

function getOrCreate(sessionId: string): SessionSchedulingState {
  const existing = sessions.get(sessionId);
  if (existing && existing.expiresAt > Date.now()) {
    return existing;
  }

  const state: SessionSchedulingState = {
    schedulingMode: false,
    confirmedEmail: null,
    toolCallCount: 0,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(sessionId, state);
  return state;
}

function touch(state: SessionSchedulingState): void {
  state.expiresAt = Date.now() + SESSION_TTL_MS;
}

export function setSchedulingMode(sessionId: string, active = true): void {
  const state = getOrCreate(sessionId);
  state.schedulingMode = active;
  touch(state);
}

export function isSchedulingMode(sessionId: string | undefined): boolean {
  if (!sessionId) {
    return false;
  }
  const state = sessions.get(sessionId);
  if (!state || state.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return false;
  }
  return state.schedulingMode;
}

export function getEmailConfirmation(sessionId: string | undefined): string | null {
  if (!sessionId) {
    return null;
  }
  const state = sessions.get(sessionId);
  if (!state || state.expiresAt <= Date.now()) {
    return null;
  }
  return state.confirmedEmail;
}

export function setEmailConfirmation(sessionId: string, email: string): void {
  const state = getOrCreate(sessionId);
  state.confirmedEmail = email.toLowerCase();
  touch(state);
}

export function getToolCallCount(sessionId: string | undefined): number {
  if (!sessionId) {
    return MAX_TOOL_CALLS_PER_SESSION;
  }
  const state = sessions.get(sessionId);
  if (!state || state.expiresAt <= Date.now()) {
    return 0;
  }
  return state.toolCallCount;
}

export function incrementToolCallCount(sessionId: string): number {
  const state = getOrCreate(sessionId);
  state.toolCallCount += 1;
  touch(state);
  return state.toolCallCount;
}

export function canInvokeTool(sessionId: string | undefined): boolean {
  return getToolCallCount(sessionId) < MAX_TOOL_CALLS_PER_SESSION;
}

export function resetConversationStateForTests(): void {
  sessions.clear();
}

export { MAX_TOOL_CALLS_PER_SESSION };
