
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImage } from './components/GeneratedImage';
import { GarmentIcon, ModelIcon } from './components/IconComponents';
import { generateVirtualTryOnImage } from './services/geminiService';
import type { ImageState } from './types';

const App: React.FC = () => {
  const [garmentImage, setGarmentImage] = useState<ImageState | null>(null);
  const [modelImage, setModelImage] = useState<ImageState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!garmentImage || !modelImage) {
      setError('Please upload both a garment and a model image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateVirtualTryOnImage(garmentImage, modelImage);
      setGeneratedImage(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  }, [garmentImage, modelImage]);

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Input Section */}
          <div className="flex flex-col gap-8">
            <ImageUploader 
              id="garment-uploader"
              label="Upload Garment" 
              onImageUpload={setGarmentImage}
              icon={<GarmentIcon />}
            />
            <ImageUploader 
              id="model-uploader"
              label="Upload Model" 
              onImageUpload={setModelImage}
              icon={<ModelIcon />}
            />
            <button
              onClick={handleGenerate}
              disabled={!garmentImage || !modelImage || isLoading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 shadow-lg disabled:shadow-none"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex items-center justify-center min-h-[400px] lg:min-h-0">
            <GeneratedImage
              isLoading={isLoading}
              generatedImage={generatedImage}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
