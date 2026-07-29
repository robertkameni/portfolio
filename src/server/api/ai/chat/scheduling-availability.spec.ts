// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { resetConversationStateForTests } from './conversation-state';
import { seedAvailabilityToolExchange } from './scheduling-availability';
import type { CalcomClient } from '../calcom-client';
import { executeSchedulingTool } from './tool-executor';

describe('scheduling-availability', () => {
  const mockCalcom: CalcomClient = {
    async getAvailability() {
      return {
        success: true,
        date: '2026-07-29',
        timeZone: 'Europe/Berlin',
        slots: [{ start: '2026-07-29T09:00:00.000+02:00', end: '2026-07-29T09:30:00.000+02:00' }],
      };
    },
    async bookMeeting() {
      return { success: true, bookingUid: 'uid-1', start: '2026-07-29T09:00:00Z', message: 'ok' };
    },
  };

  beforeEach(() => {
    resetConversationStateForTests();
  });

  it('injects a prefetched get_availability tool exchange before the user message', async () => {
    const messages = await seedAvailabilityToolExchange(
      [
        { role: 'system', content: 'system' },
        { role: 'user', content: 'Bitte Termin buchen' },
      ],
      { sessionId: 'session-1', calcomClient: mockCalcom },
    );

    expect(messages).toHaveLength(4);
    expect(messages[1]?.role).toBe('assistant');
    expect(messages[1]?.tool_calls?.[0]?.function.name).toBe('get_availability');
    expect(messages[2]?.role).toBe('tool');
    expect(messages[3]?.role).toBe('user');

    const toolResult = JSON.parse(String(messages[2]?.content)) as { success: boolean; slots?: unknown[] };
    expect(toolResult.success).toBe(true);
  });

  it('uses the mocked calcom client through executeSchedulingTool', async () => {
    const result = await executeSchedulingTool('get_availability', JSON.stringify({ date: 'tomorrow' }), {
      sessionId: 'session-2',
      calcomClient: mockCalcom,
    });

    const parsed = JSON.parse(result.result) as { success: boolean; slots?: unknown[] };
    expect(parsed.slots?.length).toBe(1);
  });
});
