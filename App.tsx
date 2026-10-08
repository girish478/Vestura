import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImage } from './components/GeneratedImage';
import { GarmentIcon, ModelIcon } from './components/IconComponents';
import { generateVirtualTryOnImage, fetchApiHealth, type HealthStatusResponse } from './services/tryOnService';
import type { ImageState, TryOnMode, TryOnProviderId, GarmentCategory } from './shared/imageTypes';

const App: React.FC = () => {
  const [modelImage, setModelImage] = useState<ImageState | null>(null);
  const [garmentImage, setGarmentImage] = useState<ImageState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [mode, setMode] = useState<TryOnMode>('cloud');
  const [provider, setProvider] = useState<TryOnProviderId>('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [category, setCategory] = useState<GarmentCategory>('upper_body');
  const [localUrl, setLocalUrl] = useState<string>('http://127.0.0.1:7860');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatusResponse | null>(null);

  // ── Health Check ─────────────────────────────────────
  const checkHealth = useCallback(async () => {
    try {
      const status = await fetchApiHealth({ localUrl, apiKey, provider, apiEndpoint });
      setHealthStatus(status);
      if (status.defaultMode && !healthStatus) {
        setMode(status.defaultMode);
      }
    } catch {
      // Ignore initial silent check failure
    }
  }, [localUrl, apiKey, provider, apiEndpoint, healthStatus]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // ── Generate Try-On ──────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!modelImage || !garmentImage) {
      setError('Please upload both a person photo and a clothing photo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateVirtualTryOnImage(garmentImage, modelImage, {
        mode,
        provider,
        apiKey,
        apiEndpoint,
        modelName,
        category,
        localUrl,
      });
      setGeneratedImage(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during virtual try-on generation.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [modelImage, garmentImage, mode, provider, apiKey, apiEndpoint, modelName, category, localUrl]);

  // ── Reset All ────────────────────────────────────────
  const handleReset = useCallback(() => {
    setModelImage(null);
    setGarmentImage(null);
    setGeneratedImage(null);
    setError(null);
  }, []);

  const canGenerate = Boolean(modelImage && garmentImage && !isLoading);
  const readyCount = Number(Boolean(modelImage)) + Number(Boolean(garmentImage));

  return (
    <div className="app-shell font-sans text-ink">
      <div className="mx-auto max-w-6xl">
        <Header mode={mode} />

        {/* ── Main Workspace ───────────────────────────── */}
        <main className="mt-6">
          <div className="main-grid">
            {/* ── Upload & Options Column ─────────────────── */}
            <section aria-label="Virtual Try-On Inputs" className="flex flex-col gap-4">
              <ModeSelector
                mode={mode}
                provider={provider}
                apiKey={apiKey}
                apiEndpoint={apiEndpoint}
                modelName={modelName}
                category={category}
                localUrl={localUrl}
                healthStatus={healthStatus}
                onModeChange={setMode}
                onProviderChange={setProvider}
                onApiKeyChange={setApiKey}
                onApiEndpointChange={setApiEndpoint}
                onModelNameChange={setModelName}
                onCategoryChange={setCategory}
                onLocalUrlChange={setLocalUrl}
              />

              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                <span>Upload Photos</span>
                <span>{readyCount}/2 Ready</span>
              </div>

              {/* Upload person photo */}
              <ImageUploader
                id="model-uploader"
                step={1}
                label="Person Photo"
                description="Upload a full-body or suitable person photo"
                onImageUpload={setModelImage}
                icon={<ModelIcon />}
              />

              {/* Upload clothing photo */}
              <ImageUploader
                id="garment-uploader"
                step={2}
                label="Clothing Photo"
                description="Upload a clear photo of the clothing"
                onImageUpload={setGarmentImage}
                icon={<GarmentIcon />}
              />

              <p className="text-[11px] text-muted leading-relaxed">
                Accepted formats: JPEG, PNG, WebP · Max size: 10 MB per photo
              </p>

              {/* Action Buttons */}
              <div className="mt-2 flex items-center gap-3">
                <button
                  id="generate-btn"
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  aria-busy={isLoading}
                  className="btn-primary flex-1 py-3 text-sm font-bold"
                >
                  {isLoading ? 'Creating Try-On...' : 'Try It On'}
                </button>

                {(modelImage || garmentImage || generatedImage) && (
                  <button
                    id="reset-btn"
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="btn-secondary py-3 px-4 text-xs"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </section>

            {/* ── Result Column ───────────────────────────── */}
            <section
              aria-label="Try-On Output Result"
              className="panel flex min-h-[28rem] flex-col p-5 sm:p-6 lg:min-h-[36rem] lg:sticky lg:top-6 lg:self-start"
            >
              <GeneratedImage
                isLoading={isLoading}
                generatedImage={generatedImage}
                error={error}
                modelPreviewUrl={modelImage?.previewUrl ?? null}
                garmentPreviewUrl={garmentImage?.previewUrl ?? null}
                onRetry={handleGenerate}
                onReset={handleReset}
                canRetry={canGenerate}
                mode={mode}
              />
            </section>
          </div>
        </main>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="mt-12 border-t border-line pt-6 text-xs text-muted leading-relaxed">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>
              <strong className="font-bold text-ink">Vestura VTON</strong> — Open-Source Clothing Virtual Try-On · MIT License
            </p>
            <p className="text-[11px]">
              Local / Free mode (CatVTON) · Cloud API mode (Gemini, Replicate, Custom VTON APIs)
            </p>
          </div>
          <p className="mt-2 text-[11px]">
            Disclaimer: Generated try-on images are AI approximations to visualize fit and style.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
