import { GoogleGenAI, Modality } from '@google/genai';
import type { ImagePayload } from '../../../shared/imageTypes.js';
import type { TryOnProvider } from '../types.js';
import { TryOnError, mapProviderError } from '../errors.js';

const DEFAULT_MODEL = 'gemini-2.5-flash-preview-0514';
const MAX_ATTEMPTS = 3;

const fileToGenerativePart = (image: ImagePayload) => ({
  inlineData: {
    data: image.base64,
    mimeType: image.mimeType,
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status === 502 || status === 504;
}

export function checkGeminiHealth(apiKeyOverride?: string): { configured: boolean; message: string } {
  const key = (apiKeyOverride || process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    return {
      configured: false,
      message: 'Gemini API key is missing. Set GEMINI_API_KEY in server environment or enter key in Cloud mode settings.',
    };
  }
  return {
    configured: true,
    message: 'Gemini Cloud VTON backend ready.',
  };
}

export function createGeminiProvider(apiKeyOverride?: string): TryOnProvider {
  const apiKey = (apiKeyOverride || process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    throw new TryOnError(
      'Gemini API key is required for Cloud mode. Set GEMINI_API_KEY in .env or provide your API key in the Cloud settings UI.',
      401,
      'missing_api_key',
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  return {
    id: 'gemini',
    mode: 'cloud',
    async generateTryOn(garmentImage: ImagePayload, modelImage: ImagePayload): Promise<string> {
      const prompt =
        'You are a high-fidelity virtual clothing try-on AI application. ' +
        'You will receive two input images: (1) a photo of a person (the model) and (2) a photo of a garment item. ' +
        'Your task is to generate a realistic, photorealistic image of the person from image 1 wearing the exact garment item from image 2.' +
        '\n\nStrict Requirements:' +
        '\n- Preserve identity: Keep the person\'s exact face, expression, hair, body shape, skin tone, and features identical to image 1.' +
        '\n- Garment fidelity: Accurately transfer the garment\'s color, texture, fabric pattern, folds, collar, buttons, and design elements from image 2.' +
        '\n- Fit & Pose: Fit the garment naturally onto the person\'s body following their exact original pose and proportions.' +
        '\n- Clean composition: Keep background consistent with image 1 or place person on a simple clean backdrop.' +
        '\n- Do NOT modify the person\'s face, background environment unnaturally, or introduce random accessories.' +
        '\n- Return ONLY the composed try-on image result.';

      let lastError: unknown;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: {
              parts: [{ text: prompt }, fileToGenerativePart(garmentImage), fileToGenerativePart(modelImage)],
            },
            config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
          });

          const candidate = response.candidates?.[0];
          const parts = candidate?.content?.parts ?? [];

          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData.data) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }

          throw new TryOnError(
            'The Cloud AI model completed the request but did not return a valid try-on image. Please try again with clear photos.',
            502,
            'empty_response',
          );
        } catch (error) {
          lastError = error;
          const mapped = mapProviderError(error);
          if (attempt < MAX_ATTEMPTS && isRetryableStatus(mapped.statusCode)) {
            await sleep(500 * 2 ** (attempt - 1));
            continue;
          }
          throw mapped;
        }
      }

      throw mapProviderError(lastError);
    },
  };
}
