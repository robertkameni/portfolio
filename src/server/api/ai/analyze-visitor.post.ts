import { defineEventHandler, readBody } from 'h3';
import { visitorAgent } from '../../ai/agents/visitor.agent';
import { prisma } from '../../db/client';
import { pushUpdateToClient } from '../realtime.get';
import { badRequest, notFound } from '../../utils/api-errors';
import { apiSuccess } from '../../utils/api-response';
import { readPositiveIntFromEnv } from '../../utils/env.util';
import { rateLimiter } from '../../utils/rate-limiter';

type AnalyzeVisitorBody = {
  clientSessionId: string;
};

type AnalyzeVisitorOutcome = { result: 'skipped'; reason: string } | { result: 'accepted'; reason: string; profileNotBeforeMs: number };

const ANALYSIS_COOLDOWN_MS = readPositiveIntFromEnv('AI_ANALYSIS_COOLDOWN_MS', 300_000);
const MIN_NEW_EVENTS_FOR_REANALYSIS = readPositiveIntFromEnv('AI_ANALYSIS_MIN_NEW_EVENTS', 8);
const ANALYSIS_RATE_WINDOW_MS = readPositiveIntFromEnv('AI_ANALYSIS_RATE_WINDOW_MS', 300_000);
const ANALYSIS_RATE_MAX_REQUESTS = readPositiveIntFromEnv('AI_ANALYSIS_RATE_MAX_REQUESTS', 1);
const MIN_EVENTS_FOR_FIRST_ANALYSIS = readPositiveIntFromEnv('AI_ANALYSIS_MIN_EVENTS_FIRST', 10);
const GLOBAL_RATE_WINDOW_MS = readPositiveIntFromEnv('AI_GLOBAL_RATE_WINDOW_MS', 3_600_000);
const GLOBAL_RATE_MAX_REQUESTS = readPositiveIntFromEnv('AI_GLOBAL_RATE_MAX_REQUESTS', 4);
const ANALYZE_VISITOR_IN_FLIGHT_TTL_MS = readPositiveIntFromEnv('AI_ANALYZE_VISITOR_IN_FLIGHT_TTL_MS', 180_000);
const ANALYZE_VISITOR_REDIS_NAMESPACE = 'ai:analyze-visitor';

