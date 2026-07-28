import type { H3Event } from 'h3';

type StreamOptions = {
  onCompleted?: () => void;
};

function writeSseData(event: H3Event, payload: unknown, flush = false): void {
  event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`);

  if (flush && typeof (event.node.res as unknown as { flush?: () => void }).flush === 'function') {
    (event.node.res as unknown as { flush: () => void }).flush();
  }
}

function endSse(event: H3Event): void {
  if (!event.node.res.writableEnded) {
    event.node.res.end();
  }
}

const FALLBACK_MESSAGE = [
  'Online-Terminbuchung ist gerade nicht verfügbar.',
  'Bitte nutze das Kontaktformular unter /contact oder schreib mir direkt an robertkameni83@gmail.com — dann stimmen wir einen Termin manuell ab.',
  'Ich kann hier keine Kalendereinladung versenden.',
].join('\n\n');

export async function streamSchedulingFallbackResponse(event: H3Event, options: StreamOptions = {}): Promise<boolean> {
  writeSseData(event, { ready: true }, true);

  const chunkSize = 24;
  for (let index = 0; index < FALLBACK_MESSAGE.length; index += chunkSize) {
    writeSseData(event, { token: FALLBACK_MESSAGE.slice(index, index + chunkSize) }, true);
  }

  writeSseData(event, { done: true });
  options.onCompleted?.();
  endSse(event);
  return true;
}
