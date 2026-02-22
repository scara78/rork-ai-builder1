'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Loader2, RefreshCw, AlertCircle, FileCode2, Check, Smartphone, Tablet, Sparkles } from 'lucide-react';
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAgentStore } from '@/stores/agentStore';

interface PreviewPanelProps {
  projectId: string;
  onExpoURLChange?: (url: string | undefined) => void;
  onDevicesChange?: (count: number) => void;
}

// ─── Sandpack Template ───────────────────────────────────────────────────────
// We embed a Vite + React Native Web template directly. Sandpack bundles
// everything in-browser (no server required, $0 cost).

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  define: {
    __DEV__: JSON.stringify(true),
    'process.env': JSON.stringify({}),
  },
});
`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Rork Preview</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root {
        width: 100%; height: 100%;
        overflow: hidden;
        background-color: #0a0a0a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      /* Hide scrollbars for mobile-like feel */
      ::-webkit-scrollbar { display: none; }
      body { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native-web';
import App from './App';

// Register with RN web's AppRegistry for proper initialization
AppRegistry.registerComponent('RorkApp', () => App);
const { element, getStyleElement } = AppRegistry.getApplication('RorkApp');

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    {element}
  </React.StrictMode>
);
`;

const DEFAULT_APP = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Rork</Text>
      <Text style={styles.subtitle}>Your app will appear here</Text>
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

// Packages that Sandpack should not try to resolve (they cause errors in the
// browser environment or have no web equivalent)
const IGNORED_PACKAGES = new Set([
  'expo', 'expo-router', 'expo-status-bar', 'expo-constants',
  'expo-font', 'expo-asset', 'expo-file-system', 'expo-updates',
  'expo-splash-screen', 'expo-camera', 'expo-haptics',
  'expo-image-picker', 'expo-linking',
  'react-native-screens', 'react-native-safe-area-context',
  'react-native-gesture-handler', 'react-native-reanimated',
  '@react-native-async-storage/async-storage',
  'lucide-react-native', 'lucide-react',
  '@tamagui/core', 'tamagui', 'nativewind', 'tailwindcss',
  'expo-symbols', 'react-native-svg', 'react-native-maps',
  '@shopify/flash-list',
]);

// ─── File Transformation ─────────────────────────────────────────────────────

/**
 * Convert project files from the store into Sandpack's file format.
 *
 * Key decisions:
 * - Skip binary assets and config files that Vite doesn't need
 * - Detect expo-router style projects (app/ directory) and generate a
 *   simple state-based router wrapper since Vite can't do file-system routing
 * - Always ensure an App.tsx exists as the entry point
 */
function transformFilesForSandpack(
  files: Record<string, { path: string; content: string }>
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.values(files).forEach((file) => {
    let path = file.path.startsWith('/') ? file.path : `/${file.path}`;

    // Skip binary assets and build configs
    if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) return;
    if (['/babel.config.js', '/metro.config.js', '/tsconfig.json', '/app.json'].includes(path)) return;

    // Skip package.json — we handle dependencies separately
    if (path === '/package.json') return;

    result[path] = file.content;
  });

  // Detect expo-router style project (has files in /app/ directory)
  const appDirFiles = Object.keys(result).filter(
    (p) => p.startsWith('/app/') && (p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.js'))
  );

  const hasAppEntry = result['/App.tsx'] || result['/App.js'];

  if (appDirFiles.length > 0 && !hasAppEntry) {
    // Generate a simple wrapper that imports the main tab index screen
    // This bridges expo-router's file-based routing into a single-entry Vite app
    const indexScreen = appDirFiles.find(
      (p) => p.includes('(tabs)/index') || p === '/app/index.tsx' || p === '/app/index.js'
    );

    if (indexScreen) {
      const importPath = indexScreen.replace(/\.(tsx|ts|js)$/, '');
      result['/App.tsx'] = `import React from 'react';
import Screen from '${importPath}';

export default function App() {
  return <Screen />;
}
`;
    } else {
      result['/App.tsx'] = DEFAULT_APP;
    }
  } else if (!hasAppEntry) {
    result['/App.tsx'] = DEFAULT_APP;
  }

  return result;
}

/**
 * Extract npm dependencies from the project's package.json.
 * Only include packages that work in a browser/Vite environment.
 */
