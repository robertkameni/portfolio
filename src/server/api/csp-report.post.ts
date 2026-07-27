import { defineEventHandler, readBody, setResponseStatus } from 'h3';

type CspReportBody = {
  'csp-report'?: Record<string, unknown>;
  type?: string;
  url?: string;
  body?: Record<string, unknown>;
};

/**
 * Receives Content-Security-Policy-Report-Only violation reports.
 * Monitor these logs before tightening the enforced CSP in vercel.json.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as CspReportBody | null;
    const report = body?.['csp-report'] ?? body?.body ?? body;

    console.warn('[CSP Report-Only]', {
      documentUri: report && typeof report === 'object' ? (report as Record<string, unknown>)['document-uri'] : undefined,
      violatedDirective: report && typeof report === 'object' ? (report as Record<string, unknown>)['violated-directive'] : undefined,
      blockedUri: report && typeof report === 'object' ? (report as Record<string, unknown>)['blocked-uri'] : undefined,
      sourceFile: report && typeof report === 'object' ? (report as Record<string, unknown>)['source-file'] : undefined,
      lineNumber: report && typeof report === 'object' ? (report as Record<string, unknown>)['line-number'] : undefined,
      raw: report,
    });
  } catch (error) {
    console.warn('[CSP Report-Only] Failed to parse report payload.', error);
  }

  setResponseStatus(event, 204);
  return null;
});
