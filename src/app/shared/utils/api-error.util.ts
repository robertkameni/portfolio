export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const candidate = error as {
    message?: string;
    error?: {
      data?: {
        message?: string;
      };
      message?: string;
      statusMessage?: string;
    };
  };

  return candidate?.error?.data?.message || candidate?.error?.message || candidate?.error?.statusMessage || candidate?.message || fallback;
}

