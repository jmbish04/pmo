// Error handling utility for converting unknown errors to Error objects

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function safeLogError(message: string, error: unknown): void {
  console.error(message, toError(error));
}

export function safeLogWarn(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
}

export function safeLogInfo(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.info(message, data);
  } else {
    console.info(message);
  }
} 