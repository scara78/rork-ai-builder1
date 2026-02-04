'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Loader2, RefreshCw, AlertCircle, FileCode2, Check, Smartphone, Tablet, Monitor, ChevronDown } from 'lucide-react';
import { Snack, SnackFiles, SnackDependencies, type SDKVersion } from 'snack-sdk';
import { useProjectStore } from '@/stores/projectStore';

interface PreviewPanelProps {
  projectId: string;
  onExpoURLChange?: (url: string | undefined) => void;
  onDevicesChange?: (count: number) => void;
}

// Preferred SDK version. Falls back to 53.0.0 if the web player for 54 is unavailable.
const PREFERRED_SDK_VERSION: SDKVersion = '54.0.0';
const FALLBACK_SDK_VERSION: SDKVersion = '53.0.0';

// Probe the S3 web player to see if it actually exists for the given SDK major version.
async function resolveSDKVersion(): Promise<SDKVersion> {
  const majorVersion = PREFERRED_SDK_VERSION.split('.')[0];
  const probeURL = `https://snack-web-player.s3.us-west-1.amazonaws.com/v2/${majorVersion}/index.html`;
  try {
    await fetch(probeURL, { method: 'HEAD', mode: 'no-cors' });
    // mode: 'no-cors' returns opaque response — treat as available if no network error
    return PREFERRED_SDK_VERSION;
  } catch {
    console.warn(`Snack web player v${majorVersion} unavailable, falling back to ${FALLBACK_SDK_VERSION}`);
    return FALLBACK_SDK_VERSION;
  }
}

function transformFilesToSnack(files: Record<string, { path: string; content: string }>): SnackFiles {
  const snackFiles: SnackFiles = {};
  Object.values(files).forEach((file) => {
    const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) return;
    snackFiles[path] = { type: 'CODE', contents: file.content };
  });
  return snackFiles;
}

function extractDependencies(files: Record<string, { path: string; content: string }>): SnackDependencies {
  const packageFile = Object.values(files).find(f =>
    f.path === 'package.json' || f.path === '/package.json'
  );
  const deps: SnackDependencies = {
    'expo-router': { version: '*' },
    'expo-status-bar': { version: '*' },
    'expo-linear-gradient': { version: '*' },
    'expo-blur': { version: '*' },
    'expo-haptics': { version: '*' },
    '@expo/vector-icons': { version: '*' },
    'expo-image': { version: '*' },
    'expo-av': { version: '*' },
    'expo-camera': { version: '*' },
    'expo-image-picker': { version: '*' },
    'react-native-safe-area-context': { version: '*' },
    'react-native-reanimated': { version: '*' },
    '@react-native-async-storage/async-storage': { version: '*' },
  };
  if (packageFile) {
    try {
      const pkg = JSON.parse(packageFile.content);
      if (pkg.dependencies) {
        Object.keys(pkg.dependencies).forEach(name => {
          if (!['react', 'react-native', 'expo'].includes(name)) {
            deps[name] = { version: pkg.dependencies[name].replace(/[\^~]/, '') || '*' };
          }
        });
      }
    } catch { /* ignore */ }
  }
  return deps;
}

const DEFAULT_APP = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Rork</Text>
      <Text style={styles.subtitle}>Your app will appear here</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
