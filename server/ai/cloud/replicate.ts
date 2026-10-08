import type { ImagePayload } from '../../../shared/imageTypes.js';
import type { TryOnProvider } from '../types.js';
import { TryOnError } from '../errors.js';

export function checkReplicateHealth(apiKey?: string): { configured: boolean; message: string } {
  const key = (apiKey || process.env.REPLICATE_API_KEY || '').trim();
  if (!key) {
    return {
      configured: false,
      message: 'Replicate API key is missing. Set REPLICATE_API_KEY or enter your key in Cloud settings.',
    };
  }
  return {
    configured: true,
    message: 'Replicate API VTON provider ready (IDM-VTON / CatVTON models).',
  };
}

export function createReplicateProvider(options: {
  apiKey?: string;
  modelName?: string;
  endpoint?: string;
}): TryOnProvider {
  const apiKey = (options.apiKey || process.env.REPLICATE_API_KEY || '').trim();
  const model = options.modelName?.trim() || process.env.REPLICATE_MODEL?.trim() || 'yisol/idm-vton';
  const endpoint = options.endpoint?.trim() || 'https://api.replicate.com/v1/predictions';

  if (!apiKey) {
    throw new TryOnError(
      'Replicate API Token (r8_...) is required. Add REPLICATE_API_KEY to .env or enter your key in Cloud settings.',
      401,
      'missing_api_key',
    );
  }

  return {
    id: 'replicate',
    mode: 'cloud',
    async generateTryOn(garmentImage: ImagePayload, modelImage: ImagePayload): Promise<string> {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180_000);

        const gUri = `data:${garmentImage.mimeType};base64,${garmentImage.base64}`;
        const mUri = `data:${modelImage.mimeType};base64,${modelImage.base64}`;

        const startRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: model.includes(':') ? model.split(':')[1] : undefined,
            model: model.includes(':') ? undefined : model,
            input: {
              garm_img: gUri,
              human_img: mUri,
              garment_des: 'clothing item try-on',
            },
          }),
          signal: controller.signal,
        });

        if (!startRes.ok) {
          const errText = await startRes.text().catch(() => '');
          throw new TryOnError(`Replicate API returned status ${startRes.status}: ${errText}`, 502, 'replicate_error');
        }

        const prediction = (await startRes.json()) as { id?: string; urls?: { get?: string }; status?: string; output?: string | string[] };
        let current = prediction;
        const getUrl = prediction.urls?.get;

        if (getUrl) {
          while (current.status !== 'succeeded' && current.status !== 'failed' && current.status !== 'canceled') {
            await new Promise((r) => setTimeout(r, 2000));
            const pollRes = await fetch(getUrl, {
              headers: { 'Authorization': `Bearer ${apiKey}` },
              signal: controller.signal,
            });
            if (pollRes.ok) {
              current = (await pollRes.json()) as typeof prediction;
            }
          }
        }

        clearTimeout(timeout);

        if (current.status !== 'succeeded' || !current.output) {
          throw new TryOnError(`Replicate prediction ${current.status || 'failed'}.`, 502, 'prediction_failed');
        }

        const outUrl = Array.isArray(current.output) ? current.output[0] : current.output;
        const imgRes = await fetch(outUrl);
        const arrayBuf = await imgRes.arrayBuffer();
        const b64 = Buffer.from(arrayBuf).toString('base64');
        const mime = imgRes.headers.get('content-type') || 'image/png';

        return `data:${mime};base64,${b64}`;
      } catch (error) {
        if (error instanceof TryOnError) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new TryOnError('Replicate VTON prediction timed out.', 504, 'timeout');
        }
        throw new TryOnError(
          `Replicate provider error: ${error instanceof Error ? error.message : 'Prediction failed'}`,
          502,
          'replicate_failed',
        );
      }
    },
  };
}
