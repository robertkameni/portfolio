export const CALCOM_API_VERSION = '2026-02-25';
export const CALCOM_BASE_URL = 'https://api.cal.com';
export const DEFAULT_MEETING_LENGTH_MINUTES = 30;
export const DEFAULT_TIMEZONE = 'Europe/Berlin';

export type CalcomSlot = {
  start: string;
  end?: string;
};

export type CalcomAvailabilityResult = { success: true; date: string; timeZone: string; slots: CalcomSlot[] } | { success: false; error: string };

export type CalcomBookingResult = { success: true; bookingUid: string; start: string; meetingUrl?: string; message: string } | { success: false; error: string };

export type CalcomClient = {
  getAvailability(dateInput: string): Promise<CalcomAvailabilityResult>;
  bookMeeting(input: { email: string; name?: string; startTime: string }): Promise<CalcomBookingResult>;
};

type CalcomConfig = {
  apiKey: string;
  eventTypeId: number;
  username?: string;
};

function resolveDateRange(dateInput: string): { start: string; end: string; label: string } {
  const normalized = dateInput.trim().toLowerCase();
  const now = new Date();

  const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

  if (normalized === 'today' || normalized === 'heute') {
    const start = formatDate(now);
    return { start, end: start, label: start };
  }

  if (normalized === 'tomorrow' || normalized === 'morgen') {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const start = formatDate(tomorrow);
    return { start, end: start, label: start };
  }

  const isoDateMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDateMatch) {
    const start = isoDateMatch[1];
    return { start, end: start, label: start };
  }

  throw new Error('Invalid date. Use YYYY-MM-DD, "today", or "tomorrow".');
}

function flattenSlots(data: unknown): CalcomSlot[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const record = data as Record<string, unknown>;
  const slots: CalcomSlot[] = [];

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string') {
          slots.push({ start: entry });
          continue;
        }
        if (entry && typeof entry === 'object') {
          const slot = entry as Record<string, unknown>;
          const start = typeof slot['time'] === 'string' ? slot['time'] : typeof slot['start'] === 'string' ? slot['start'] : null;
          const end = typeof slot['end'] === 'string' ? slot['end'] : undefined;
          if (start) {
            slots.push(end ? { start, end } : { start });
          }
        }
      }
    }
  }

  return slots;
}

function humanizeCalcomError(status: number, body: string): string {
  if (status === 401) {
    return 'Calendar authentication failed. Please use the contact form instead.';
  }
  if (status === 409) {
    return 'That time slot is no longer available. Please choose another time.';
  }
  if (status === 422) {
    return 'The booking details were invalid. Please verify the email and time.';
  }
  if (status === 429) {
    return 'Calendar service is rate-limited. Please try again in a few minutes or use the contact form.';
  }
  return body.trim().length > 0 ? body : `Calendar request failed (${status}).`;
}

export function createCalcomClient(config: CalcomConfig): CalcomClient {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
    'cal-api-version': CALCOM_API_VERSION,
  };

  return {
    async getAvailability(dateInput: string): Promise<CalcomAvailabilityResult> {
      let range: { start: string; end: string; label: string };
      try {
        range = resolveDateRange(dateInput);
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Invalid date input.' };
      }

      const params = new URLSearchParams({
        eventTypeId: String(config.eventTypeId),
        start: range.start,
        end: range.end,
        timeZone: DEFAULT_TIMEZONE,
        format: 'range',
      });

      try {
        const response = await fetch(`${CALCOM_BASE_URL}/v2/slots?${params.toString()}`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          const text = await response.text();
          return { success: false, error: humanizeCalcomError(response.status, text) };
        }

        const payload = (await response.json()) as { data?: unknown };
        const slots = flattenSlots(payload.data);
        return {
          success: true,
          date: range.label,
          timeZone: DEFAULT_TIMEZONE,
          slots,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch availability.',
        };
      }
    },

    async bookMeeting(input: { email: string; name?: string; startTime: string }): Promise<CalcomBookingResult> {
      const body: Record<string, unknown> = {
        start: input.startTime,
        eventTypeId: config.eventTypeId,
        attendee: {
          email: input.email,
          name: input.name?.trim() || input.email.split('@')[0] || 'Guest',
          timeZone: DEFAULT_TIMEZONE,
        },
      };

      if (config.username) {
        body['metadata'] = { username: config.username };
      }

      try {
        const response = await fetch(`${CALCOM_BASE_URL}/v2/bookings`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        });

        if (!response.ok) {
          const text = await response.text();
          return { success: false, error: humanizeCalcomError(response.status, text) };
        }

        const payload = (await response.json()) as {
          data?: {
            uid?: string;
            start?: string;
            meetingUrl?: string;
            location?: string;
          };
        };

        const booking = payload.data;
        const meetingUrl = booking?.meetingUrl ?? booking?.location;

        return {
          success: true,
          bookingUid: booking?.uid ?? 'unknown',
          start: booking?.start ?? input.startTime,
          meetingUrl: typeof meetingUrl === 'string' ? meetingUrl : undefined,
          message: 'Booking created. Cal.com will email the calendar invite with the meeting link.',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create booking.',
        };
      }
    },
  };
}

let cachedClient: CalcomClient | null | undefined;

export function getCalcomClient(): CalcomClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const apiKey = process.env['CALCOM_API_KEY']?.trim();
  const eventTypeIdRaw = process.env['CALCOM_EVENT_TYPE_ID']?.trim();
  const username = process.env['CALCOM_USERNAME']?.trim();

  if (!apiKey || !eventTypeIdRaw) {
    cachedClient = null;
    return cachedClient;
  }

  const eventTypeId = Number.parseInt(eventTypeIdRaw, 10);
  if (!Number.isFinite(eventTypeId) || eventTypeId <= 0) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createCalcomClient({ apiKey, eventTypeId, username });
  return cachedClient;
}

export function resetCalcomClientCacheForTests(): void {
  cachedClient = undefined;
}
