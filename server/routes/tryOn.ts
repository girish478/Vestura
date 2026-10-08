import { Router } from 'express';
import { validateImagePayload } from '../../shared/imageValidation.js';
import type { ImagePayload, TryOnMode, TryOnProviderId, GarmentCategory } from '../../shared/imageTypes.js';
import { createTryOnProvider, getSystemHealthStatus, testCustomConnection } from '../ai/provider.js';
import { TryOnError, mapProviderError } from '../ai/errors.js';

export const tryOnRouter = Router();

tryOnRouter.get('/health', async (req, res) => {
  const localUrl = req.query.localUrl as string | undefined;
  const customKey = req.headers['x-api-key'] as string | undefined;
  const provider = req.query.provider as TryOnProviderId | undefined;
  const apiEndpoint = req.query.apiEndpoint as string | undefined;

  const status = await getSystemHealthStatus({ localUrl, apiKey: customKey, provider, apiEndpoint });
  res.json(status);
});

tryOnRouter.post('/test-connection', async (req, res) => {
  const { apiEndpoint, apiKey } = req.body as { apiEndpoint?: string; apiKey?: string };
  const headerApiKey = req.headers['x-api-key'] as string | undefined;
  const headerEndpoint = req.headers['x-api-endpoint'] as string | undefined;

  const result = await testCustomConnection(
    apiEndpoint || headerEndpoint,
    apiKey || headerApiKey,
  );
  res.json(result);
});

tryOnRouter.post('/try-on', async (req, res) => {
  try {
    const {
      garmentImage,
      modelImage,
      mode = 'cloud',
      provider: providerId = 'gemini',
      apiKey,
      apiEndpoint,
      modelName,
      category = 'upper_body',
      localUrl,
    } = req.body as {
      garmentImage?: ImagePayload;
      modelImage?: ImagePayload;
      mode?: TryOnMode;
      provider?: TryOnProviderId;
      apiKey?: string;
      apiEndpoint?: string;
      modelName?: string;
      category?: GarmentCategory;
      localUrl?: string;
    };

    const headerApiKey = req.headers['x-api-key'] as string | undefined;
    const headerEndpoint = req.headers['x-api-endpoint'] as string | undefined;
    const headerModel = req.headers['x-api-model'] as string | undefined;

    const effectiveApiKey = (apiKey || headerApiKey)?.trim();
    const effectiveEndpoint = (apiEndpoint || headerEndpoint)?.trim();
    const effectiveModel = (modelName || headerModel)?.trim();

    if (!garmentImage || !modelImage) {
      throw new TryOnError('Both garment photo and person photo are required.', 400, 'missing_images');
    }

    const garmentError = validateImagePayload(garmentImage);
    if (garmentError) {
      throw new TryOnError(`Garment image validation failed: ${garmentError}`, 400, 'invalid_garment');
    }

    const modelError = validateImagePayload(modelImage);
    if (modelError) {
      throw new TryOnError(`Person image validation failed: ${modelError}`, 400, 'invalid_model');
    }

    const providerInstance = createTryOnProvider({
      mode,
      provider: providerId,
      apiKey: effectiveApiKey,
      apiEndpoint: effectiveEndpoint,
      modelName: effectiveModel,
      category,
      localUrl,
    });

    const resultImage = await providerInstance.generateTryOn(garmentImage, modelImage);

    res.json({ image: resultImage, mode, provider: providerId });
  } catch (error) {
    const mapped = mapProviderError(error);
    res.status(mapped.statusCode).json({
      error: mapped.message,
      code: mapped.code,
    });
  }
});
