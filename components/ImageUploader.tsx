
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageState } from '../types';
import { validateImageFile } from '../shared/imageValidation';

interface ImageUploaderProps {
  id: string;
  step: number;
  label: string;
  description: string;
  onImageUpload: (imageState: ImageState | null) => void;
  icon: React.ReactNode;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  id,
  step,
  label,
  description,
  onImageUpload,
  icon,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearImage = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImagePreview(null);
    setFileName('');
    setValidationError(null);
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageUpload]);

  const processFile = useCallback(
    async (file: File) => {
      const validationMessage = validateImageFile(file);
      if (validationMessage) {
        setValidationError(validationMessage);
        clearImage();
        return;
      }

      try {
        const { base64, mimeType } = await fileToBase64(file);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        const previewUrl = URL.createObjectURL(file);
        previewUrlRef.current = previewUrl;
        setImagePreview(previewUrl);
        setFileName(file.name);
        setValidationError(null);
        onImageUpload({ base64, mimeType, previewUrl });
      } catch {
        setValidationError('Could not process this image. Try another file.');
        clearImage();
      }
    },
    [onImageUpload, clearImage],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await processFile(file);
      }
    },
    [processFile],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.classList.remove('upload-drop-active');
      const file = event.dataTransfer.files?.[0];
      if (file) {
        await processFile(file);
      }
    },
    [processFile],
  );

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('upload-drop-active');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('upload-drop-active');
  };

  return (
    <div className="w-full">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
              {step}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-muted">{description}</p>
            </div>
          </div>
          <div className="h-8 w-8 text-muted" aria-hidden>
            {icon}
          </div>
        </div>

        <label
          htmlFor={id}
          className="group relative flex h-52 cursor-pointer flex-col items-center justify-center bg-[#faf7f2] transition-colors hover:bg-[#f5f0e8] focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {imagePreview ? (
            <>
              <img
                src={imagePreview}
                alt={`Preview of ${label}`}
                className="h-full w-full object-contain p-3"
              />
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/10 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-medium text-ink shadow-sm">
                  Replace photo
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center px-4 text-center">
              <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
                Drop image here
              </span>
              <p className="mt-3 text-sm text-muted">or click to browse files</p>
            </div>
          )}
          <input
            id={id}
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        {fileName ? (
          <p className="truncate text-xs text-muted" title={fileName}>
            {fileName}
          </p>
        ) : (
          <span className="text-xs text-transparent select-none" aria-hidden>
            —
          </span>
        )}
        {imagePreview && (
          <button
            type="button"
            onClick={clearImage}
            className="self-start text-xs font-medium text-accent underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded-sm sm:self-auto"
          >
            Remove
          </button>
        )}
      </div>
      {validationError && (
        <p role="alert" className="mt-1 text-xs font-medium" style={{ color: 'var(--danger)' }}>
          {validationError}
        </p>
      )}
    </div>
  );
};
