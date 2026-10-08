import { createCatVtonProvider, checkCatVtonHealth } from './local/catvton.js';
import { createGeminiProvider, checkGeminiHealth } from './cloud/gemini.js';
import { createCustomProvider, checkCustomHealth, testCustomConnection } from './cloud/custom.js';
import { createReplicateProvider, checkReplicateHealth } from './cloud/replicate.js';
import type { HealthStatusResponse, TryOnProvider } from './types.js';
import type { TryOnOptions, TryOnMode, TryOnProviderId } from '../../shared/imageTypes.js';
import { TryOnError } from './errors.js';

export { testCustomConnection };

export async function getSystemHealthStatus(options?: Partial<TryOnOptions>): Promise<HealthStatusResponse> {
  const localHealth = await checkCatVtonHealth(options?.localUrl);
  
  let cloudHealth = checkGeminiHealth(options?.apiKey);
  if (options?.provider === 'custom') {
    cloudHealth = checkCustomHealth(options?.apiEndpoint);
  } else if (options?.provider === 'replicate' || options?.provider === 'huggingface') {
    cloudHealth = checkReplicateHealth(options?.apiKey);
  }

  const defaultMode: TryOnMode =
    (process.env.AI_MODE as TryOnMode) || (cloudHealth.configured ? 'cloud' : 'local');

  return {
    local: {
      mode: 'local',
      provider: 'catvton',
      configured: localHealth.configured,
      message: localHealth.message,
      details: { url: localHealth.url },
    },
    cloud: {
      mode: 'cloud',
      provider: options?.provider || (process.env.AI_PROVIDER as TryOnProviderId) || 'gemini',
      configured: cloudHealth.configured,
      message: cloudHealth.message,
    },
    defaultMode,
  };
}

export function createTryOnProvider(options: Partial<TryOnOptions> = {}): TryOnProvider {
  const mode: TryOnMode = options.mode || (process.env.AI_MODE as TryOnMode) || 'cloud';

  if (mode === 'local') {
    return createCatVtonProvider(options.localUrl);
  }

  if (mode === 'cloud') {
    const providerId: TryOnProviderId =
      options.provider || (process.env.AI_PROVIDER as TryOnProviderId) || 'gemini';

    if (providerId === 'gemini') {
      return createGeminiProvider(options.apiKey);
    }
    if (providerId === 'replicate' || providerId === 'huggingface') {
      return createReplicateProvider({
        apiKey: options.apiKey,
        modelName: options.modelName,
        endpoint: options.apiEndpoint,
      });
    }
    if (providerId === 'custom') {
      return createCustomProvider({
        endpoint: options.apiEndpoint,
        apiKey: options.apiKey,
        modelName: options.modelName,
        category: options.category,
      });
    }

    throw new TryOnError(
      `Unsupported Cloud provider "${providerId}". Currently supported cloud providers: gemini, replicate, huggingface, custom.`,
      400,
      'unsupported_provider',
    );
  }

  throw new TryOnError(`Invalid mode "${mode}". Supported modes: "local" or "cloud".`, 400, 'invalid_mode');
}
