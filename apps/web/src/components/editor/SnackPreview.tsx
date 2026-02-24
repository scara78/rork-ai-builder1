'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Wand2, Loader2, Wifi, WifiOff } from 'lucide-react';

interface SnackPreviewProps {
  webPreviewRef: React.MutableRefObject<Window | null>;
  webPreviewURL: string | undefined;
  isOnline: boolean;
  isBusy: boolean;
  connectedClients: number;
  error: string | null;
  hasRequestedOnline: boolean;
  onRetryConnect?: () => void;
  className?: string;
}

export function SnackPreview({
  webPreviewRef,
  webPreviewURL,
  isOnline,
  isBusy,
  connectedClients,
  error: snackError,
  hasRequestedOnline,
  onRetryConnect,
  className,
}: SnackPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const prevURLRef = useRef<string | undefined>(undefined);
  const autoFixSentRef = useRef<string | null>(null);
  const connectingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connectingTooLong, setConnectingTooLong] = useState(false);

  // Wire up the webPreviewRef to iframe's contentWindow IMMEDIATELY on mount.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      webPreviewRef.current = iframe.contentWindow;
    }
    return () => {
      webPreviewRef.current = null;
    };
  }, [webPreviewRef]);

  // When webPreviewURL changes, update the iframe src
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (webPreviewURL && webPreviewURL !== prevURLRef.current) {
      prevURLRef.current = webPreviewURL;
      setIsLoading(true);
      setRuntimeError(null);
      setConnectingTooLong(false);
      iframe.src = webPreviewURL;

      // Clear connecting timer
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
        connectingTimerRef.current = null;
      }
    }
  }, [webPreviewURL]);

  // Track "connecting too long" state — only after goOnline() has been called
  useEffect(() => {
    if (hasRequestedOnline && !webPreviewURL && !snackError) {
      connectingTimerRef.current = setTimeout(() => {
        setConnectingTooLong(true);
      }, 15_000);
    } else {
      setConnectingTooLong(false);
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
        connectingTimerRef.current = null;
      }
    }
    return () => {
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
      }
    };
  }, [hasRequestedOnline, webPreviewURL, snackError]);

  // Listen for messages from the Snack web player
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      // Snack web player runtime errors
      if (data.type === 'error' || data.type === 'unhandled_error') {
        const msg = data.message || data.error || 'Runtime error in preview';
        setRuntimeError(msg);
      }

      // Snack web player status reports with errors
      if (data.type === 'STATUS_REPORT' && data.error) {
        const msg = typeof data.error === 'string' ? data.error : data.error.message || 'Preview status error';
        setRuntimeError(msg);
      }

      // Transport errors (connection issues with Snack backend)
      if (data.type === 'TRANSPORT_ERROR') {
        const msg = data.message || data.error || 'Connection error with preview server';
        setRuntimeError(msg);
      }

      // Console errors from the web player (source: snack-runtime)
      if (data.type === 'console' && data.level === 'error') {
        const msg = Array.isArray(data.args) ? data.args.join(' ') : (data.message || 'Console error');
        setRuntimeError(msg);
      }

      // Clear errors on successful load
      if (data.type === 'loading_complete' || data.type === 'done' || data.type === 'CONNECTED') {
        setRuntimeError(null);
        setIsLoading(false);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const dispatchFixWithAI = useCallback((errorMsg: string) => {
    const errorPrompt = `The Expo Snack preview has an error. Please analyze and fix the issue:\n\n\`\`\`\n${errorMsg}\n\`\`\`\n\nLook at the error carefully — if it mentions a package version issue, update package.json with the correct version. If it's a code error, fix the relevant source files. Make sure all imports are correct and all referenced files exist.`;
    window.dispatchEvent(new CustomEvent('send-to-ai', { detail: { message: errorPrompt } }));
  }, []);

  // Auto-dispatch "Fix with AI" when a dependency error is detected from useSnack
  // Only send once per unique error to avoid spam loops
  useEffect(() => {
    if (snackError && snackError.includes('Failed to resolve dependencies')) {
      if (autoFixSentRef.current !== snackError) {
        autoFixSentRef.current = snackError;
        // Small delay so the error UI is visible first
        const timer = setTimeout(() => {
          dispatchFixWithAI(snackError);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [snackError, dispatchFixWithAI]);

  const handleFixWithAI = () => {
    const errorMsg = runtimeError || snackError;
    if (!errorMsg) return;
    autoFixSentRef.current = errorMsg;
    dispatchFixWithAI(errorMsg);
  };

  const handleRefresh = () => {
    const iframe = iframeRef.current;
    if (iframe && webPreviewURL) {
      setIsLoading(true);
      setRuntimeError(null);
      iframe.src = webPreviewURL;
    }
  };

  const displayError = runtimeError || snackError;

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {/* Status overlay — waiting for AI or connecting to Expo */}
      {!webPreviewURL && !displayError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
          <div className="text-center text-gray-500 p-8">
            {!hasRequestedOnline ? (
              <>
                {/* Not yet online — waiting for AI to generate code */}
                <div className="mx-auto h-10 w-10 mb-4 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Waiting for code...
                </p>
                <p className="text-xs text-gray-600">
                  Preview will appear after AI generates your app
                </p>
              </>
            ) : (
              <>
                {/* Online requested — connecting to Expo */}
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4 opacity-40" />
                <p className="text-sm font-medium text-gray-400 mb-1">
                  {isBusy ? 'Resolving dependencies...' : 'Connecting to Expo...'}
                </p>
                <p className="text-xs text-gray-600">
                  {isOnline ? 'Online — waiting for web player' : 'Going online...'}
                </p>
                {connectingTooLong && (
                  <div className="mt-3">
                    <p className="text-xs text-yellow-500/80 mb-3">
                      Taking longer than expected. This usually means dependencies are being resolved for the first time.
                    </p>
                    {onRetryConnect && (
                      <button
                        onClick={onRetryConnect}
                        className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors text-sm font-medium"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry Connection
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Error overlay — shown when Snack has an error and no preview URL */}
      {displayError && !webPreviewURL && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 z-10 m-3 border border-red-500/30 rounded-xl">
          <div className="text-center p-6 max-w-2xl w-full">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-red-400 mb-2">Preview Error</h3>
            <pre className="text-xs text-red-300/80 mb-4 text-left bg-black/40 p-4 rounded-lg overflow-auto max-h-60 whitespace-pre-wrap font-mono">
              {displayError}
            </pre>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
              <button
                onClick={handleFixWithAI}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-orange-900/20"
              >
                <Wand2 className="h-4 w-4" />
                Fix with AI
              </button>
            </div>
            {snackError?.includes('Failed to resolve dependencies') && (
              <p className="mt-3 text-xs text-orange-400/80">
                AI is being notified to fix this automatically...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {webPreviewURL && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          {isOnline ? (
            <Wifi size={10} className="text-green-500" />
          ) : (
            <WifiOff size={10} className="text-red-400" />
          )}
        </div>
      )}

      {/* Loading overlay — shown while iframe is loading */}
      {isLoading && webPreviewURL && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10">
          <div className="text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2 text-gray-400" />
            <p className="text-xs text-gray-500">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Runtime error overlay — shown on top of working preview */}
      {runtimeError && webPreviewURL && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-red-950/90 backdrop-blur-sm border-t border-red-500/30 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-300 font-mono line-clamp-3">{runtimeError}</p>
            </div>
            <button
              onClick={handleFixWithAI}
              className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-medium flex-shrink-0"
            >
              <Wand2 size={10} />
              Fix
            </button>
          </div>
        </div>
      )}

      {/* The iframe ALWAYS renders — starts with about:blank, then gets webPreviewURL set via effect.
          This is critical: Snack SDK needs webPreviewRef.current (iframe.contentWindow) 
          to be available BEFORE setOnline(true) is called. */}
      <iframe
        ref={iframeRef}
        src="about:blank"
        title="Expo Snack Preview"
        allow="geolocation; camera; microphone"
        className="w-full h-full border-none"
        style={{ backgroundColor: '#0a0a0a' }}
        onLoad={() => {
          // Only mark loading complete if we have a real URL loaded (not about:blank)
          if (iframeRef.current?.src && iframeRef.current.src !== 'about:blank') {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
}
