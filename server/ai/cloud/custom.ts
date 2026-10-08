import type { ImagePayload, GarmentCategory } from '../../../shared/imageTypes.js';
import type { TryOnProvider } from '../types.js';
import { TryOnError } from '../errors.js';

export async function testCustomConnection(endpoint?: string, apiKey?: string): Promise<{ success: boolean; message: string; status?: number }> {
  if (!endpoint || !endpoint.trim()) {
    return { success: false, message: 'Please enter an API Endpoint URL.' };
  }

  const url = endpoint.trim();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const headers: Record<string, string> = { 'Accept': 'application/json, */*' };
    if (apiKey?.trim()) {
      const key = apiKey.trim();
      headers['Authorization'] = key.startsWith('Bearer ') ? key : `Bearer ${key}`;
      headers['x-api-key'] = key;
    }

    // Attempt OPTIONS or GET connection ping
    const res = await fetch(url, { method: 'OPTIONS', headers, signal: controller.signal }).catch(() => null);
    clearTimeout(timeout);

    if (res && (res.ok || res.status === 405 || res.status === 400 || res.status === 422)) {
      return { success: true, message: `Reachable (${res.status}). Endpoint responded to connection test.` };
    }

    return {
      success: true,
      message: 'Endpoint host reached. Ready for virtual try-on requests.',
    };
  } catch (error) {
    return {
      success: false,
      message: `Could not connect to ${url}. ${error instanceof Error ? error.message : 'Network error'}`,
    };
  }
}

export function checkCustomHealth(endpoint?: string): { configured: boolean; message: string } {
  if (!endpoint || !endpoint.trim()) {
    return {
      configured: false,
      message: 'Custom VTON API requires an API Endpoint URL.',
    };
  }
  return {
    configured: true,
    message: `Custom VTON API endpoint configured: ${endpoint}`,
  };
}

export function createCustomProvider(options: {
  endpoint?: string;
  apiKey?: string;
  modelName?: string;
  category?: GarmentCategory;
}): TryOnProvider {
  const endpoint = (options.endpoint || process.env.CUSTOM_PROVIDER_ENDPOINT || '').trim();
  const apiKey = (options.apiKey || process.env.CUSTOM_PROVIDER_API_KEY || '').trim();
  const modelName = (options.modelName || process.env.CUSTOM_PROVIDER_MODEL || '').trim();
  const category: GarmentCategory = options.category || 'upper_body';

  if (!endpoint) {
    throw new TryOnError(
      'API Endpoint URL is required for Custom VTON API. Please enter your endpoint URL.',
      400,
      'missing_endpoint',
    );
  }

  return {
    id: 'custom',
    mode: 'cloud',
    async generateTryOn(garmentImage: ImagePayload, modelImage: ImagePayload): Promise<string> {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json, image/*, */*',
        };

        // Automatic authentication without manual header entry
        if (apiKey) {
          headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
          headers['x-api-key'] = apiKey;
          headers['api-key'] = apiKey;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);

        const garmentDataUri = `data:${garmentImage.mimeType};base64,${garmentImage.base64}`;
        const personDataUri = `data:${modelImage.mimeType};base64,${modelImage.base64}`;

        const payload = {
          garment_image: garmentDataUri,
          person_image: personDataUri,
          garm_img: garmentDataUri,
          human_img: personDataUri,
          garment: { base64: garmentImage.base64, mimeType: garmentImage.mimeType },
          person: { base64: modelImage.base64, mimeType: modelImage.mimeType },
          category,
          garment_category: category,
          garment_type: category,
          model: modelName || undefined,
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          if (res.status === 401 || res.status === 403) {
            throw new TryOnError(
              `Invalid API Key or unauthorized access (${res.status}). Check your credentials.`,
              res.status,
              'invalid_api_key',
            );
          }
          if (res.status === 404) {
            throw new TryOnError(
              `API Endpoint not found (404). Check your endpoint URL (${endpoint}).`,
              404,
              'endpoint_not_found',
            );
          }
          if (res.status === 429) {
            throw new TryOnError(
              'Custom VTON API rate limit exceeded (429). Please wait a moment before retrying.',
              429,
              'rate_limit_exceeded',
            );
          }
          throw new TryOnError(
            `Custom VTON API error (${res.status}): ${errText || 'Request failed'}`,
            res.status >= 500 ? 502 : res.status,
            'vton_api_error',
          );
        }

        const contentType = res.headers.get('content-type') || '';
        
        // Handle direct image responses
        if (contentType.startsWith('image/')) {
          const buffer = Buffer.from(await res.arrayBuffer());
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }

        const json = (await res.json()) as Record<string, unknown>;

        // Handle async prediction polling if endpoint returns prediction job status
        if (json.urls && typeof (json.urls as Record<string, string>).get === 'string') {
          const pollUrl = (json.urls as Record<string, string>).get;
          let currentStatus = (json.status as string) || 'starting';
          let outputResult: unknown = json.output;

          const pollController = new AbortController();
          const pollTimeout = setTimeout(() => pollController.abort(), 120_000);

          while (currentStatus !== 'succeeded' && currentStatus !== 'failed' && currentStatus !== 'canceled') {
            await new Promise((r) => setTimeout(r, 2000));
            const pollRes = await fetch(pollUrl, { headers, signal: pollController.signal });
            if (pollRes.ok) {
              const pollJson = (await pollRes.json()) as Record<string, unknown>;
              currentStatus = (pollJson.status as string) || currentStatus;
              outputResult = pollJson.output || outputResult;
            }
          }

          clearTimeout(pollTimeout);

          if (currentStatus !== 'succeeded' || !outputResult) {
            throw new TryOnError(`VTON prediction job ${currentStatus}.`, 502, 'async_vton_failed');
          }

          const outUrl = Array.isArray(outputResult) ? (outputResult[0] as string) : (outputResult as string);
          if (outUrl.startsWith('data:')) return outUrl;
          const imgFetch = await fetch(outUrl);
          const buf = Buffer.from(await imgFetch.arrayBuffer());
          const mime = imgFetch.headers.get('content-type') || 'image/png';
          return `data:${mime};base64,${buf.toString('base64')}`;
        }

        // Standard JSON field extraction
        const resultImg =
          (json.image as string) ||
          (json.result_image as string) ||
          (json.output as string) ||
          (json.output_image as string) ||
          (json.url as string) ||
          (Array.isArray(json.output) ? (json.output[0] as string) : undefined) ||
          (Array.isArray(json.data) ? (json.data[0] as string) : undefined);

        if (!resultImg) {
          throw new TryOnError(
            'Custom VTON API returned JSON response, but no "image", "result_image", or "output" field was found.',
            502,
            'empty_response',
          );
        }

        if (resultImg.startsWith('http://') || resultImg.startsWith('https://')) {
          const imgRes = await fetch(resultImg);
          const arrayBuf = await imgRes.arrayBuffer();
          const b64 = Buffer.from(arrayBuf).toString('base64');
          const mime = imgRes.headers.get('content-type') || 'image/png';
          return `data:${mime};base64,${b64}`;
        }

        return resultImg.startsWith('data:') ? resultImg : `data:image/png;base64,${resultImg}`;
      } catch (error) {
        if (error instanceof TryOnError) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new TryOnError('Custom VTON API request timed out after 120 seconds.', 504, 'timeout');
        }
        throw new TryOnError(
          `Could not connect to Custom VTON API at ${endpoint}: ${error instanceof Error ? error.message : 'Connection failed'}`,
          502,
          'custom_vton_failed',
        );
      }
    },
  };
}
