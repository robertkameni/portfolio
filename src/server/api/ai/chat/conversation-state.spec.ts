// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import {
  canInvokeTool,
  getEmailConfirmation,
  getToolCallCount,
  incrementToolCallCount,
  isSchedulingMode,
  resetConversationStateForTests,
  setEmailConfirmation,
  setSchedulingMode,
} from './conversation-state';

describe('conversation-state', () => {
  beforeEach(() => {
    resetConversationStateForTests();
  });

  it('tracks scheduling mode per session', () => {
    expect(isSchedulingMode('session-1')).toBe(false);
    setSchedulingMode('session-1', true);
    expect(isSchedulingMode('session-1')).toBe(true);
  });

  it('stores and reads confirmed email', () => {
    setEmailConfirmation('session-1', 'User@Example.com');
    expect(getEmailConfirmation('session-1')).toBe('user@example.com');
  });

  it('limits tool calls to three per session', () => {
    expect(canInvokeTool('session-1')).toBe(true);
    incrementToolCallCount('session-1');
    incrementToolCallCount('session-1');
    incrementToolCallCount('session-1');
    expect(getToolCallCount('session-1')).toBe(3);
    expect(canInvokeTool('session-1')).toBe(false);
  });
});
