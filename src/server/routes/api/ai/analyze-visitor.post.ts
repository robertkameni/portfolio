import { defineEventHandler, readBody, createError } from 'h3';
import { visitorAgent } from '../../../ai/agents/visitor.agent';
import {prisma} from "../../../db/client";
import {pushUpdateToClient} from "../../../api/realtime.get"; // Pfad angepasst

type AnalyzeVisitorBody = {
  clientSessionId: string;
};

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

  // --- Push the update to the client via SSE ---
  pushUpdateToClient(body.clientSessionId, 'visitor_profile_updated', savedProfile);

  return savedProfile;
});
