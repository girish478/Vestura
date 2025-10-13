
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
          Virtual AI Try-On
        </span>
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
        Dress Up Your Imagination. Upload a garment and a model to see the magic happen.
      </p>
    </header>
  );
};
