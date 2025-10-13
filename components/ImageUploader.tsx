
import React, { useState, useCallback, useRef } from 'react';
import type { ImageState } from '../types';
import { UploadIcon } from './IconComponents';

interface ImageUploaderProps {
  id: string;
  label: string;
  onImageUpload: (imageState: ImageState | null) => void;
  icon: React.ReactNode;
}

const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload, icon }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setFileName(file.name);
        onImageUpload({ base64, mimeType, previewUrl });
      } catch (error) {
        console.error('Error converting file to base64:', error);
        setImagePreview(null);
        setFileName('');
        onImageUpload(null);
      }
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-500', 'bg-gray-800');
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      if (fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-indigo-500', 'bg-gray-800');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-500', 'bg-gray-800');
  };

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="cursor-pointer group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-xl transition-all duration-300 hover:border-indigo-600 hover:bg-gray-800/50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {imagePreview ? (
          <>
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-xl p-2" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-center p-4">Click or drag to change image</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 mb-4 text-gray-500 group-hover:text-indigo-500 transition-colors duration-300">
              {icon}
            </div>
            <p className="text-lg font-semibold">{label}</p>
            <p className="text-sm">Drag & drop or click to upload</p>
            <div className="mt-4">
              <UploadIcon />
            </div>
          </div>
        )}
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </label>
      {fileName && <p className="text-center text-sm text-gray-500 mt-2 truncate">{fileName}</p>}
    </div>
  );
};
