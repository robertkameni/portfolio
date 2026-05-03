import { defineEventHandler, readBody, getRequestIP, getHeader } from 'h3';
import { analyticsRepository, type AnalyticsEventDto } from '../db/repositories/analytics.repository';
import { badRequest, withApiErrorHandling } from '../utils/api-errors';
import { apiAck } from '../utils/api-response';
import { hasRequiredFields, hasRequiredStringFields } from '../utils/request-validation';

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

  if (!hasRequiredStringFields(body, ['clientSessionId', 'eventType']) || !hasRequiredFields(body, ['payload'])) {
    throw badRequest('Bad Request: clientSessionId, eventType, and payload are required.');
  }

  await withApiErrorHandling(
    async () => {
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
    },
    'Internal Server Error',
    { logMessage: 'Analytics ingestion error:' },
  );

  event.node.res.statusCode = 202;
  return apiAck('Analytics events accepted.', 'ANALYTICS_ACCEPTED');
});
