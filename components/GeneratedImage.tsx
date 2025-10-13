
import React from 'react';
import { Spinner } from './Spinner';
import { DownloadIcon, ImageIcon, ErrorIcon } from './IconComponents';

interface GeneratedImageProps {
  isLoading: boolean;
  generatedImage: string | null;
  error: string | null;
}

const downloadImage = (base64Image: string) => {
  const link = document.createElement('a');
  link.href = base64Image;
  link.download = `virtual-try-on-${new Date().getTime()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const GeneratedImage: React.FC<GeneratedImageProps> = ({ isLoading, generatedImage, error }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <Spinner />
        <p className="mt-4 text-lg font-semibold text-gray-300">AI is working its magic...</p>
        <p className="text-sm text-gray-500">This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-red-400">
        <ErrorIcon />
        <p className="mt-4 text-lg font-semibold">Generation Failed</p>
        <p className="text-sm text-red-500 max-w-sm">{error}</p>
      </div>
    );
  }

  if (generatedImage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <div className="relative group w-full h-full aspect-square">
           <img src={generatedImage} alt="Generated model" className="rounded-lg object-contain w-full h-full shadow-2xl shadow-black/50" />
           <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={() => downloadImage(generatedImage)}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-all"
                    >
                    <DownloadIcon />
                    Download
                </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center text-gray-500">
      <ImageIcon />
      <p className="mt-4 text-lg font-semibold">Your generated image will appear here</p>
      <p className="text-sm">Upload images and click "Generate" to start.</p>
    </div>
  );
};