`;

export function PreviewPanel({ projectId, onExpoURLChange, onDevicesChange }: PreviewPanelProps) {
  const { files, isGenerating, generatingFiles, streamingContent } = useProjectStore();

  // Ref that the Snack SDK reads lazily via ref.current when posting messages to the iframe.
  const webPreviewRef = useRef<Window | null>(null);
  const snackRef = useRef<Snack | null>(null);
  const iframeConnectedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webPreviewURL, setWebPreviewURL] = useState<string | undefined>(undefined);

  const snackFiles = useMemo(() => {
    const transformed = transformFilesToSnack(files);
    const hasAppJs = Object.keys(transformed).some(p => p === 'App.js' || p === 'App.tsx');
    const hasExpoRouter = Object.keys(transformed).some(p =>
      p.startsWith('app/') && (p.endsWith('index.tsx') || p.endsWith('index.js'))
    );
    if (!hasAppJs && !hasExpoRouter) {
      transformed['App.js'] = { type: 'CODE', contents: DEFAULT_APP };
    }
    return transformed;
  }, [files]);

  const dependencies = useMemo(() => extractDependencies(files), [files]);

  // === SNACK LIFECYCLE ===
  // 1. Resolve SDK version (probe S3 for web player availability)
  // 2. Create Snack with disabled: true
  // 3. Render iframe with webPreviewURL
  // 4. After iframe loads, enable Snack + listen for CONNECT via postMessage
  // 5. Inject synthetic CONNECT as fallback if real one was missed

  useEffect(() => {
    let cancelled = false;

    if (snackRef.current) {
      snackRef.current.setOnline(false);
      snackRef.current = null;
    }
    iframeConnectedRef.current = false;

    async function initSnack() {
      const sdkVersion = await resolveSDKVersion();
      if (cancelled) return;

      const snack = new Snack({
        disabled: true, // Start disabled - enable after iframe mounts
        files: snackFiles,
        dependencies,
        sdkVersion,
        webPreviewRef,
        codeChangesDelay: 500,
      });

      snackRef.current = snack;

      // webPreviewURL is computed in the constructor even when disabled
      const initialState = snack.getState();
      if (initialState.webPreviewURL) {
        setWebPreviewURL(initialState.webPreviewURL);
      }
      if (initialState.url) {
        onExpoURLChange?.(initialState.url);
      }

      const unsubscribe = snack.addStateListener((state, prevState) => {
        if (state.webPreviewURL !== prevState.webPreviewURL) {
          setWebPreviewURL(state.webPreviewURL);
        }
        if (state.url !== prevState.url) {
          onExpoURLChange?.(state.url);
        }
        const clientCount = Object.keys(state.connectedClients || {}).length;
        onDevicesChange?.(clientCount);

        // Detect when the webplayer transport receives a real CONNECT
        if (clientCount > 0) {
          iframeConnectedRef.current = true;
        }
      });

      return unsubscribe;
    }

    let unsubscribe: (() => void) | undefined;

    initSnack().then((unsub) => {
      unsubscribe = unsub;
    });

    // Timeout fallback
    const timeout = setTimeout(() => setIsLoading(false), 20000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubscribe?.();
      if (snackRef.current) {
        snackRef.current.setOnline(false);
        snackRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update files reactively
  useEffect(() => {
    if (snackRef.current) {
      snackRef.current.updateFiles(snackFiles);
    }
  }, [snackFiles]);

  useEffect(() => {
    if (snackRef.current) {
      snackRef.current.updateDependencies(dependencies);
    }
  }, [dependencies]);

  // Iframe ref callback: captures contentWindow into webPreviewRef
  const handleIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    webPreviewRef.current = iframe?.contentWindow ?? null;
  }, []);

  // When iframe finishes loading the Snack runtime:
  //   1. Re-capture contentWindow (iframe navigation may have replaced it)
  //   2. Listen for CONNECT postMessage from the web player BEFORE enabling the Snack
  //   3. Enable the Snack (starts transports)
  //   4. If no real CONNECT received within a grace period, inject synthetic CONNECT
  //      directly via window.postMessage so the transport's own listener picks it up
  const handleIframeLoad = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Expo Snack Preview"]');
    if (iframe?.contentWindow) {
      webPreviewRef.current = iframe.contentWindow;
    }

    // Enable the Snack transport so it starts listening for postMessages
    // Small delay to let the web player runtime finish initializing
    setTimeout(() => {
      if (!snackRef.current) return;

      snackRef.current.setDisabled(false);
      snackRef.current.setOnline(true);

      // After enabling, wait for the real CONNECT from the iframe.
      // If it doesn't come (because it was sent before we started listening),
      // inject a synthetic one via window.postMessage so the transport's own
      // handleDomWindowMessage picks it up naturally and increments connectionsCount.
      setTimeout(() => {
        if (!snackRef.current) return;

        const state = snackRef.current.getState();
        const hasClients = Object.keys(state.connectedClients || {}).length > 0;

        if (!hasClients && !iframeConnectedRef.current) {
          // The iframe's CONNECT was lost. Inject a synthetic one via
          // window.postMessage — the transport listens on the window
          // 'message' event and will process this normally.
          const webPlayerURL = state.webPreviewURL;
          const origin = webPlayerURL ? new URL(webPlayerURL).origin : '*';

          window.postMessage(JSON.stringify({
            type: 'CONNECT',
            device: { id: 'web-synthetic', name: 'Web Player', platform: 'web' },
          }), origin === '*' ? '*' : window.location.origin);

          // Also try sending code changes directly
          setTimeout(() => {
            snackRef.current?.sendCodeChanges();
          }, 300);
        }
      }, 1500);

      setIsLoading(false);
    }, 500);
  }, []);

  const handleRefresh = useCallback(() => {
    if (snackRef.current) {
      setIsLoading(true);
      snackRef.current.sendCodeChanges();
      setTimeout(() => setIsLoading(false), 3000);
    }
  }, []);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#242428]">
        <div className="text-center p-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-2">Preview Error</p>
          <p className="text-gray-500 text-xs">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-3 py-1.5 bg-white/10 text-white rounded text-xs hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#202023]">
      {/* Controls - floating badge with device icons */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center bg-[#0a0a0a]/80 backdrop-blur-md border border-[#3f3f46]/50 rounded-full shadow-2xl px-3 py-1.5 gap-2.5">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Refresh preview"
          >
            <RefreshCw size={14} />
          </button>
          
          {/* Status badge */}
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-blue-400" />
              <span className="text-blue-400 font-semibold text-xs">Building</span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-xs">Loading</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </div>
              <span className="text-green-400 font-semibold text-xs">Live</span>
              <ChevronDown size={12} className="text-green-400/70" />
            </div>
          )}
          
          <div className="w-px h-4 bg-[#3f3f46]" />
          
          {/* Device type icons */}
          <div className="flex items-center gap-1.5">
            <button className="p-1 text-white bg-white/10 rounded-md" title="Phone">
              <Smartphone size={14} />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors" title="Tablet">
              <Tablet size={14} />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors" title="Desktop">
              <Monitor size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Phone Frame */}
        <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] border-[8px] border-[#2a2a2a] shadow-[0_0_60px_-15px_rgba(0,0,0,0.4),0_25px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden ring-1 ring-white/10 z-10 scale-[0.75] origin-center">
          <div className="absolute top-[11px] left-1/2 transform -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-[20px] z-50" />
          <div className="absolute top-0 w-full h-12 z-40 flex justify-between items-end px-6 pb-2">
            <div className="text-white text-[13px] font-semibold pl-2">9:41</div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-2.5 rounded-[3px] border border-white/30 relative p-[1px]">
                <div className="bg-white w-full h-full rounded-[1px]" />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 pt-12 pb-8 bg-[#0a0a0a] overflow-hidden">
            {/* Always render iframe when URL is available. 
                The Snack starts disabled, iframe loads the runtime,
                then onLoad enables the Snack so transport can communicate. */}
            {webPreviewURL ? (
              <iframe
                ref={handleIframeRef}
                src={webPreviewURL}
                onLoad={handleIframeLoad}
                className="w-full h-full border-0 bg-[#0a0a0a]"
                title="Expo Snack Preview"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking; screen-wake-lock"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            ) : null}

            {/* Building overlay - shown when AI is generating */}
            {isGenerating && (
              <div className="absolute inset-0 z-30 flex flex-col bg-[#0a0a0a]/90 backdrop-blur-sm">
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  {/* Animated building indicator */}
                  <div className="relative mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                      <FileCode2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 opacity-30 animate-ping" />
                  </div>
                  
                  <p className="text-white font-semibold text-sm mb-1">Building your app</p>
                  <p className="text-gray-500 text-xs mb-5">Rork is writing code...</p>
                  
                  {/* File list being generated */}
                  {generatingFiles.length > 0 && (
                    <div className="w-full max-w-[260px] space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {generatingFiles.map((filePath, i) => (
                        <div 
                          key={filePath}
                          className="flex items-center gap-2 text-xs animate-fade-in"
                        >
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 truncate font-mono">{filePath}</span>
                        </div>
                      ))}
                      {/* Pulsing indicator for "more coming" */}
                      <div className="flex items-center gap-2 text-xs">
                        <Loader2 className="w-3 h-3 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-gray-500">writing...</span>
                      </div>
                    </div>
                  )}

                  {/* No files yet - show initial state */}
                  {generatingFiles.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Analyzing your request...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!webPreviewURL || isLoading) && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center text-gray-500">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p className="text-sm font-medium">
                    {webPreviewURL ? 'Loading preview...' : 'Connecting to Expo...'}
                  </p>
                  <p className="text-xs mt-1">This may take a moment</p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[130px] h-[5px] bg-white/90 rounded-full z-50" />
        </div>
      </div>
    </div>
  );
}
