import { Prisma } from '@prisma/client';
import { prisma } from '../client';
import { sleep } from '../utils/async.util';
import type { AnalyticsEvent, VisitorSession } from '../../../../prisma/generated/client';

export type AnalyticsEventDto = {
  sessionId: string;
  eventType: string;
  payload: Record<string, Prisma.InputJsonValue>;
};

type LogEventBatchResult = {
  persistedEvents: number;
  failedEvents: number;
  failedIndexes: number[];
};

const MAX_SESSION_RETRIES = 2;
const SESSION_RETRY_DELAY_MS = 120;

function isRetryableDbError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const code = 'code' in error ? (error as { code?: string; }).code : undefined;

  if (code === 'P2028' || code === 'P1001' || code === 'P1008' || code === 'P2024' || code === 'P2034') {
    return true;
  }

  return message.includes('transaction') && message.includes('time');
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const code = 'code' in error ? (error as { code?: string; }).code : undefined;

  return code === 'P2002' || (message.includes('unique') && message.includes('clientsessionid'));
}

function buildSessionUpdate(context: { userAgent?: string; ipAddress?: string; initialReferrer?: string; }) {
  const now = new Date();
  const data: {
    lastSeenAt: Date;
    userAgent?: string;
    ipAddress?: string;
    initialReferrer?: string;
  } = { lastSeenAt: now };

  if (context.userAgent) {
    data.userAgent = context.userAgent;
  }
  if (context.ipAddress) {
    data.ipAddress = context.ipAddress;
  }
  if (context.initialReferrer) {
    data.initialReferrer = context.initialReferrer;
  }

  return data;
}

/**
 * Repository for analytics data access.
 * Encapsulates all database operations for visitors, sessions, and events.
 */
export const analyticsRepository = {
  /**
   * Finds or creates a visitor session. This is the main entry point for tracking.
   * It handles creating a visitor if one doesn't exist for the session.
   * @param clientSessionId A client-generated UUID to identify the session.
   * @param context Additional request data like user agent and IP.
   * @returns The existing or newly created visitor session.
   */
  async findOrCreateSession(clientSessionId: string, context: { userAgent?: string; ipAddress?: string; initialReferrer?: string; }): Promise<VisitorSession> {
    const updates = buildSessionUpdate(context);
    const now = updates.lastSeenAt;

    for (let attempt = 0; attempt < MAX_SESSION_RETRIES; attempt++) {
      try {
        return await prisma.visitorSession.upsert({
          where: { clientSessionId },
          create: {
            clientSessionId,
            visitor: {
              create: {},
            },
            lastSeenAt: now,
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
            initialReferrer: context.initialReferrer,
          },
          update: updates,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          const existingSession = await prisma.visitorSession.findUnique({
            where: { clientSessionId },
          });

          if (existingSession) {
            return existingSession;
          }
        }

        const shouldRetry = isRetryableDbError(error) && attempt + 1 < MAX_SESSION_RETRIES;
        if (shouldRetry) {
          await sleep(SESSION_RETRY_DELAY_MS * (attempt + 1));
          continue;
        }

        throw error;
      }
    }
    throw new Error(`Unable to create or update visitor session for clientSessionId: ${clientSessionId}`);
  },

  /**
   * Logs a new analytics event for a given session.
   * @param eventData The data for the event.
   * @returns The newly created analytics event.
   */
  async logEvent(eventData: AnalyticsEventDto): Promise<AnalyticsEvent> {
    return prisma.analyticsEvent.create({
      data: {
        sessionId: eventData.sessionId,
        eventType: eventData.eventType,
        payload: eventData.payload,
      },
    });
  },

  async logEvents(sessionId: string, eventDataList: AnalyticsEventDto[]): Promise<LogEventBatchResult> {
    if (eventDataList.length === 0) {
      return { persistedEvents: 0, failedEvents: 0, failedIndexes: [] };
    }

    try {
      const result = await prisma.analyticsEvent.createMany({
        data: eventDataList,
        skipDuplicates: false,
      });

      return {
        persistedEvents: result.count,
        failedEvents: eventDataList.length - result.count,
        failedIndexes: [],
      };
    } catch (error) {
      let persistedEvents = 0;
      const failedIndexes: number[] = [];

      for (let index = 0; index < eventDataList.length; index++) {
        const eventData = eventDataList[index];
        try {
          await prisma.analyticsEvent.create({
            data: {
              sessionId: eventData.sessionId,
              eventType: eventData.eventType,
              payload: eventData.payload,
            },
          });
          persistedEvents += 1;
        } catch (batchError) {
          failedIndexes.push(index);
          console.error('[AnalyticsRepository] Failed to persist analytics event.', {
            sessionId,
            index,
            eventType: eventData.eventType,
            error: batchError instanceof Error ? batchError.message : String(batchError),
          });
        }
      }

      return {
        persistedEvents,
        failedEvents: eventDataList.length - persistedEvents,
        failedIndexes,
      };
    }
  },
};
