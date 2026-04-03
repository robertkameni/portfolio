import { createError } from 'h3';

type ApiErrorLike = {
  statusCode?: number;
  statusMessage?: string;
  data?: unknown;
};

type ApiErrorData = {
  status: 'error';
  message: string;
  code: string;
};

function buildErrorData(message: string, code: string): ApiErrorData {
  return {
    status: 'error',
    message,
    code,
  };
}

export function badRequest(statusMessage: string, code = 'BAD_REQUEST') {
  return createError({ statusCode: 400, statusMessage, data: buildErrorData(statusMessage, code) });
}

export function unauthorized(statusMessage: string, code = 'UNAUTHORIZED') {
  return createError({ statusCode: 401, statusMessage, data: buildErrorData(statusMessage, code) });
}

export function forbidden(statusMessage: string, code = 'FORBIDDEN') {
  return createError({ statusCode: 403, statusMessage, data: buildErrorData(statusMessage, code) });
}

export function notFound(statusMessage: string, code = 'NOT_FOUND') {
  return createError({ statusCode: 404, statusMessage, data: buildErrorData(statusMessage, code) });
}

export function serverError(statusMessage: string, code = 'INTERNAL_SERVER_ERROR') {
  return createError({ statusCode: 500, statusMessage, data: buildErrorData(statusMessage, code) });
}

export function mapApiError(error: unknown, fallbackStatusMessage: string, fallbackStatusCode = 500, fallbackCode = 'INTERNAL_SERVER_ERROR') {
  const maybeApiError = (error ?? {}) as ApiErrorLike;

  if (typeof maybeApiError.statusCode === 'number' && typeof maybeApiError.statusMessage === 'string') {
    return createError({
      statusCode: maybeApiError.statusCode,
      statusMessage: maybeApiError.statusMessage,
      data: maybeApiError.data,
    });
  }

  return createError({
    statusCode: fallbackStatusCode,
    statusMessage: fallbackStatusMessage,
    data: buildErrorData(fallbackStatusMessage, fallbackCode),
  });
}

type ApiErrorHandlingOptions = {
  fallbackStatusCode?: number;
  logMessage?: string;
  fallbackCode?: string;
};

export async function withApiErrorHandling<T>(
  operation: () => Promise<T>,
  fallbackStatusMessage: string,
  options: ApiErrorHandlingOptions = {}
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (options.logMessage) {
      console.error(options.logMessage, error);
    }

    throw mapApiError(error, fallbackStatusMessage, options.fallbackStatusCode ?? 500, options.fallbackCode ?? 'INTERNAL_SERVER_ERROR');
  }
}

