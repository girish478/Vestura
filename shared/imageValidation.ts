import type { ImagePayload } from './imageTypes.js';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Unsupported format. Use JPEG, PNG, or WebP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Image is too large. Maximum size is ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`;
  }
  if (file.size === 0) {
    return 'The selected file is empty.';
  }
  return null;
}

export function validateImagePayload(image: ImagePayload): string | null {
  if (!image.base64?.trim()) {
    return 'Image data is missing.';
  }
  if (!ALLOWED_MIME_TYPES.includes(image.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Unsupported image type.';
  }
  const approximateBytes = Math.ceil((image.base64.length * 3) / 4);
  if (approximateBytes > MAX_IMAGE_BYTES) {
    return `Image is too large. Maximum size is ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}
