import { defineEventHandler, readBody, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../../db/repositories/analytics.repository';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const events = Array.isArray(body) ? body : [body];

  if (!events.length || !events[0]?.clientSessionId) {
    return { status: 'ignored' };
  }

  try {
    const session = await analyticsRepository.findOrCreateSession(events[0].clientSessionId, {
      ipAddress: getRequestIP(event),
      userAgent: getHeader(event, 'user-agent'),
      initialReferrer: getHeader(event, 'referer'),
    });

    for (const e of events) {
      if (e.eventType && e.payload) {
        await analyticsRepository.logEvent({
          sessionId: session.id,
          eventType: e.eventType,
          payload: e.payload,
        } as AnalyticsEventDto);
      }
    }

    event.node.res.statusCode = 202;
    return { status: 'accepted' };

  } catch {
    // Fail silently for analytics
    event.node.res.statusCode = 500;
    return { status: 'error' };
  }
});
