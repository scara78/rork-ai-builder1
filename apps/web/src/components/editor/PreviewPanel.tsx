'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, RefreshCw, AlertCircle, FileCode2, Check, Smartphone, Tablet, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAgentStore } from '@/stores/agentStore';

interface PreviewPanelProps {
  projectId: string;
  onExpoURLChange?: (url: string | undefined) => void;
  onDevicesChange?: (count: number) => void;
}

export function PreviewPanel({ projectId, onExpoURLChange, onDevicesChange }: PreviewPanelProps) {
  const { files, generatingFiles } = useProjectStore();
  const { isRunning: isAgentRunning } = useAgentStore();

  const isGenerating = isAgentRunning;
  const hasRealFiles = Object.keys(files).length > 0;

  const [deviceSize, setDeviceSize] = useState<'phone' | 'tablet'>('phone');
  const [refreshKey, setRefreshKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bundle URL using the Next.js API route that runs esbuild
  const bundleUrl = `/api/projects/${projectId}/bundle?t=${refreshKey}`;

  const handleRefresh = useCallback(() => {
    setIframeLoaded(false);
    setRuntimeError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  // Receive runtime errors from iframe (injected by our bundler)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.source === 'rork-preview' && data.type === 'preview-error') {
        const msg = [data.message, data.stack].filter(Boolean).join('\\n');
        setRuntimeError(msg || 'Runtime error');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // When AI stops generating, automatically refresh the preview to load latest files
  const previousGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    if (previousGeneratingRef.current === true && isGenerating === false && hasRealFiles) {
      // Small delay to ensure all DB writes are finished
      const timer = setTimeout(() => {
        handleRefresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
    previousGeneratingRef.current = isGenerating;
  }, [isGenerating, hasRealFiles, handleRefresh]);

  // When a specific file (not during full generation loop) changes, we can reload
  // However, relying on the 'isGenerating' transition is safer for bulk updates.
  // We'll trust the user to press Refresh or the auto-refresh above.

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a1d]">
      {/* Top bar with status + controls */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[#27272a] bg-[#0f0f11] flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Status */}
          {isGenerating ? (
            <div className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-blue-400" />
              <span className="text-blue-400 font-medium text-xs">Building</span>
            </div>
          ) : !hasRealFiles ? (
            <div className="flex items-center gap-1.5">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500" />
              <span className="text-gray-500 font-medium text-xs">Waiting</span>
            </div>
          ) : !iframeLoaded ? (
            <div className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-yellow-400" />
              <span className="text-yellow-400 font-medium text-xs">Loading preview</span>
            </div>
          ) : runtimeError ? (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={12} className="text-red-400" />
              <span className="text-red-400 font-medium text-xs">Error</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </div>
              <span className="text-green-400 font-medium text-xs">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-white/5"
            title="Refresh preview"
          >
            <RefreshCw size={13} />
          </button>
          {/* Device type icons */}
          <button
            onClick={() => setDeviceSize('phone')}
        className={`p-1.5 rounded-md transition-colors ${deviceSize === 'phone' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Phone"
          >
            <Smartphone size={13} />
          </button>
          <button
            onClick={() => setDeviceSize('tablet')}
        className={`p-1.5 rounded-md transition-colors ${deviceSize === 'tablet' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Tablet"
          >
            <Tablet size={13} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Device Frame - phone or tablet */}
        <div
          className={`relative bg-black border-[3px] border-[#333] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-10 ${
            deviceSize === 'tablet'
              ? 'w-[580px] h-[760px] rounded-[24px]'
              : 'w-[320px] h-[693px] rounded-[40px]'
          }`}
        >
          <div
            className={`absolute inset-0 bg-[#0a0a0a] overflow-hidden ${
              deviceSize === 'tablet' ? 'rounded-[21px]' : 'rounded-[37px]'
            }`}
          >
            {/* The actual preview iframe powered by esbuild */}
            {hasRealFiles && (
              <iframe
                ref={iframeRef}
                key={bundleUrl}
                src={bundleUrl}
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full border-0 bg-[#0a0a0a]"
                title="Rork Preview"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking; screen-wake-lock"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            )}

            {/* Overlays */}
            
            {/* Runtime Error Overlay */}
            {runtimeError && iframeLoaded && !isGenerating && (
              <div className="absolute inset-0 z-40 bg-red-950/90 flex flex-col p-6 overflow-auto">
                <div className="flex items-center gap-2 mb-4 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-semibold text-sm">Runtime Error</h3>
                </div>
                <pre className="text-red-300 text-[11px] whitespace-pre-wrap font-mono bg-black/40 p-4 rounded-lg flex-1 overflow-auto">
                  {runtimeError}
                </pre>
                <button
                  onClick={handleRefresh}
                  className="mt-4 py-2 bg-red-500/20 text-red-200 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Dismiss & Reload
                </button>
              </div>
            )}

            {/* Building overlay */}
            {isGenerating && (
              <div className="absolute inset-0 z-30 flex flex-col bg-[#0a0a0a]">
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <div className="relative mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                      <FileCode2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 opacity-30 animate-ping" />
                  </div>

                  <p className="text-white font-semibold text-sm mb-1">Building your app...</p>
                  <p className="text-gray-500 text-xs mb-5">Rork is writing code...</p>

                  {generatingFiles.length > 0 && (
                    <div className="w-full max-w-[240px] space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                      {generatingFiles.map((filePath) => (
                        <div key={filePath} className="flex items-center gap-2 text-xs animate-fade-in">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 truncate font-mono">{filePath}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-xs">
                        <Loader2 className="w-3 h-3 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-gray-500">writing...</span>
                      </div>
                    </div>
                  )}

                  {generatingFiles.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Analyzing your request...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isGenerating && !hasRealFiles && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center text-gray-500 px-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Sparkles className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">No app yet</p>
                  <p className="text-xs mt-2 text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                    Describe what you want to build in the chat and Rork will generate it here.
                  </p>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {!isGenerating && hasRealFiles && !iframeLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center text-gray-500 px-6">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                  <p className="text-sm font-medium text-gray-300">Loading preview...</p>
                  <p className="text-xs mt-1 text-gray-500">Bundling files</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