export default defineEventHandler(async (event) => {
  const body = await readBody<AnalyzeVisitorBody>(event);

  if (!body.clientSessionId) {
    throw badRequest('Bad Request: clientSessionId is required.');
  }

  const session = await prisma.visitorSession.findUnique({
    where: { clientSessionId: body.clientSessionId },
  });

  if (!session) {
    throw notFound('Not Found: Session not found.');
  }

  const sessionRateLimit = await rateLimiter.checkRateLimit(ANALYZE_VISITOR_REDIS_NAMESPACE, `session:${session.id}`, {
    maxRequests: ANALYSIS_RATE_MAX_REQUESTS,
    windowMs: ANALYSIS_RATE_WINDOW_MS,
  });
  if (!sessionRateLimit.allowed) {
    event.node.res.statusCode = 202;
    return apiSuccess<AnalyzeVisitorOutcome>({ result: 'skipped', reason: 'session_rate_limited' }, 'Analysis skipped: session rate limited.', 'ANALYSIS_SKIPPED');
  }

  const inFlightLease = await rateLimiter.acquireLease(ANALYZE_VISITOR_REDIS_NAMESPACE, `in-flight:${session.id}`, ANALYZE_VISITOR_IN_FLIGHT_TTL_MS);
  if (!inFlightLease.acquired) {
    event.node.res.statusCode = 202;
    return apiSuccess<AnalyzeVisitorOutcome>({ result: 'skipped', reason: 'analysis_in_flight' }, 'Analysis skipped: analysis already in flight.', 'ANALYSIS_SKIPPED');
  }

  const globalRateLimit = await rateLimiter.checkRateLimit(ANALYZE_VISITOR_REDIS_NAMESPACE, 'global', {
    maxRequests: GLOBAL_RATE_MAX_REQUESTS,
    windowMs: GLOBAL_RATE_WINDOW_MS,
  });
  if (!globalRateLimit.allowed) {
    await inFlightLease.release();
    event.node.res.statusCode = 202;
    return apiSuccess<AnalyzeVisitorOutcome>({ result: 'skipped', reason: 'global_rate_limited' }, 'Analysis skipped: global rate limited.', 'ANALYSIS_SKIPPED');
  }

  const totalEventCount = await prisma.analyticsEvent.count({
    where: { sessionId: session.id },
  });

  if (totalEventCount < MIN_EVENTS_FOR_FIRST_ANALYSIS) {
    await inFlightLease.release();
    event.node.res.statusCode = 202;
    return apiSuccess<AnalyzeVisitorOutcome>({ result: 'skipped', reason: 'insufficient_events' }, 'Analysis skipped: insufficient events.', 'ANALYSIS_SKIPPED');
  }

  const latestDecision = await prisma.aiDecision.findFirst({
    where: {
      sessionId: session.id,
      agentName: 'VisitorAgent',
      decisionType: 'visitor_classification',
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (latestDecision) {
    const elapsedMs = Date.now() - latestDecision.createdAt.getTime();
    if (elapsedMs < ANALYSIS_COOLDOWN_MS) {
      await inFlightLease.release();
      event.node.res.statusCode = 202;
      return apiSuccess<AnalyzeVisitorOutcome>({ result: 'skipped', reason: 'cooldown_active' }, 'Analysis skipped: cooldown active.', 'ANALYSIS_SKIPPED');
    }

    const newEventsCount = await prisma.analyticsEvent.count({
      where: {
        sessionId: session.id,
        timestamp: { gt: latestDecision.createdAt },
      },
    });

    if (newEventsCount < MIN_NEW_EVENTS_FOR_REANALYSIS) {
      await inFlightLease.release();
      event.node.res.statusCode = 202;
      return apiSuccess<AnalyzeVisitorOutcome>({ result: 'skipped', reason: 'not_enough_new_events' }, 'Analysis skipped: not enough new events.', 'ANALYSIS_SKIPPED');
    }
  }

  const profileNotBeforeMs = Date.now();

  const backgroundAnalysis = (async () => {
    try {
      const analysis = await visitorAgent.analyze(session.id);

      if (analysis) {
        const savedProfile = await prisma.visitorProfile.upsert({
          where: { visitorId: session.visitorId },
          update: {
            profileData: analysis,
            confidenceScore: analysis.confidenceScore,
            lastUpdatedByAgent: 'VisitorIntelligenceAgent',
          },
          create: {
            visitorId: session.visitorId,
            profileData: analysis,
            confidenceScore: analysis.confidenceScore,
            lastUpdatedByAgent: 'VisitorIntelligenceAgent',
          },
        });

        // Push update to subscribers on this runtime; with Redis configured, SSE on other lambdas receives it too.
        pushUpdateToClient(body.clientSessionId, 'visitor_profile_updated', savedProfile);
      }
    } catch (error) {
      console.error('[Background Analysis] Error:', error);
    } finally {
      await inFlightLease.release();
    }
  })();

  // Vercel / serverless: keep the invocation alive until the background job finishes publishing.
  const waitUntil = (event as { waitUntil?(p: Promise<unknown>): void }).waitUntil;
  if (typeof waitUntil === 'function') {
    waitUntil(backgroundAnalysis.catch((error) => console.error('[Background Analysis] Unhandled rejection:', error)));
  } else {
    void backgroundAnalysis.catch((error) => console.error('[Background Analysis] Unhandled rejection:', error));
  }

  event.node.res.statusCode = 202;
  return apiSuccess<AnalyzeVisitorOutcome>({ result: 'accepted', reason: 'analysis_started', profileNotBeforeMs }, 'Analysis started in background.', 'ANALYSIS_ACCEPTED');
});
