import { prisma } from '../client';
import type { AnalyticsEvent, VisitorSession } from '../../../../prisma/generated/client';

export type AnalyticsEventDto = {
  sessionId: string;
  eventType: string;
  payload: Record<string, any>;
};

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
  async findOrCreateSession(clientSessionId: string, context: { userAgent?: string; ipAddress?: string; initialReferrer?: string }): Promise<VisitorSession> {
    // Use a transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      const existingSession = await tx.visitorSession.findUnique({
        where: { clientSessionId },
      });

      if (existingSession) {
        // If session exists, just update its last_seen_at timestamp
        return tx.visitorSession.update({
          where: { id: existingSession.id },
          data: { lastSeenAt: new Date() },
        });
      }

      // If no session, create a new visitor and a new session for them.
      const newVisitor = await tx.visitor.create({ data: {} });

      return tx.visitorSession.create({
        data: {
          clientSessionId,
          visitorId: newVisitor.id,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          initialReferrer: context.initialReferrer,
          lastSeenAt: new Date(),
        },
      });
    });
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
};
