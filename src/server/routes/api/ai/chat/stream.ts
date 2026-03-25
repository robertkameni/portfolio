import {defineEventHandler, getQuery} from 'h3';
import { GenerativeModel } from '@google/generative-ai';
import {getGeminiClient} from "../../../../ai/gemini.client";

export default defineEventHandler(async (event) => {
  // Set headers for Server-Sent Events
  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.setHeader('Connection', 'keep-alive');
  event.node.res.setHeader('X-Accel-Buffering', 'no'); // Wichtig für Nginx/Reverse Proxies, um Buffering zu verhindern

  // Optional: Get query parameters like sessionId and message
  const { sessionId, message } = getQuery(event);

  if (!message) {
    event.node.res.write(`data: ${JSON.stringify({ error: 'No message provided.' })}\n\n`);
    event.node.res.end();
    return;
  }

  console.log(`[SSE] New chat stream request for session: ${sessionId}, message: "${message}"`);

  let model: GenerativeModel;
  try {
    const genAI = getGeminiClient();
    // Wähle das Gemini-Modell. 'gemini-pro' ist ein guter Startpunkt.
    // Für erweiterte Funktionen oder neuere Modelle, siehe Gemini-Dokumentation.
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    event.node.res.write(`data: ${JSON.stringify({ error: 'AI service unavailable. Check server logs.' })}\n\n`);
    event.node.res.end();
    return;
  }

  // TODO: Hier später die Chat-Historie und den Kontext des VisitorStore integrieren
  const chat = model.startChat({
    history: [
      // { role: 'user', parts: [{ text: 'Previous user message' }] },
      // { role: 'model', parts: [{ text: 'Previous AI response' }] },
    ],
    generationConfig: {
      maxOutputTokens: 500, // Begrenze die Ausgabe für Tests
    },
  });

  try {
    const stream = await chat.sendMessageStream(message as string);

    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        event.node.res.write(`data: ${JSON.stringify({ token: chunkText })}\n\n`);

        // Force the chunk through the Vite proxy in development mode
        if (typeof (event.node.res as any).flush === 'function') {
          (event.node.res as any).flush();
        }
      }
    }

    // Tell the client the stream is officially complete
    event.node.res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    event.node.res.end();
    console.log(`[SSE] Chat stream ended for session: ${sessionId}`);

  } catch (error) {
    console.error(`[SSE] Error during Gemini stream:`, error);
    event.node.res.write(`data: ${JSON.stringify({ error: 'Error processing AI response.' })}\n\n`);
    event.node.res.end();
  }

  // Handle client disconnection
  event.node.req.on('close', () => {
    // clearInterval(interval); // 'interval' is no longer defined or needed with Gemini streaming
    console.log(`[SSE] Client disconnected for session: ${sessionId}`);
  });

  return new Promise(() => {});
});
