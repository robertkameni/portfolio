import { defineEventHandler, getQuery } from 'h3';
import { GenerativeModel } from '@google/generative-ai';
import { getGeminiClient } from '../../../../ai/gemini.client';
import { prisma } from '../../../../db/client';

export default defineEventHandler(async (event) => {
  event.node.res.setHeader('Content-Type', 'text/event-stream');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.setHeader('Connection', 'keep-alive');
  event.node.res.setHeader('X-Accel-Buffering', 'no');

  const { sessionId, message, history } = getQuery(event);

  if (!message || typeof message !== 'string') {
    event.node.res.write(`data: ${JSON.stringify({ error: 'No message provided.' })}\n\n`);
    event.node.res.end();
    return;
  }

  let model: GenerativeModel;
  try {
    const genAI = getGeminiClient();
    model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are the Digital Twin of Lucas Robert Kameni, a Senior Angular Developer. Answer questions as if you are him. Be professional, concise, and helpful.',
    });
  } catch (error) {
    event.node.res.write(`data: ${JSON.stringify({ error: 'AI service unavailable.' })}\n\n`);
    event.node.res.end();
    return;
  }

  // 1. Parse the history passed from the frontend
  let parsedHistory: any[] = [];
  if (typeof history === 'string') {
    try {
      parsedHistory = JSON.parse(history);
    } catch (e) {
      console.error('[SSE] Failed to parse chat history:', e);
    }
  }

  // 2. Fetch the Visitor Profile to give the AI context
  let visitorContextString = '';
  if (sessionId && typeof sessionId === 'string') {
    try {
      const session = await prisma.visitorSession.findUnique({
        where: { clientSessionId: sessionId },
        include: { visitor: { include: { profile: true } } },
      });

      if (session?.visitor?.profile?.profileData) {
        const profile = session.visitor.profile.profileData as any;
        visitorContextString = `\n\nIMPORTANT CONTEXT ABOUT THE USER ASKING THE QUESTION:\nThe user is classified as a: "${profile.visitorType}".\nTheir inferred interests based on website navigation are: ${profile.interests?.join(', ')}.\nTailor your response to appeal to this specific type of user.`;

        // Inject this context into the system instruction for this specific run
        model = getGeminiClient().getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: `You are the Digital Twin of Lucas Robert Kameni, a Senior Angular Developer. Answer questions as if you are him. Be professional, concise, and helpful.${visitorContextString}`,
        });
      }
    } catch (e) {
      console.error('[SSE] Failed to fetch visitor profile for context:', e);
    }
  }

  const chat = model.startChat({
    history: parsedHistory,
    generationConfig: {
      maxOutputTokens: 800,
    },
  });

  try {
    const stream = await chat.sendMessageStream(message);

    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        event.node.res.write(`data: ${JSON.stringify({ token: chunkText })}\n\n`);

        if (typeof (event.node.res as any).flush === 'function') {
          (event.node.res as any).flush();
        }
      }
    }

    event.node.res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    event.node.res.end();
  } catch (error) {
    event.node.res.write(`data: ${JSON.stringify({ error: 'Error processing AI response.' })}\n\n`);
    event.node.res.end();
  }

  event.node.req.on('close', () => {
    // Client disconnected
  });

  return new Promise(() => {});
});
