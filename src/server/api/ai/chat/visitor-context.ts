import { prisma } from '../../../db/client';
import type { VisitorProfileAnalysis } from '../../../ai/agents/visitor.agent';

export async function resolveVisitorContextString(sessionId: string | undefined, logPrefix: string): Promise<string> {
  if (typeof sessionId !== 'string') {
    return '';
  }

  try {
    const session = await prisma.visitorSession.findUnique({
      where: { clientSessionId: sessionId },
      include: { visitor: { include: { profile: true } } },
    });

    if (!session?.visitor?.profile?.profileData) {
      return '';
    }

    const profile = session.visitor.profile.profileData as VisitorProfileAnalysis;
    const interests = Array.isArray(profile.interests) && profile.interests.length ? profile.interests.join(', ') : 'none detected';

    return `VISITOR CONTEXT: visitorType=${profile.visitorType ?? 'unknown'}; interests=${interests}. Adapt examples and priorities to this audience.`;
  } catch (error) {
    console.error(`${logPrefix}:`, error);
    return '';
  }
}
