import { defineEventHandler, readBody, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../../db/repositories/analytics.repository';
import { apiAck } from '../../utils/api-response';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const events = Array.isArray(body) ? body : [body];
  const clientSessionId = events[0]?.clientSessionId;

  if (!events.length || !clientSessionId) {
    return apiAck('Sync payload ignored.', 'SYNC_IGNORED');
  }

  try {
    const session = await analyticsRepository.findOrCreateSession(clientSessionId, {
      ipAddress: getRequestIP(event),
      userAgent: getHeader(event, 'user-agent'),
      initialReferrer: getHeader(event, 'referer'),
    });

    let persistedEvents = 0;
    let failedEvents = 0;
    let skippedEvents = 0;

    for (const [index, e] of events.entries()) {
      if (!e?.eventType || !e?.payload) {
        skippedEvents++;
        continue;
      }

      try {
        await analyticsRepository.logEvent({
          sessionId: session.id,
          eventType: e.eventType,
          payload: e.payload,
        } as AnalyticsEventDto);
        persistedEvents++;
      } catch (error) {
        failedEvents++;
        console.error('[Analytics Sync] Failed to persist event.', {
          clientSessionId,
          sessionId: session.id,
          eventIndex: index,
          eventType: e.eventType,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (failedEvents > 0) {
      console.error('[Analytics Sync] Batch completed with event persistence failures.', {
        clientSessionId,
        sessionId: session.id,
        totalEvents: events.length,
        persistedEvents,
        failedEvents,
        skippedEvents,
      });
    }

  } catch (error) {
    console.error('[Analytics Sync] Failed to persist sync payload.', {
      clientSessionId,
      eventCount: events.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  event.node.res.statusCode = 202;
  return apiAck('Sync accepted.', 'SYNC_ACCEPTED');
});
