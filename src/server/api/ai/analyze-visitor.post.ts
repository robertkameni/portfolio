import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '../../db/client';
import { visitorAgent } from '../../ai/agents/visitor.agent';

type AnalyzeVisitorBody = {
  clientSessionId: string;
};

/**
 * Triggers the AI analysis of a visitor's session, saves the result,
 * and returns the generated profile.
 */
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

  const analysis = await visitorAgent.analyze(session.id);

  if (!analysis) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AI analysis failed or returned no result.',
    });
  }

  // With `VisitorProfileAnalysis` as a `type`, Prisma can now correctly handle the object.
  return prisma.visitorProfile.upsert({
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
});
