import { defineEventHandler, getQuery, getRequestIP } from 'h3';
import { prisma } from '../../db/client';
import { unauthorized, badRequest } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';

/** Server-issued anchor from POST /api/ai/analyze-visitor (`profileNotBeforeMs`). Profile is "fresh" when updatedAt is on/after this (same wall clock as DB). */
const NOT_BEFORE_FUDGE_MS = 3000;

type VisitorIntelOutcome = { ready: false } | { ready: true; profileData: unknown; updatedAt: string };

function firstQueryParam(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return '';
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const clientSessionId = firstQueryParam(query['clientSessionId']).trim();
  const sinceMsParsed = Number.parseInt(firstQueryParam(query['sinceMs']), 10);

  if (!clientSessionId) {
    throw badRequest('Bad Request: clientSessionId is required.');
  }
  if (!Number.isFinite(sinceMsParsed)) {
    throw badRequest('Bad Request: sinceMs must be a number (Unix ms, use profileNotBeforeMs from analyze-visitor).');
  }

  const notBeforeMs = sinceMsParsed;

  const session = await prisma.visitorSession.findUnique({
    where: { clientSessionId },
    select: {
      visitorId: true,
      ipAddress: true,
      visitor: {
        select: {
          profile: {
            select: {
              profileData: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw unauthorized('Unauthorized: Invalid session.');
  }

  const requestIp = getRequestIP(event) ?? 'unknown';
  if (session.ipAddress && session.ipAddress !== requestIp) {
    throw unauthorized('Unauthorized: Session fingerprint mismatch.');
  }

  const profileRow = session.visitor.profile;

  if (!profileRow?.profileData) {
    return apiSuccess<VisitorIntelOutcome>({ ready: false }, 'Visitor intelligence not available yet.', 'VISITOR_INTEL_PENDING');
  }

  const updatedAtMs = profileRow.updatedAt.getTime();

  // Same server clock as analyze-visitor anchor; small fudge for write latency.
  const stillStale = updatedAtMs < notBeforeMs - NOT_BEFORE_FUDGE_MS;
  if (stillStale) {
    return apiSuccess<VisitorIntelOutcome>({ ready: false }, 'Profile not refreshed yet.', 'VISITOR_INTEL_PENDING');
  }

  return apiSuccess<VisitorIntelOutcome>(
    {
      ready: true,
      profileData: profileRow.profileData,
      updatedAt: profileRow.updatedAt.toISOString(),
    },
    'Visitor intelligence snapshot.',
    'VISITOR_INTEL_READY',
  );
});
