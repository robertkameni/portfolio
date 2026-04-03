/**
 * Deprecated GET endpoint - redirect to POST.
 * @deprecated Use POST /api/ai/chat/stream instead
 */
import { defineEventHandler, createError } from 'h3';

export default defineEventHandler((event) => {
  throw createError({
    statusCode: 400,
    statusMessage: 'Chat stream endpoint now requires POST method with message and history in body. See docs.',
  });
});

