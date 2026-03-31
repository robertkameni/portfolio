import { createError, defineEventHandler, readBody } from 'h3';
import { visitorAgent } from '../../../ai/agents/visitor.agent';
import { prisma } from '../../../db/client';
import { pushUpdateToClient } from '../../../api/realtime.get';

type AnalyzeVisitorBody = {
  clientSessionId: string;
};

function readPositiveIntFromEnv(name: string, fallback: number, minValue = 1): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < minValue) {
    return fallback;
  }

  return parsed;
}

const ANALYSIS_COOLDOWN_MS = readPositiveIntFromEnv('AI_ANALYSIS_COOLDOWN_MS', 90_000);
const MIN_NEW_EVENTS_FOR_REANALYSIS = readPositiveIntFromEnv('AI_ANALYSIS_MIN_NEW_EVENTS', 4);
const ANALYSIS_RATE_WINDOW_MS = readPositiveIntFromEnv('AI_ANALYSIS_RATE_WINDOW_MS', 60_000);
const ANALYSIS_RATE_MAX_REQUESTS = readPositiveIntFromEnv('AI_ANALYSIS_RATE_MAX_REQUESTS', 3);

const inFlightAnalyses = new Map<string, Promise<void>>();
const sessionRateWindow = new Map<string, number[]>();

function hasSessionRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const windowStart = now - ANALYSIS_RATE_WINDOW_MS;
  const timestamps = sessionRateWindow.get(sessionId) ?? [];
  const validTimestamps = timestamps.filter((timestamp) => timestamp >= windowStart);

  if (validTimestamps.length >= ANALYSIS_RATE_MAX_REQUESTS) {
    sessionRateWindow.set(sessionId, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  sessionRateWindow.set(sessionId, validTimestamps);
  return false;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AnalyzeVisitorBody>(event);

  if (!body.clientSessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: clientSessionId is required.',
    });
  }

  const session = await prisma.visitorSession.findUnique({
    where: { clientSessionId: body.clientSessionId },
  });

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found: Session not found.',
    });
  }

  if (hasSessionRateLimit(session.id)) {
    event.node.res.statusCode = 202;
    return { status: 'skipped', reason: 'session_rate_limited' };
  }

  if (inFlightAnalyses.has(session.id)) {
    event.node.res.statusCode = 202;
    return { status: 'skipped', reason: 'analysis_in_flight' };
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
      event.node.res.statusCode = 202;
      return { status: 'skipped', reason: 'cooldown_active' };
    }

    const newEventsCount = await prisma.analyticsEvent.count({
      where: {
        sessionId: session.id,
        timestamp: { gt: latestDecision.createdAt },
      },
    });

    if (newEventsCount < MIN_NEW_EVENTS_FOR_REANALYSIS) {
      event.node.res.statusCode = 202;
      return { status: 'skipped', reason: 'not_enough_new_events' };
    }
  }

  const analysisTask = (async () => {
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

        // Push update to the client after the asynchronous analysis finishes.
        pushUpdateToClient(body.clientSessionId, 'visitor_profile_updated', savedProfile);
      }
    } catch (error) {
      console.error('[Background Analysis] Error:', error);
    } finally {
      inFlightAnalyses.delete(session.id);
    }
  })();

  inFlightAnalyses.set(session.id, analysisTask);

  event.node.res.statusCode = 202;
  return { status: 'accepted', message: 'Analysis started in background' };
});
