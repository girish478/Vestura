import type { ImageState, TryOnOptions, TryOnProviderId } from '../shared/imageTypes';

export interface ModeStatus {
  mode: 'local' | 'cloud';
  provider: TryOnProviderId;
  configured: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthStatusResponse {
  local: ModeStatus;
  cloud: ModeStatus;
  defaultMode: 'local' | 'cloud';
}

export interface TryOnApiError extends Error {
  code?: string;
  status?: number;
}

async function parseErrorResponse(response: Response): Promise<TryOnApiError> {
  let message = `Request failed (${response.status}).`;
  let code: string | undefined;

  try {
    const body = (await response.json()) as { error?: string; code?: string };
    if (body.error) {
      message = body.error;
    }
    code = body.code;
  } catch {
    // ignore JSON parse error
  }

  const err = new Error(message) as TryOnApiError;
  err.code = code;
  err.status = response.status;
  return err;
}

export async function testCustomEndpoint(apiEndpoint: string, apiKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    const response = await fetch('/api/test-connection', {
      method: 'POST',
      headers,
      body: JSON.stringify({ apiEndpoint, apiKey }),
    });
    if (!response.ok) {
      const err = await parseErrorResponse(response);
      return { success: false, message: err.message };
    }
    const data = (await response.json()) as { success: boolean; message: string };
    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Could not reach server connection endpoint.',
    };
  }
}

export async function fetchApiHealth(options?: {
  localUrl?: string;
  apiKey?: string;
  provider?: TryOnProviderId;
  apiEndpoint?: string;
}): Promise<HealthStatusResponse> {
  const queryParams = new URLSearchParams();
  if (options?.localUrl) queryParams.set('localUrl', options.localUrl);
  if (options?.provider) queryParams.set('provider', options.provider);
  if (options?.apiEndpoint) queryParams.set('apiEndpoint', options.apiEndpoint);

  const headers: Record<string, string> = {};
  if (options?.apiKey) {
    headers['x-api-key'] = options.apiKey;
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await fetch(`/api/health${queryString}`, { headers });
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  const data = (await response.json()) as HealthStatusResponse;
  return data;
}

export async function generateVirtualTryOnImage(
  garmentImage: ImageState,
  modelImage: ImageState,
  options: TryOnOptions,
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = options.mode === 'local' ? 180_000 : 120_000;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.apiKey) {
      headers['x-api-key'] = options.apiKey;
    }
    if (options.apiEndpoint) {
      headers['x-api-endpoint'] = options.apiEndpoint;
    }
    if (options.modelName) {
      headers['x-api-model'] = options.modelName;
    }

    const response = await fetch('/api/try-on', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        garmentImage: { base64: garmentImage.base64, mimeType: garmentImage.mimeType },
        modelImage: { base64: modelImage.base64, mimeType: modelImage.mimeType },
        mode: options.mode,
        provider: options.provider,
        apiKey: options.apiKey,
        apiEndpoint: options.apiEndpoint,
        modelName: options.modelName,
        category: options.category || 'upper_body',
        localUrl: options.localUrl,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data = (await response.json()) as { image?: string };
    if (!data.image) {
      throw new Error('The server returned an empty result image.');
    }

    return data.image;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Generation timed out after ${timeoutMs / 1000} seconds. Try again or check endpoint performance.`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during try-on generation.');
  } finally {
    window.clearTimeout(timeout);
  }
}
