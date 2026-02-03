'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Snack, SnackFiles, SnackDependencies } from 'snack-sdk';
import { useProjectStore } from '@/stores/projectStore';
import { Loader2, AlertCircle, RefreshCw, Smartphone, Globe, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ExpoSnackPreviewProps {
  className?: string;
}

// Default SDK version
const SDK_VERSION = '52.0.0';

// Transform project files to Snack format
function transformFilesToSnack(files: Record<string, { path: string; content: string }>): SnackFiles {
  const snackFiles: SnackFiles = {};
  
  Object.values(files).forEach((file) => {
    // Snack expects paths without leading slash
    const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    
    // Skip non-code files like images (they need special handling)
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) {
      return;
    }
    
    snackFiles[path] = {
      type: 'CODE',
      contents: file.content,
    };
  });
  
  return snackFiles;
}

// Extract dependencies from package.json if exists
function extractDependencies(files: Record<string, { path: string; content: string }>): SnackDependencies {
  const packageFile = Object.values(files).find(f => 
    f.path === 'package.json' || f.path === '/package.json'
  );
  
  const deps: SnackDependencies = {
    // Common Expo dependencies
    'expo-router': { version: '*' },
    'expo-status-bar': { version: '*' },
    'expo-linear-gradient': { version: '*' },
    'expo-blur': { version: '*' },
    'expo-haptics': { version: '*' },
    '@expo/vector-icons': { version: '*' },
  };
  
  if (packageFile) {
    try {
      const pkg = JSON.parse(packageFile.content);
      if (pkg.dependencies) {
        Object.keys(pkg.dependencies).forEach(name => {
          // Skip core deps that are already included
          if (!['react', 'react-native', 'expo'].includes(name)) {
            deps[name] = { version: pkg.dependencies[name].replace(/[\^~]/, '') || '*' };
          }
        });
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  return deps;
}

// Default App.js content if no entry file exists
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

export function ExpoSnackPreview({ className = '' }: ExpoSnackPreviewProps) {
  const { files } = useProjectStore();
  const webPreviewRef = useRef<Window | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const snackRef = useRef<Snack | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webPreviewURL, setWebPreviewURL] = useState<string | undefined>(undefined);
  const [expoURL, setExpoURL] = useState<string | undefined>(undefined);
  const [showQR, setShowQR] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  
  // Transform files to Snack format
  const snackFiles = useMemo(() => {
    const transformed = transformFilesToSnack(files);
    
    // Ensure we have an entry file
    const hasAppJs = Object.keys(transformed).some(path => 
      path === 'App.js' || path === 'App.tsx'
    );
    
    // If using Expo Router, check for app/index
    const hasExpoRouter = Object.keys(transformed).some(path => 
      path.startsWith('app/') && (path.endsWith('index.tsx') || path.endsWith('index.js'))
    );
    
    if (!hasAppJs && !hasExpoRouter) {
      transformed['App.js'] = {
        type: 'CODE',
        contents: DEFAULT_APP,
      };
    }
    
    return transformed;
  }, [files]);
  
  // Extract dependencies
  const dependencies = useMemo(() => extractDependencies(files), [files]);
  
  // Initialize Snack
  useEffect(() => {
    // Create Snack instance
    const snack = new Snack({
      files: snackFiles,
      dependencies,
      sdkVersion: SDK_VERSION,
      webPreviewRef,
      online: true,
      codeChangesDelay: 1000, // Debounce updates
    });
    
    snackRef.current = snack;
    
    // Listen to state changes
    const unsubscribe = snack.addStateListener((state, prevState) => {
      // Update web preview URL
      if (state.webPreviewURL !== prevState.webPreviewURL) {
        setWebPreviewURL(state.webPreviewURL);
        if (state.webPreviewURL) {
          setIsLoading(false);
        }
      }
      
      // Update Expo URL for QR code
      if (state.url !== prevState.url) {
        setExpoURL(state.url);
      }
      
      // Track connected clients
      const clientCount = Object.keys(state.connectedClients || {}).length;
      if (clientCount !== connectedClients) {
        setConnectedClients(clientCount);
      }
    });
    
    // Initial state
    const initialState = snack.getState();
    setWebPreviewURL(initialState.webPreviewURL);
    setExpoURL(initialState.url);
    
    // Set loading false after a timeout if URL doesn't arrive
    const timeout = setTimeout(() => {
      if (!webPreviewURL) {
        setIsLoading(false);
      }
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      unsubscribe();
      snack.setOnline(false);
      snackRef.current = null;
    };
  }, []); // Only run once on mount
  
  // Update files when they change
  useEffect(() => {
    if (snackRef.current) {
      snackRef.current.updateFiles(snackFiles);
    }
  }, [snackFiles]);
  
  // Update dependencies when they change
  useEffect(() => {
    if (snackRef.current) {
      snackRef.current.updateDependencies(dependencies);
    }
  }, [dependencies]);
  
  // Handle iframe ref - update mutable ref
  const handleIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    (iframeRef as React.MutableRefObject<HTMLIFrameElement | null>).current = iframe;
    (webPreviewRef as React.MutableRefObject<Window | null>).current = iframe?.contentWindow ?? null;
  }, []);
  
  // Refresh preview
  const handleRefresh = useCallback(() => {
    if (snackRef.current) {
      setIsLoading(true);
      snackRef.current.sendCodeChanges();
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, []);
  
  if (error) {
    return (
      <div className={`h-full w-full flex items-center justify-center bg-[#0a0a0a] ${className}`}>
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
    <div className={`h-full w-full flex flex-col bg-[#050505] ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center bg-[#0a0a0a] border border-[#27272a] rounded-lg shadow-xl p-1 gap-1">
          {/* Status */}
          <div className="flex items-center gap-2 px-2 py-1 border-r border-[#27272a] mr-1">
            {isLoading ? (
              <>
                <Loader2 size={10} className="animate-spin text-yellow-400" />
                <span className="text-yellow-400 font-medium text-[11px]">Loading</span>
              </>
            ) : (
              <>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </div>
                <span className="text-gray-200 font-medium text-[11px]">Live</span>
              </>
            )}
            {connectedClients > 0 && (
              <span className="text-[10px] text-blue-400 ml-1">
                {connectedClients} device{connectedClients > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Refresh */}
          <button 
            onClick={handleRefresh}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#27272a] rounded"
            title="Refresh preview"
          >
            <RefreshCw size={12} />
          </button>
          
          {/* QR Toggle */}
          <button 
            onClick={() => setShowQR(!showQR)}
            className={`p-1 hover:bg-[#27272a] rounded ${showQR ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
            title="Show QR code for Expo Go"
          >
            <QrCode size={12} />
          </button>
        </div>
      </div>
      
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Phone Frame */}
        <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] border-[6px] border-[#18181b] shadow-[0_0_100px_-30px_rgba(0,0,0,0.7)] overflow-hidden ring-1 ring-white/5 z-10 scale-[0.65] origin-center">
          {/* Dynamic Island */}
          <div className="absolute top-[11px] left-1/2 transform -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-[20px] z-50" />
          
          {/* Status Bar */}
          <div className="absolute top-0 w-full h-12 z-40 flex justify-between items-end px-6 pb-2">
            <div className="text-white text-[13px] font-semibold pl-2">9:41</div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-2.5 rounded-[3px] border border-white/30 relative p-[1px]">
                <div className="bg-white w-full h-full rounded-[1px]" />
              </div>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="absolute inset-0 pt-12 pb-8 bg-[#0a0a0a] overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p className="text-sm font-medium">Starting Expo...</p>
                  <p className="text-xs mt-1">This may take a moment</p>
                </div>
              </div>
            ) : webPreviewURL ? (
              <iframe
                ref={handleIframeRef}
                src={webPreviewURL}
                className="w-full h-full border-0 bg-[#0a0a0a]"
                title="Expo Snack Preview"
                allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Globe className="w-8 h-8 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">Preview unavailable</p>
                  <p className="text-xs mt-1">Connecting to Expo...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[130px] h-[5px] bg-white/90 rounded-full z-50" />
        </div>
        
        {/* QR Code Panel */}
        {showQR && expoURL && (
          <div className="absolute right-4 top-20 z-30 bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 shadow-xl">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Smartphone size={14} />
              Test on your phone
            </h3>
            
            <div className="bg-white p-3 rounded-lg mb-3">
              <QRCodeSVG
                value={expoURL}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>
            
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="bg-[#27272a] text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
                <span>Open Camera app on your device</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-[#27272a] text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
                <span>Scan the QR code above to view</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-[#27272a]">
              <p className="text-[10px] text-gray-500 flex items-start gap-1">
                <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                Browser preview lacks native functions & looks different. Test on device for the best results.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Mode Toggle */}
      <div className="p-4 flex justify-center">
        <div className="flex items-center bg-[#18181b] rounded-lg border border-[#27272a] p-1">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-[#27272a] text-white"
            title="Instant preview"
          >
            <Globe size={14} />
            Instant
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-gray-200"
            title="Full Expo preview"
          >
            <Smartphone size={14} />
            Full
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${showQR ? 'bg-[#27272a] text-white' : 'text-gray-400 hover:text-gray-200'}`}
            title="Device QR code"
          >
            <QrCode size={14} />
            Device
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpoSnackPreview;
