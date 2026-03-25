import { contextEngine } from '../context.engine';
import { prisma } from '../../db/client';
import {getGeminiClient} from "../gemini.client";

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
      const gemini = getGeminiClient();
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

      // 1. Initialisiere das Modell mit JSON-Konfiguration
      const model=  gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType:'application/json'
        }
      });

      // 2. Generiere den Inhalt und parse das JSON
      const aiResponse = await model.generateContent(prompt);
      const responseText = aiResponse.response.text();
      const result = JSON.parse(responseText);

      if (validateProfile(result)) {
        await prisma.aiLog.create({
          data: {
            agentName: 'VisitorAgent',
            prompt,
            response: JSON.stringify(result),
            status: 'success',
            sessionId: sessionId,
          },
        });

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
