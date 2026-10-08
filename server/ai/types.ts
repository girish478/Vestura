import type { ImagePayload, TryOnMode, TryOnProviderId } from '../../shared/imageTypes.js';

export type { TryOnMode, TryOnProviderId };

export interface TryOnProvider {
  readonly id: TryOnProviderId;
  readonly mode: TryOnMode;
  generateTryOn(garmentImage: ImagePayload, modelImage: ImagePayload): Promise<string>;
}

export interface ModeStatus {
  mode: TryOnMode;
  provider: TryOnProviderId;
  configured: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthStatusResponse {
  local: ModeStatus;
  cloud: ModeStatus;
  defaultMode: TryOnMode;
}

