/**
 * Deprecated GET endpoint - redirect to POST.
 * @deprecated Use POST /api/ai/chat/stream instead
 */
import { defineEventHandler } from 'h3';
import { badRequest } from '../../../utils/api-errors';

export default defineEventHandler(() => {
  throw badRequest('Chat stream endpoint now requires POST method with message and history in body. See docs.');
});
