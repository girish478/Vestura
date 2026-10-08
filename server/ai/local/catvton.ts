import type { ImagePayload } from '../../../shared/imageTypes.js';
import type { TryOnProvider } from '../types.js';
import { TryOnError } from '../errors.js';

const DEFAULT_LOCAL_URL = 'http://127.0.0.1:7860';

export function getLocalVtonUrl(customUrl?: string): string {
  const envUrl = process.env.LOCAL_VTON_URL?.trim();
  const url = (customUrl?.trim() || envUrl || DEFAULT_LOCAL_URL).replace(/\/+$/, '');
  return url;
}

export async function checkCatVtonHealth(customUrl?: string): Promise<{ configured: boolean; message: string; url: string }> {
  const url = getLocalVtonUrl(customUrl);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    // Check health endpoint or index of local VTON server
    const res = await fetch(`${url}/health`, { signal: controller.signal }).catch(() => null);
    clearTimeout(timeout);

    if (res && res.ok) {
      return {
        configured: true,
        message: `Local VTON server detected and ready at ${url}.`,
        url,
      };
    }

    return {
      configured: false,
      message: `Local VTON model requires a local GPU server running at ${url}. Start local server via python scripts/local_vton_server.py or specify your local server URL.`,
      url,
    };
  } catch {
    return {
      configured: false,
      message: `Local VTON server at ${url} is offline. Hardware requirement: NVIDIA GPU (8GB+ VRAM recommended).`,
      url,
    };
  }
}

export function createCatVtonProvider(customUrl?: string): TryOnProvider {
  const localUrl = getLocalVtonUrl(customUrl);

  return {
    id: 'catvton',
    mode: 'local',
    async generateTryOn(garmentImage: ImagePayload, modelImage: ImagePayload): Promise<string> {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180_000); // 3 min timeout for local GPU inference

        const res = await fetch(`${localUrl}/api/try-on`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            garment_image: `data:${garmentImage.mimeType};base64,${garmentImage.base64}`,
            person_image: `data:${modelImage.mimeType};base64,${modelImage.base64}`,
            garment: { base64: garmentImage.base64, mimeType: garmentImage.mimeType },
            person: { base64: modelImage.base64, mimeType: modelImage.mimeType },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          throw new TryOnError(
            `Local VTON server returned error (${res.status}): ${errorText || 'Generation failed'}`,
            502,
            'local_inference_error',
          );
        }

        const data = (await res.json()) as { image?: string; result_image?: string; output?: string };
        const resultImage = data.image || data.result_image || data.output;

        if (!resultImage) {
          throw new TryOnError(
            'Local VTON server completed execution but returned no output image.',
            502,
            'empty_response',
          );
        }

        return resultImage.startsWith('data:') ? resultImage : `data:image/png;base64,${resultImage}`;
      } catch (error) {
        if (error instanceof TryOnError) {
          throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new TryOnError(
            'Local VTON generation timed out. Ensure your GPU has sufficient VRAM (8GB+ recommended).',
            504,
            'timeout',
          );
        }

        throw new TryOnError(
          `Could not connect to Local VTON server at ${localUrl}. Make sure your local PyTorch/CatVTON worker is running. (Details: ${error instanceof Error ? error.message : 'Connection failed'})`,
          503,
          'local_server_offline',
        );
      }
    },
  };
}
