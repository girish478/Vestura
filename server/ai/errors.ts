export class TryOnError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 500,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'TryOnError';
  }
}

export function mapProviderError(error: unknown): TryOnError {
  if (error instanceof TryOnError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Invalid / missing API key
  if (
    lower.includes('api key') &&
    (lower.includes('invalid') || lower.includes('not valid') || lower.includes('not authorized'))
  ) {
    return new TryOnError(
      'The Gemini API key is invalid or unauthorised. Check GEMINI_API_KEY in your .env file.',
      401,
      'invalid_api_key',
    );
  }

  // Forbidden (key lacking permissions)
  if (lower.includes('permission') || lower.includes('forbidden') || lower.includes('403')) {
    return new TryOnError(
      'API request forbidden. Check that your GEMINI_API_KEY has access to image generation models.',
      403,
      'forbidden',
    );
  }

  // Quota / rate limiting
  if (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('429')
  ) {
    return new TryOnError(
      'API quota exceeded or rate limit reached. Wait a moment and try again.',
      429,
      'quota_exceeded',
    );
  }

  // Timeout / deadline
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('deadline')) {
    return new TryOnError(
      'The request timed out. Try again with smaller images, or try later when the API is less busy.',
      504,
      'timeout',
    );
  }

  // Network / connectivity
  if (
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('socket')
  ) {
    return new TryOnError(
      'Could not reach the AI service. Check your network connection and try again.',
      503,
      'network_error',
    );
  }

  // Service unavailable
  if (lower.includes('service unavailable') || lower.includes('503') || lower.includes('overloaded')) {
    return new TryOnError(
      'The AI service is temporarily unavailable or overloaded. Try again in a moment.',
      503,
      'service_unavailable',
    );
  }

  // Safety / content filter
  if (lower.includes('safety') || lower.includes('blocked') || lower.includes('recitation')) {
    return new TryOnError(
      'The request was blocked by the AI safety filter. Try different images.',
      400,
      'safety_blocked',
    );
  }

  return new TryOnError(
    'Image generation failed. The service may be busy or the images could not be processed. Try again.',
    502,
    'generation_failed',
  );
}
