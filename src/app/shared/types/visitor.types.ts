// This type definition is shared between the frontend and the backend AI agents.
// It represents the structured output of the VisitorIntelligenceAgent.
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
