import { defineEventHandler, getQuery } from 'h3';
import { EventEmitter } from 'events';

// In a production environment, this should be a more robust, shared event bus (e.g., using Redis Pub/Sub).
// For a single-server instance on Vercel, a simple EventEmitter works for demonstration.
const eventEmitter = new EventEmitter();

export default defineEventHandler((event) => {
  const { sessionId } = getQuery(event);

  if (!sessionId || typeof sessionId !== 'string') {
    event.node.res.statusCode = 400;
    event.node.res.end('Session ID is required.')
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

  const onUpdate = (data: { targetSessionId: string; eventName: string; payload: any }) => {
    if (data.targetSessionId === sessionId) {
      sendEvent(data.eventName, data.payload);
    }
  };

  // Subscribe to our global event emitter
  eventEmitter.on('push-update', onUpdate);

  // Send a connection confirmation message
  sendEvent('connected', { message: 'Connection established' });

  // Clean up when the client disconnects
  event.node.req.on('close', () => {
    eventEmitter.off('push-update', onUpdate);
  });

  // Keep the connection open
  // H3 will automatically handle not closing the response.
});

// Export a function that other backend services can use to push updates.
export function pushUpdateToClient(targetSessionId: string, eventName: string, payload: any) {
  eventEmitter.emit('push-update', { targetSessionId, eventName, payload });
}
