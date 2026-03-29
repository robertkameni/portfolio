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
        SYSTEM: You are a highly accurate visitor intelligence system analyzing behavior on a Software Engineer's portfolio website.

        RULES:
        1. Return ONLY valid JSON matching the exact OUTPUT FORMAT.
        2. Base answers strictly on the provided SESSION DATA.
        3. A "recruiter" usually looks at basic info, about, and skills quickly.
        4. A "hiring_manager" looks deeper at projects, skills, and about sections.
        5. A "founder" might focus on full-stack projects, architecture, and contact forms.
        6. A "developer" will likely spend time reading specific technical details, github links, or specific modern tech stack cards (like Angular, Signals, Nx).
        7. If unsure, use "other".

        SESSION DATA (Chronological events of what the visitor viewed):
        ---
        ${sessionHistory}
        ---

        TASK: Analyze the chronology and focus of the views. Classify the visitor and extract their primary interests.

        OUTPUT FORMAT EXACTLY:
        {
          "visitorType": "recruiter" | "hiring_manager" | "developer" | "founder" | "student" | "other",
          "interests": ["list", "of", "technologies", "or", "topics", "they", "viewed"],
          "confidenceScore": 0.95,
          "summary": "A 1-sentence summary of what they did.",
          "reasoning": "A 1-sentence explanation of why you chose this visitorType based on the events."
        }
      `;

      const model=  gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType:'application/json'
        }
      });

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
