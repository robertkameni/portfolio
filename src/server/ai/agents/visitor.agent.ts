import { contextEngine } from '../context.engine';
import { prisma } from '../../db/client';
import { DEFAULT_DEEPSEEK_VISITOR_MODEL, getAIClient, withAIRetry } from '../deepseek.client';
import { isQuotaError } from '../deepseek.helpers';

const VISITOR_AI_QUOTA_BACKOFF_MS = Number.parseInt(process.env['VISITOR_AI_QUOTA_BACKOFF_MS'] ?? '900000', 10);
let quotaBlockedUntil = 0;

export type VisitorProfileAnalysis = {
  visitorType: 'recruiter' | 'hiring_manager' | 'developer' | 'founder' | 'student' | 'other';
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

function validateProfile(data: unknown): data is VisitorProfileAnalysis {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return typeof record['visitorType'] === 'string' && typeof record['confidenceScore'] === 'number' && Array.isArray(record['interests']);
}

async function persistFallbackDecision(sessionId: string, analysis: VisitorProfileAnalysis, reasoning: string): Promise<void> {
  await prisma.aiDecision.create({
    data: {
      sessionId,
      agentName: 'VisitorAgent',
      decisionType: 'visitor_classification',
      decisionData: { ...analysis, reasoning },
      confidenceScore: analysis.confidenceScore,
      reasoning,
    },
  });
}

export async function analyzeVisitorSession(sessionId: string): Promise<VisitorProfileAnalysis> {
  try {
    if (Date.now() < quotaBlockedUntil) {
      const fb = fallback();
      await persistFallbackDecision(sessionId, fb, 'Fallback due to active DeepSeek quota backoff window.');
      return fb;
    }

    const ai = getAIClient();
    const sessionHistory = await contextEngine.getSessionHistoryAsText(sessionId);

    if (!sessionHistory || sessionHistory.includes('No activity')) {
      return fallback();
    }

    const prompt = `
        SYSTEM: You read the event log from a software engineer's portfolio site and guess what kind of visitor you are looking at.

        RULES:
        1. Return ONLY valid JSON matching the exact OUTPUT FORMAT.
        2. Base answers strictly on the provided SESSION DATA.
        3. "recruiter": mostly about, skills, and basic info, often skimmed fast.
        4. "hiring_manager": more time on projects, skills, and about than a quick skim.
        5. "founder": often full-stack projects, architecture, contact forms.
        6. "developer": sticks on technical detail, GitHub links, stack cards (Angular, Signals, Nx, similar).
        7. If unsure, use "other".

        SESSION DATA (Chronological events of what the visitor viewed):
        ---
        ${sessionHistory}
        ---

        TASK: Follow the chronology and where they spent attention. Set visitorType and list their main interests.

        OUTPUT FORMAT EXACTLY:
        {
          "visitorType": "recruiter" | "hiring_manager" | "developer" | "founder" | "student" | "other",
          "interests": ["list", "of", "technologies", "or", "topics", "they", "viewed"],
          "confidenceScore": 0.95,
          "summary": "A 1-sentence summary of what they did.",
          "reasoning": "A 1-sentence explanation of why you chose this visitorType based on the events."
        }
      `;

    const model = ai.getGenerativeModel({
      model: DEFAULT_DEEPSEEK_VISITOR_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const aiResponse = await withAIRetry(() => model.generateContent(prompt));
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

    const fb = fallback();
    await persistFallbackDecision(sessionId, fb, 'Fallback due to invalid AI response payload.');
    return fb;
  } catch (error) {
    if (isQuotaError(error)) {
      quotaBlockedUntil = Date.now() + VISITOR_AI_QUOTA_BACKOFF_MS;
    }

    const compactError = {
      status: typeof (error as { status?: unknown })?.status === 'number' ? (error as { status: number }).status : null,
      message: error instanceof Error ? error.message : String(error),
    };

    console.warn('[VisitorAgent] AI analysis fallback triggered.', compactError);
    await prisma.aiLog.create({
      data: {
        agentName: 'VisitorAgent',
        prompt: 'ERROR_DURING_EXECUTION',
        response: error instanceof Error ? error.message : JSON.stringify(error),
        status: 'error_exception',
        sessionId: sessionId,
      },
    });

    const fb = fallback();
    await persistFallbackDecision(sessionId, fb, 'Fallback due to AI exception (quota or transient error).');
    return fb;
  }
}

export const visitorAgent = {
  analyze: analyzeVisitorSession,
};
