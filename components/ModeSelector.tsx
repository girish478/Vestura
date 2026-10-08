import React, { useState } from 'react';
import type { TryOnMode, TryOnProviderId, GarmentCategory } from '../shared/imageTypes';
import { CLOUD_PROVIDERS_META } from '../shared/imageTypes';
import type { HealthStatusResponse } from '../services/tryOnService';
import { testCustomEndpoint } from '../services/tryOnService';

interface ModeSelectorProps {
  mode: TryOnMode;
  provider: TryOnProviderId;
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  category: GarmentCategory;
  localUrl: string;
  healthStatus: HealthStatusResponse | null;
  onModeChange: (mode: TryOnMode) => void;
  onProviderChange: (provider: TryOnProviderId) => void;
  onApiKeyChange: (key: string) => void;
  onApiEndpointChange: (endpoint: string) => void;
  onModelNameChange: (model: string) => void;
  onCategoryChange: (category: GarmentCategory) => void;
  onLocalUrlChange: (url: string) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  provider,
  apiKey,
  apiEndpoint,
  modelName,
  category,
  localUrl,
  healthStatus,
  onModeChange,
  onProviderChange,
  onApiKeyChange,
  onApiEndpointChange,
  onModelNameChange,
  onCategoryChange,
  onLocalUrlChange,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testState, setTestState] = useState<{ testing: boolean; message: string | null; success?: boolean }>({
    testing: false,
    message: null,
  });

  const localConfigured = healthStatus?.local.configured ?? false;
  const currentProviderMeta = CLOUD_PROVIDERS_META.find((p) => p.id === provider) || CLOUD_PROVIDERS_META[0];
  const cloudConfigured = !currentProviderMeta.requiresApiKey || Boolean(apiKey.trim());

  const handleTestConnection = async () => {
    if (!apiEndpoint.trim()) {
      setTestState({ testing: false, message: 'Enter an API Endpoint URL first.', success: false });
      return;
    }

    setTestState({ testing: true, message: 'Testing connection...' });
    try {
      const res = await testCustomEndpoint(apiEndpoint, apiKey);
      setTestState({ testing: false, message: res.message, success: res.success });
    } catch {
      setTestState({ testing: false, message: 'Connection test failed.', success: false });
    }
  };

  return (
    <div className="panel p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div>
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
            Inference Engine & Mode
          </h2>
          <p className="text-xs text-muted">
            Select local open-source GPU execution or a cloud VTON service
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-accent font-medium hover:underline focus:outline-none"
        >
          {showAdvanced ? 'Hide Config' : 'Configure Settings'}
        </button>
      </div>

      {/* Mode Toggle Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Local / Free Option */}
        <button
          type="button"
          onClick={() => onModeChange('local')}
          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
            mode === 'local'
              ? 'border-accent bg-accent-soft/60 shadow-xs ring-1 ring-accent/30'
              : 'border-line bg-surface hover:bg-[#f7f2ea]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Local / Free
            </span>
            {localConfigured ? (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Online
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                GPU Needed
              </span>
            )}
          </div>
          <span className="font-semibold text-ink text-sm mt-1">Open-Source VTON</span>
          <span className="text-xs text-muted mt-0.5">CatVTON / PyTorch · Local GPU</span>
        </button>

        {/* Cloud Option */}
        <button
          type="button"
          onClick={() => onModeChange('cloud')}
          className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
            mode === 'cloud'
              ? 'border-accent bg-accent-soft/60 shadow-xs ring-1 ring-accent/30'
              : 'border-line bg-surface hover:bg-[#f7f2ea]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Cloud APIs
            </span>
            {cloudConfigured ? (
              <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                Ready
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Key Needed
              </span>
            )}
          </div>
          <span className="font-semibold text-ink text-sm mt-1">Cloud VTON Services</span>
          <span className="text-xs text-muted mt-0.5">Gemini, Replicate, Custom APIs</span>
        </button>
      </div>

      {/* Local Mode Details */}
      {mode === 'local' && (
        <div className="mt-4 p-3.5 rounded-xl bg-surface border border-line text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold mt-0.5">🟢</span>
            <div>
              <p className="font-semibold text-ink">CatVTON Open-Source Model</p>
              <p className="text-muted leading-relaxed mt-0.5">
                Runs local clothing try-on directly on your GPU (NVIDIA 8GB+ VRAM recommended).
                Start your local server:
                <code className="block bg-[#ede6db] px-2 py-1 rounded text-ink font-mono text-[11px] mt-1 select-all">
                  python scripts/local_vton_server.py
                </code>
              </p>
            </div>
          </div>

          {(showAdvanced || !localConfigured) && (
            <div className="pt-2 border-t border-line mt-2">
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Local VTON Server URL
              </label>
              <input
                type="text"
                value={localUrl}
                onChange={(e) => onLocalUrlChange(e.target.value)}
                placeholder="http://127.0.0.1:7860"
                className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono text-xs focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Cloud Mode Provider Selector & Config */}
      {mode === 'cloud' && (
        <div className="mt-4 p-3.5 rounded-xl bg-surface border border-line text-xs space-y-3">
          {/* Select Provider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-ink">Cloud Provider</label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentProviderMeta.type === 'vton'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {currentProviderMeta.badgeLabel}
              </span>
            </div>

            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as TryOnProviderId)}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink font-medium text-xs focus:ring-2 focus:ring-accent focus:outline-none"
            >
              {CLOUD_PROVIDERS_META.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — [{p.badgeLabel}]
                </option>
              ))}
            </select>

            <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
              {currentProviderMeta.description}
            </p>
          </div>

          {/* Standard Provider Key Input */}
          {provider !== 'custom' && currentProviderMeta.requiresApiKey && (
            <div className="pt-2 border-t border-line space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-muted">
                  {currentProviderMeta.name} API Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-accent underline hover:no-underline"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder={`Enter your ${currentProviderMeta.name} API key`}
                className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono text-xs focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
          )}

          {/* Clean Redesigned Custom VTON API Section */}
          {provider === 'custom' && (
            <div className="pt-2.5 border-t border-line space-y-3">
              <div className="bg-accent-soft/40 p-3 rounded-lg border border-accent/20">
                <h3 className="font-bold text-ink text-xs">Custom VTON API</h3>
                <p className="text-[11px] text-muted">Connect your own cloud VTON service.</p>
              </div>

              {/* API Endpoint */}
              <div>
                <label className="block text-[11px] font-semibold text-ink mb-1">
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => onApiEndpointChange(e.target.value)}
                  placeholder="https://your-vton-api.com/v1/try-on"
                  className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono text-xs focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-ink">
                    API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-accent underline hover:no-underline"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="•••••••••••••••••••"
                  className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono text-xs focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>

              {/* Model ID & Garment Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Model ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => onModelNameChange(e.target.value)}
                    placeholder="your-model-id"
                    className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono text-xs focus:ring-2 focus:ring-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Garment Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value as GarmentCategory)}
                    className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-medium text-xs focus:ring-2 focus:ring-accent focus:outline-none"
                  >
                    <option value="upper_body">Upper Body</option>
                    <option value="lower_body">Lower Body</option>
                    <option value="dresses">Dresses / Full Body</option>
                    <option value="auto">Auto-detect</option>
                  </select>
                </div>
              </div>

              {/* Test Connection Button & Status */}
              <div className="pt-2 flex items-center justify-between border-t border-dashed border-line">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testState.testing}
                  className="btn-secondary py-1 px-3 text-xs w-auto font-medium"
                >
                  {testState.testing ? 'Testing...' : 'Test Connection'}
                </button>
                {testState.message && (
                  <span
                    className={`text-[11px] font-semibold ${
                      testState.success ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    {testState.message}
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted leading-tight pt-1">
            🔒 All API keys remain strictly server-side. Never exposed in frontend code or repository commits.
          </p>
        </div>
      )}
    </div>
  );
};
