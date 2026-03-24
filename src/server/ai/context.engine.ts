import { prisma } from '../db/client';

/**
 * The Context Engine is responsible for gathering and summarizing all relevant
 * data for a given session to provide rich context to AI agents.
 */
export const contextEngine = {
  /**
   * Gathers all analytics events for a session and formats them into a
   * chronological summary string, perfect for inclusion in an AI prompt.
   * @param sessionId The UUID of the visitor session.
   * @returns A formatted string detailing the user's journey.
   */
  async getSessionHistoryAsText(sessionId: string): Promise<string> {
    const events = await prisma.analyticsEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    if (events.length === 0) {
      return 'No activity recorded for this session.';
    }

    const session = await prisma.visitorSession.findUnique({
      where: { id: sessionId },
    });

    const summaryLines: string[] = [];
    if (session) {
      summaryLines.push(`- Session started at ${session.startedAt.toISOString()}.`);
      if (session.initialReferrer) {
        summaryLines.push(`- Arrived from: ${session.initialReferrer}`);
      }
    }

    summaryLines.push('\nUser Journey:');
    events.forEach((event, index) => {
      let line = `${index + 1}. Event: '${event.eventType}'`;
      if (event.payload && typeof event.payload === 'object') {
        const payloadString = Object.entries(event.payload)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (payloadString) {
          line += ` | Details: { ${payloadString} }`;
        }
      }
      summaryLines.push(line);
    });

    return summaryLines.join('\n');
  },
};
