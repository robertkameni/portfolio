import { defineEventHandler, readBody, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../../db/repositories/analytics.repository';
import { apiSuccess } from '../../utils/api-response';

const SYNC_BATCH_SIZE = 100;

type SyncResult = {
  result: 'ignored' | 'accepted';
  totalEvents: number;
  persistedEvents: number;
  failedEvents: number;
  skippedEvents: number;
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const events = Array.isArray(body) ? body : [body];
  const clientSessionId = events[0]?.clientSessionId;

  if (!events.length || !clientSessionId) {
    event.node.res.statusCode = 202;
    return apiSuccess<SyncResult>(
      {
        result: 'ignored',
        totalEvents: events.length,
        persistedEvents: 0,
        failedEvents: 0,
        skippedEvents: events.length,
      },
      'Sync payload ignored.',
      'SYNC_IGNORED',
    );
  }

  let persistedEvents = 0;
  let failedEvents = 0;
  let skippedEvents = 0;

  try {
    const session = await analyticsRepository.findOrCreateSession(clientSessionId, {
      ipAddress: getRequestIP(event),
      userAgent: getHeader(event, 'user-agent'),
      initialReferrer: getHeader(event, 'referer'),
    });

    const eventsByChunk: AnalyticsEventDto[] = [];

    for (const e of events) {
      if (!e?.eventType || !e?.payload) {
        skippedEvents++;
        continue;
      }
      eventsByChunk.push({
        sessionId: session.id,
        eventType: e.eventType,
        payload: e.payload,
      } as AnalyticsEventDto);

      if (eventsByChunk.length < SYNC_BATCH_SIZE) {
        continue;
      }

      const batchResult = await analyticsRepository.logEvents(session.id, eventsByChunk.splice(0, eventsByChunk.length));
      persistedEvents += batchResult.persistedEvents;
      failedEvents += batchResult.failedEvents;
      if (batchResult.failedEvents > 0) {
        console.error('[Analytics Sync] Failed to persist some events in batch.', {
          clientSessionId,
          sessionId: session.id,
          batchSize: SYNC_BATCH_SIZE,
          failedEvents: batchResult.failedEvents,
          failedIndexes: batchResult.failedIndexes,
        });
      }
    }

    if (eventsByChunk.length > 0) {
      const batchResult = await analyticsRepository.logEvents(session.id, eventsByChunk);
      persistedEvents += batchResult.persistedEvents;
      failedEvents += batchResult.failedEvents;
      if (batchResult.failedEvents > 0) {
        console.error('[Analytics Sync] Failed to persist some events in final batch.', {
          clientSessionId,
          sessionId: session.id,
          batchSize: eventsByChunk.length,
          failedEvents: batchResult.failedEvents,
          failedIndexes: batchResult.failedIndexes,
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
  return apiSuccess<SyncResult>(
    {
      result: 'accepted',
      totalEvents: events.length,
      persistedEvents,
      failedEvents,
      skippedEvents,
    },
    'Sync accepted.',
    'SYNC_ACCEPTED',
  );
});
