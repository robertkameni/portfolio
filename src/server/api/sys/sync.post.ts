import { defineEventHandler, readBody, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../../db/repositories/analytics.repository';
import { badRequest, serverError } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';
import { enforceIngestRateLimit } from '../../utils/ingestion-guards';
import { readPositiveIntFromEnv } from '../../utils/rate-limiter';

const INGEST_SYNC_NAMESPACE = 'ingest:sync';
const SYNC_BATCH_SIZE = 100;


type SyncResult = {
  result: 'ignored' | 'accepted' | 'partial';
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

  await enforceIngestRateLimit(event, INGEST_SYNC_NAMESPACE, 'INGEST_SYNC_IP_MAX', 'INGEST_SYNC_WINDOW_MS', 45, 60_000);

  const syncMaxEvents = readPositiveIntFromEnv('SYNC_MAX_EVENTS_PER_REQUEST', 500, 50);
  if (events.length > syncMaxEvents) {
    throw badRequest(`Bad Request: at most ${syncMaxEvents} events per sync request.`, 'SYNC_BATCH_TOO_LARGE');
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

    if (failedEvents > 0 && persistedEvents > 0) {
      console.warn('[Analytics Sync] Partial persistence.', {
        clientSessionId,
        sessionId: session.id,
        totalEvents: events.length,
        persistedEvents,
        failedEvents,
        skippedEvents,
      });
    } else if (failedEvents > 0 && persistedEvents === 0) {
      console.error('[Analytics Sync] No events persisted; all write attempts failed.', {
        clientSessionId,
        sessionId: session.id,
        totalEvents: events.length,
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
    throw serverError('Analytics sync could not persist events. Please retry later.', 'SYNC_PERSISTENCE_FAILED');
  }

  if (failedEvents > 0 && persistedEvents === 0) {
    throw serverError('Analytics sync failed to persist events. Please retry later.', 'SYNC_EVENTS_NOT_PERSISTED');
  }

  event.node.res.statusCode = 202;

  if (failedEvents > 0 && persistedEvents > 0) {
    return apiSuccess<SyncResult>(
      {
        result: 'partial',
        totalEvents: events.length,
        persistedEvents,
        failedEvents,
        skippedEvents,
      },
      'Sync partially applied.',
      'SYNC_PARTIAL',
    );
  }

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
