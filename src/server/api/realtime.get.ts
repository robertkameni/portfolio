import {defineEventHandler, getQuery} from 'h3';
import {broadcastService} from '../realtime/broadcast.service';

export default defineEventHandler(async (event) => {
  const {sessionId} = getQuery(event);

  if (!sessionId || typeof sessionId !== 'string') {
    event.node.res.statusCode = 400;
    event.node.res.end('Session ID is required.');
    return;
  }

  // Set headers for Server-Sent Events
  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.setHeader('Connection', 'keep-alive');

  const sendEvent = (eventName: string, data: any) => {
    event.node.res.write(`event: ${eventName}\n`);
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const channel = `realtime:${sessionId}`;

  try {
    // Subscribe to realtime updates for this session
    await broadcastService.subscribe(channel, (data) => {
      sendEvent(data.eventName, data.payload);
    });

    // Send a connection confirmation message
    sendEvent('connected', {message: 'Connection established'});

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;
      void broadcastService.unsubscribe(channel).catch((error) => {
        console.error(`[realtime] unsubscribe failed for channel ${channel}:`, error);
      });
    };

    // Clean up when the client disconnects
    event.node.req.on('close', cleanup);

    // Keep the connection open
    // H3 will automatically handle not closing the response.
  } catch (error) {
    console.error('[realtime] subscription error:', error);
    event.node.res.statusCode = 500;
    event.node.res.end('Realtime service unavailable');
  }
});

/**
 * Push an update to a client session via broadcast service.
 * Can be called from any backend handler.
 */
export async function pushUpdateToClient(targetSessionId: string, eventName: string, payload: any): Promise<void> {
  try {
    await broadcastService.publish({targetSessionId, eventName, payload});
  } catch (error) {
    console.error(`[realtime] push failed for session ${targetSessionId}:`, error);
  }
}
