export interface ImagePayload {
  base64: string;
  mimeType: string;
}

export interface ImageState extends ImagePayload {
  previewUrl: string;
}

export type TryOnMode = 'local' | 'cloud';

export type TryOnProviderId =
  | 'catvton'       // Local CatVTON
  | 'gemini'        // Cloud Google Gemini
  | 'replicate'     // Cloud Replicate (CatVTON/IDM-VTON)
  | 'huggingface'   // Cloud HuggingFace Inference
  | 'custom';       // Cloud Custom Endpoint

export type GarmentCategory = 'upper_body' | 'lower_body' | 'dresses' | 'auto';

export interface CustomProviderConfig {
  name: string;
  endpoint: string;
  apiKey?: string;
  model?: string;
  category?: GarmentCategory;
}

export interface TryOnOptions {
  mode: TryOnMode;
  provider: TryOnProviderId;
  apiKey?: string;
  apiEndpoint?: string;
  modelName?: string;
  category?: GarmentCategory;
  localUrl?: string;
  customConfig?: CustomProviderConfig;
}

export interface ProviderMeta {
  id: TryOnProviderId;
  name: string;
  type: 'vton' | 'image_gen';
  badgeLabel: string;
  description: string;
  requiresApiKey: boolean;
  defaultModel?: string;
  defaultEndpoint?: string;
}

export const CLOUD_PROVIDERS_META: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'vton',
    badgeLabel: 'VTON Native',
    description: 'Native multimodal image-to-image try-on with identity & garment transfer.',
    requiresApiKey: true,
    defaultModel: 'gemini-2.5-flash-preview-0514',
  },
  {
    id: 'replicate',
    name: 'Replicate API (IDM-VTON / CatVTON)',
    type: 'vton',
    badgeLabel: 'VTON Native',
    description: 'Dedicated open-source VTON models hosted on Replicate cloud inference.',
    requiresApiKey: true,
    defaultEndpoint: 'https://api.replicate.com/v1/predictions',
  },
  {
    id: 'huggingface',
    name: 'HuggingFace Inference API',
    type: 'vton',
    badgeLabel: 'VTON Native',
    description: 'Cloud inference endpoint for HuggingFace Space VTON models.',
    requiresApiKey: true,
  },
  {
    id: 'custom',
    name: 'Custom VTON API',
    type: 'vton',
    badgeLabel: 'Custom VTON',
    description: 'Connect your own cloud VTON service with custom endpoint, key & garment category.',
    requiresApiKey: false,
  },
];