function extractSandpackDeps(
  files: Record<string, { path: string; content: string }>
): Record<string, string> {
  const deps: Record<string, string> = {
    // Core RN Web deps — always needed
    'react-native-web': 'latest',
    '@expo/vector-icons': '^14.0.2',
  };

  const packageFile = Object.values(files).find(
    (f) => f.path === 'package.json' || f.path === '/package.json'
  );

  if (packageFile) {
    try {
      const pkg = JSON.parse(packageFile.content);
      if (pkg.dependencies) {
        Object.entries(pkg.dependencies).forEach(([name, version]) => {
          // Skip core packages (provided by Sandpack), ignored packages,
          // and react-native itself (we alias it to react-native-web)
          if (
            ['react', 'react-dom', 'react-native'].includes(name) ||
            IGNORED_PACKAGES.has(name)
          ) {
            return;
          }
          deps[name] = String(version).replace(/[\^~]/, '') || 'latest';
        });
      }
    } catch {
      /* ignore parse errors */
    }
  }

  // Common RN ecosystem packages that have web equivalents
  // expo-linear-gradient → react-native-web-linear-gradient (or just skip)
  // expo-blur → skip (BlurView renders as transparent <View> on web anyway)
  // expo-image → use regular img on web
  // expo-av → skip

  return deps;
}

// ─── Inner Component (needs useSandpack hook inside SandpackProvider) ────────

function SandpackStatusBridge({
  onStatusChange,
}: {
  onStatusChange: (status: 'idle' | 'running' | 'error') => void;
}) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    if (sandpack.status === 'running') {
      onStatusChange('running');
    } else if (sandpack.status === 'idle') {
      onStatusChange('idle');
    }
  }, [sandpack.status, onStatusChange]);

  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PreviewPanel({ projectId, onExpoURLChange, onDevicesChange }: PreviewPanelProps) {
  const { files, generatingFiles } = useProjectStore();
  const { isRunning: isAgentRunning } = useAgentStore();

  const isGenerating = isAgentRunning;
  const hasRealFiles = Object.keys(files).length > 0;

  const [sandpackStatus, setSandpackStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [deviceSize, setDeviceSize] = useState<'phone' | 'tablet'>('phone');
  const [refreshKey, setRefreshKey] = useState(0);

  // Whether the Sandpack preview has loaded at least once
  const hasLoaded = sandpackStatus === 'running';

  const handleStatusChange = useCallback((status: 'idle' | 'running' | 'error') => {
    setSandpackStatus(status);
  }, []);

  // Transform project files into Sandpack format
  const sandpackFiles = useMemo(() => {
    const userFiles = transformFilesForSandpack(files);
    return {
      // Vite infrastructure files
      '/vite.config.ts': VITE_CONFIG,
      '/index.html': INDEX_HTML,
      '/main.tsx': MAIN_TSX,
      // User's project files (may override App.tsx)
      ...userFiles,
    };
  }, [files]);

  const sandpackDeps = useMemo(() => extractSandpackDeps(files), [files]);

  const handleRefresh = useCallback(() => {
    setSandpackStatus('idle');
    setRefreshKey((k) => k + 1);
  }, []);

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
          ) : !hasLoaded ? (
            <div className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-yellow-400" />
              <span className="text-yellow-400 font-medium text-xs">Loading</span>
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
            {/* Sandpack Preview — always rendered but hidden by overlays until ready */}
            {hasRealFiles && (
              <SandpackProvider
                key={refreshKey}
                template="vite-react-ts"
                files={sandpackFiles}
                customSetup={{
                  dependencies: {
                    'react': 'latest',
                    'react-dom': 'latest',
                    ...sandpackDeps,
                  },
                  devDependencies: {
                    '@vitejs/plugin-react': 'latest',
                  },
                }}
                options={{
                  externalResources: [],
                  recompileMode: 'delayed',
                  recompileDelay: 500,
                }}
                theme="dark"
              >
                <SandpackStatusBridge onStatusChange={handleStatusChange} />
                <div className="w-full h-full [&_.sp-preview-container]:!h-full [&_.sp-preview-iframe]:!h-full [&_.sp-stack]:!h-full [&>div]:!h-full">
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton={false}
                    showOpenInCodeSandbox={false}
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
              </SandpackProvider>
            )}

            {/*
              OVERLAY LOGIC — Priority order:
              1. Building: agent is running → "Building your app..." with file list
              2. No files: nothing generated yet → "No app yet" empty state
              3. Loading: has files but Sandpack not running yet → "Loading preview..."
              4. Connected: Sandpack running → show preview (no overlay)
            */}

            {/* Building overlay — agent is actively generating */}
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

            {/* Empty state — no files generated yet, agent not running */}
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

            {/* Loading overlay — has files, but Sandpack not yet running */}
            {!isGenerating && hasRealFiles && !hasLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center text-gray-500 px-6">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                  <p className="text-sm font-medium text-gray-300">Loading preview...</p>
                  <p className="text-xs mt-1 text-gray-500">Bundling with Vite</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
