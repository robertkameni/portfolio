import type { ChatMessage } from '../../../ai/deepseek.helpers';
import type { CalcomClient } from '../calcom-client';
import { executeSchedulingTool } from './tool-executor';

type SeedAvailabilityOptions = {
  sessionId?: string;
  calcomClient?: CalcomClient | null;
};

export function buildSchedulingDateContext(): string {
  const now = new Date();
  const utcDate = now.toISOString().slice(0, 10);
  const berlinDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  return `CURRENT DATE (Europe/Berlin): ${berlinDate}. CURRENT UTC DATE: ${utcDate}. Never invent calendar dates or year — use these as "today".`;
}

export async function seedAvailabilityToolExchange(messages: ChatMessage[], options: SeedAvailabilityOptions = {}): Promise<ChatMessage[]> {
  const seeded = [...messages];
  const insertAt = Math.max(1, seeded.length - 1);
  const toolCallId = 'prefetch_get_availability';

  const execution = await executeSchedulingTool('get_availability', JSON.stringify({ date: 'tomorrow' }), {
    sessionId: options.sessionId,
    calcomClient: options.calcomClient,
  });

  seeded.splice(
    insertAt,
    0,
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: toolCallId,
          type: 'function',
          function: {
            name: 'get_availability',
            arguments: JSON.stringify({ date: 'tomorrow' }),
          },
        },
      ],
    },
    {
      role: 'tool',
      tool_call_id: toolCallId,
      content: execution.result,
    },
  );

  return seeded;
}
