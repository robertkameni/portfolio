import { defineEventHandler, readBody, createError, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../../db/repositories/analytics.repository';

type EventRequestBody = {
  clientSessionId: string;
  eventType: string;
  payload: Record<string, any>;
};

/**
 * High-throughput API endpoint for ingesting analytics events from the client.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<EventRequestBody>(event);

  if (!body.clientSessionId || !body.eventType || !body.payload) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: clientSessionId, eventType, and payload are required.',
    });
  }

  try {
    // 1. Find or create the session.
    const session = await analyticsRepository.findOrCreateSession(body.clientSessionId, {
      ipAddress: getRequestIP(event),
      userAgent: getHeader(event, 'user-agent'),
      initialReferrer: getHeader(event, 'referer'),
    });

    // 2. Log the specific event for that session.
    const eventData: AnalyticsEventDto = {
      sessionId: session.id,
      eventType: body.eventType,
      payload: body.payload,
    };
    await analyticsRepository.logEvent(eventData);

    // Respond with a 202 Accepted status.
    // This indicates the event has been received for processing, but the processing is not yet complete.
    // It's a good practice for high-volume analytics endpoints to respond quickly.
    event.node.res.statusCode = 202;
    return { status: 'accepted' };

  } catch (error) {
    console.error('Analytics ingestion error:', error);
    // Avoid sending detailed error messages back to the client for analytics endpoints.
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
