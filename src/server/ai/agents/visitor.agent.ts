import { contextEngine } from '../context.engine';
import { geminiClient } from '../gemini.client';
import { prisma } from '../../db/client';

export type VisitorProfileAnalysis = {
  visitorType:
    | 'recruiter'
    | 'hiring_manager'
    | 'developer'
    | 'founder'
    | 'student'
    | 'other';
  interests: string[];
  confidenceScore: number;
  summary: string;
  reasoning: string;
};

function fallback(): VisitorProfileAnalysis {
  return {
    visitorType: 'other',
    interests: [],
    confidenceScore: 0.3,
    summary: 'Insufficient data to classify visitor.',
    reasoning: 'Fallback due to low data or AI failure',
  };
}

function validateProfile(data: any): data is VisitorProfileAnalysis {
  return (
    !!data &&
    typeof data.visitorType === 'string' &&
    typeof data.confidenceScore === 'number' &&
    Array.isArray(data.interests)
  );
}

export const visitorAgent = {
  async analyze(sessionId: string): Promise<VisitorProfileAnalysis> {
    try {
      const sessionHistory = await contextEngine.getSessionHistoryAsText(sessionId);
      if (!sessionHistory || sessionHistory.includes('No activity')) {
        return fallback();
      }

      const prompt = `
        SYSTEM: You are a highly accurate visitor intelligence system.
        RULES: Return ONLY valid JSON. Base answers strictly on provided session data. If unsure, use "other".
        SESSION DATA:
        ---
        ${sessionHistory}
        ---
        TASK: Classify the visitor and extract intent.
        OUTPUT FORMAT: { "visitorType": "...", "interests": [], "confidenceScore": 0.0, "summary": "...", "reasoning": "..." }
      `;

      const result = await geminiClient.generateJson<VisitorProfileAnalysis>(prompt);

      if (validateProfile(result)) {
        // Validation passed, result is guaranteed to be VisitorProfileAnalysis
        await prisma.aiLog.create({
          data: {
            agentName: 'VisitorAgent',
            prompt,
            response: JSON.stringify(result),
            status: 'success',
            sessionId: sessionId,
          },
        });

        // The `result` object is a plain JS object from JSON.parse, which is compatible with Prisma's Json type.
        await prisma.aiDecision.create({
          data: {
            sessionId,
            agentName: 'VisitorAgent',
            decisionType: 'visitor_classification',
            decisionData: result,
            confidenceScore: result.confidenceScore,
            reasoning: result.reasoning,
          },
        });

        return result;
      }

      // Validation failed
      await prisma.aiLog.create({
        data: {
          agentName: 'VisitorAgent',
          prompt,
          response: JSON.stringify(result),
          status: 'error_validation_failed',
          sessionId: sessionId,
        },
      });
      return fallback();

    } catch (error) {
      console.error('VisitorAgent Error:', error);
      await prisma.aiLog.create({
        data: {
          agentName: 'VisitorAgent',
          prompt: 'ERROR_DURING_EXECUTION',
          response: error instanceof Error ? error.message : JSON.stringify(error),
          status: 'error_exception',
          sessionId: sessionId,
        },
      });
      return fallback();
    }
  },
};
