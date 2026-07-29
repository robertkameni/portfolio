export const SCHEDULING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_availability',
      description: "Fetch Robert's available time slots for a given date. Use BEFORE proposing times to the user.",
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: "ISO date string (YYYY-MM-DD) or 'today'/'tomorrow'",
          },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_meeting',
      description:
        "Book a meeting on Robert's calendar. Cal.com will send the calendar invite with the Google Meet link to the attendee's email automatically. ONLY call this AFTER the user has explicitly confirmed the time and provided their email.",
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Attendee email — must match what the user typed in chat',
          },
          name: {
            type: 'string',
            description: 'Attendee name (optional, can be inferred from chat)',
          },
          start_time: {
            type: 'string',
            description: 'ISO 8601 datetime string in UTC, e.g. 2026-07-29T13:00:00Z',
          },
        },
        required: ['email', 'start_time'],
      },
    },
  },
] as const;

export type SchedulingToolName = 'get_availability' | 'book_meeting';
