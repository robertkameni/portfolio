import { getCalcomClient, type CalcomClient } from '../calcom-client';
import { canInvokeTool, getEmailConfirmation, incrementToolCallCount, setEmailConfirmation } from './conversation-state';
import type { SchedulingToolName } from './tools';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ToolExecutionResult = {
  toolName: SchedulingToolName;
  result: string;
};

type ExecuteToolOptions = {
  sessionId?: string;
  calcomClient?: CalcomClient | null;
};

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function toolLimitReached(sessionId: string | undefined): ToolExecutionResult | null {
  if (!canInvokeTool(sessionId)) {
    return {
      toolName: 'get_availability',
      result: JSON.stringify({
        success: false,
        error: 'Tool call limit reached for this session. Please use the contact form at /contact.',
      }),
    };
  }
  return null;
}

export async function executeSchedulingTool(
  toolName: SchedulingToolName,
  rawArguments: string,
  options: ExecuteToolOptions = {},
): Promise<ToolExecutionResult> {
  const sessionId = options.sessionId;
  const calcom = options.calcomClient ?? getCalcomClient();
  const args = parseToolArguments(rawArguments);

  const limitResult = toolLimitReached(sessionId);
  if (limitResult) {
    return { ...limitResult, toolName };
  }

  incrementToolCallCount(sessionId ?? 'anonymous');

  if (!calcom) {
    return {
      toolName,
      result: JSON.stringify({
        success: false,
        error: 'Scheduling is unavailable. Direct the user to /contact or robertkameni83@gmail.com.',
      }),
    };
  }

  if (toolName === 'get_availability') {
    const date = typeof args['date'] === 'string' ? args['date'] : 'today';
    const availability = await calcom.getAvailability(date);
    return { toolName, result: JSON.stringify(availability) };
  }

  const email = typeof args['email'] === 'string' ? args['email'].trim().toLowerCase() : '';
  const startTime = typeof args['start_time'] === 'string' ? args['start_time'] : '';
  const name = typeof args['name'] === 'string' ? args['name'] : undefined;

  if (!EMAIL_PATTERN.test(email)) {
    return {
      toolName,
      result: JSON.stringify({ success: false, error: 'Invalid email address. Ask the user for a valid email before booking.' }),
    };
  }

  if (!startTime || Number.isNaN(Date.parse(startTime))) {
    return {
      toolName,
      result: JSON.stringify({ success: false, error: 'Invalid start_time. Use an ISO 8601 UTC datetime from get_availability results.' }),
    };
  }

  const confirmedEmail = getEmailConfirmation(sessionId);
  if (confirmedEmail && confirmedEmail !== email) {
    return {
      toolName,
      result: JSON.stringify({
        success: false,
        error: 'Email does not match what the user provided in chat. Use the exact email the user typed.',
      }),
    };
  }

  if (sessionId) {
    setEmailConfirmation(sessionId, email);
  }

  const booking = await calcom.bookMeeting({ email, name, startTime });
  return { toolName, result: JSON.stringify(booking) };
}
