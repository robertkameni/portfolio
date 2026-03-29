import {createError, defineEventHandler, readBody} from 'h3';
import {visitorAgent} from '../../../ai/agents/visitor.agent';
import {prisma} from "../../../db/client";
import {pushUpdateToClient} from "../../../api/realtime.get";

type AnalyzeVisitorBody = {
  clientSessionId: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<AnalyzeVisitorBody>(event);

  if (!body.clientSessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: clientSessionId is required.'
    });
  }

  const session = await prisma.visitorSession.findUnique({
    where: {clientSessionId: body.clientSessionId}
  });

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found: Session not found.'
    });
  }

  // --- ASYNCHRONOUS BACKGROUND PROCESSING ---
  // This prevents the HTTP request from hanging while Gemini thinks.
  void (async () => {
    try {
      const analysis = await visitorAgent.analyze(session.id);

      if (analysis) {
        const savedProfile = await prisma.visitorProfile.upsert({
          where: {visitorId: session.visitorId},
          update: {
            profileData: analysis,
            confidenceScore: analysis.confidenceScore,
            lastUpdatedByAgent: 'VisitorIntelligenceAgent'
          },
          create: {
            visitorId: session.visitorId,
            profileData: analysis,
            confidenceScore: analysis.confidenceScore,
            lastUpdatedByAgent: 'VisitorIntelligenceAgent'
          }
        });

        // Push the update to the client via SSE once Gemini is done
        pushUpdateToClient(body.clientSessionId, 'visitor_profile_updated', savedProfile);
      }
    } catch (error) {
      console.error('[Background Analysis] Error:', error);
    }
  })();
  
  event.node.res.statusCode = 202;
  return {status: 'accepted', message: 'Analysis started in background'};
});
