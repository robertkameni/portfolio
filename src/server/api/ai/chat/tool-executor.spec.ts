// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { resetConversationStateForTests, setEmailConfirmation } from './conversation-state';
import { executeSchedulingTool } from './tool-executor';
import type { CalcomClient } from '../calcom-client';

describe('tool-executor', () => {
  const mockCalcom: CalcomClient = {
    async getAvailability() {
      return { success: true, date: '2026-07-29', timeZone: 'Europe/Berlin', slots: [{ start: '2026-07-29T13:00:00Z' }] };
    },
    async bookMeeting() {
      return {
        success: true,
        bookingUid: 'uid-1',
        start: '2026-07-29T13:00:00Z',
        message: 'Booking created. Cal.com will email the calendar invite with the meeting link.',
      };
    },
  };

  beforeEach(() => {
    resetConversationStateForTests();
  });

  it('executes get_availability', async () => {
    const result = await executeSchedulingTool('get_availability', JSON.stringify({ date: 'tomorrow' }), {
      sessionId: 's1',
      calcomClient: mockCalcom,
    });

    const parsed = JSON.parse(result.result) as { success: boolean; slots?: unknown[] };
    expect(parsed.success).toBe(true);
    expect(parsed.slots?.length).toBe(1);
  });

  it('rejects booking when email does not match chat confirmation', async () => {
    setEmailConfirmation('s1', 'real@example.com');

    const result = await executeSchedulingTool('book_meeting', JSON.stringify({ email: 'other@example.com', start_time: '2026-07-29T13:00:00Z' }), {
      sessionId: 's1',
      calcomClient: mockCalcom,
    });

    const parsed = JSON.parse(result.result) as { success: boolean; error?: string };
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('does not match');
  });

  it('books when email matches chat confirmation', async () => {
    setEmailConfirmation('s1', 'guest@example.com');

    const result = await executeSchedulingTool('book_meeting', JSON.stringify({ email: 'guest@example.com', start_time: '2026-07-29T13:00:00Z' }), {
      sessionId: 's1',
      calcomClient: mockCalcom,
    });

    const parsed = JSON.parse(result.result) as { success: boolean; bookingUid?: string };
    expect(parsed.success).toBe(true);
    expect(parsed.bookingUid).toBe('uid-1');
  });
});
