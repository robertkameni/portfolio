import { defineEventHandler, readBody, createError, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../db/repositories/analytics.repository';

type EventRequestBody = {
  clientSessionId: string;
  eventType: string;
  payload: Record<string, any>;
};

/**
 * High-throughput API endpoint for ingesting analytics events from the client.
 * This endpoint name is intentionally short to reduce the chance of being
 * blocked by ad-blocking rules that target common paths like '/analytics'.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<EventRequestBody>(event);

  if (!body?.clientSessionId || !body?.eventType || !body?.payload) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: clientSessionId, eventType, and payload are required.',
    });
  }

  try {
    const session = await analyticsRepository.findOrCreateSession(body.clientSessionId, {
      ipAddress: getRequestIP(event),
      userAgent: getHeader(event, 'user-agent'),
      initialReferrer: getHeader(event, 'referer'),
    });

    const eventData: AnalyticsEventDto = {
      sessionId: session.id,
      eventType: body.eventType,
      payload: body.payload,
    };
    await analyticsRepository.logEvent(eventData);

    event.node.res.statusCode = 202;
    return { status: 'accepted' };
  } catch (error) {
    console.error('Analytics ingestion error:', error);
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
  }
});
