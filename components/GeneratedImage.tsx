import React, { useState } from 'react';
import { Spinner } from './Spinner';
import { DownloadIcon } from './IconComponents';

interface GeneratedImageProps {
  isLoading: boolean;
  generatedImage: string | null;
  error: string | null;
  modelPreviewUrl: string | null;
  garmentPreviewUrl: string | null;
  onRetry: () => void;
  onReset: () => void;
  canRetry: boolean;
  mode: 'local' | 'cloud';
}

const downloadImage = (base64Image: string) => {
  const link = document.createElement('a');
  link.href = base64Image;
  link.download = `virtual-try-on-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const GeneratedImage: React.FC<GeneratedImageProps> = ({
  isLoading,
  generatedImage,
  error,
  modelPreviewUrl,
  garmentPreviewUrl,
  onRetry,
  onReset,
  canRetry,
  mode,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'result_only' | 'slider'>('split');

  // ── Loading state ──────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center text-center px-6 py-12"
        role="status"
        aria-live="polite"
        aria-label="Generating virtual try-on image"
      >
        <Spinner />
        <p className="mt-5 font-display text-2xl font-bold text-ink">Creating your try-on...</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          This may take a moment ({mode === 'local' ? 'running on local GPU' : 'processing cloud AI'}).
        </p>
      </div>
    );
  }

  // ── Error state ────────────────────────────
  if (error) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center rounded-2xl px-6 py-10 text-center border border-rose-200 bg-rose-50/50"
        role="alert"
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 border border-rose-200" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
          Try-On Failed
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink font-medium">{error}</p>
        <div className="mt-6 flex items-center gap-3">
          {canRetry && (
            <button type="button" onClick={onRetry} className="btn-primary py-2 px-4 text-xs w-auto">
              Try Again
            </button>
          )}
          <button type="button" onClick={onReset} className="btn-secondary py-2 px-4 text-xs w-auto">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // ── Result state ────────────────────────────
  if (generatedImage) {
    return (
      <div className="flex flex-1 flex-col gap-4 result-enter">
        {/* Header & Controls */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-display text-xl font-bold text-ink">Your Try-On Result</h2>
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'split' ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              Side by Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode('result_only')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'result_only' ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              Result Only
            </button>
          </div>
        </div>

        {/* Display Grid */}
        <div className="min-h-0 flex-1 flex flex-col items-center justify-center">
          {viewMode === 'split' && modelPreviewUrl ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
              <div className="flex flex-col items-center">
                <span className="compare-label mb-2">Original Person</span>
                <div className="overflow-hidden rounded-xl border border-line bg-[#faf7f2] w-full flex items-center justify-center p-2">
                  <img
                    src={modelPreviewUrl}
                    alt="Original model photo"
                    className="max-h-80 w-auto object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="compare-label mb-2">Try-On Result</span>
                <div className="overflow-hidden rounded-xl border border-accent/40 bg-[#faf7f2] w-full flex items-center justify-center p-2 shadow-xs">
                  <img
                    src={generatedImage}
                    alt="AI-generated try-on result"
                    className="max-h-80 w-auto object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-[#faf7f2] w-full flex flex-col items-center justify-center p-3">
              <span className="compare-label mb-2">Generated Try-On Result</span>
              <img
                src={generatedImage}
                alt="AI-generated try-on result"
                className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line mt-2">
          <button
            type="button"
            onClick={() => downloadImage(generatedImage)}
            className="btn-primary w-auto px-5 py-2.5 text-sm"
            aria-label="Download try-on image"
          >
            <DownloadIcon />
            Download Image
          </button>

          <div className="flex items-center gap-2">
            {canRetry && (
              <button type="button" onClick={onRetry} className="btn-secondary py-2.5 px-4 text-xs">
                Try Again
              </button>
            )}
            <button type="button" onClick={onReset} className="btn-secondary py-2.5 px-4 text-xs">
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-[#faf7f2] px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft border border-line" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      </div>
      <p className="font-display text-2xl font-bold text-ink">Ready for Virtual Try-On</p>
      <p className="mt-2 max-w-sm text-xs text-muted leading-relaxed">
        Upload a person photo and a garment photo on the left, select your mode, and click{' '}
        <span className="font-semibold text-ink">Try It On</span>.
      </p>
    </div>
  );
};
