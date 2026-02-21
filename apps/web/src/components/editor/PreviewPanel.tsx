'use client';

import { useMemo, useState } from 'react';
import { Loader2, AlertCircle, FileCode2, Check, Smartphone, Tablet, Sparkles } from 'lucide-react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { useProjectStore } from '@/stores/projectStore';
import { useAgentStore } from '@/stores/agentStore';

interface PreviewPanelProps {
  projectId: string;
  onExpoURLChange?: (url: string | undefined) => void;
  onDevicesChange?: (count: number) => void;
}

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

const EXPO_APP_ENTRY = `import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
`;

const EXPO_APP_JSON = `{
  "expo": {
    "name": "RorkApp",
    "slug": "rork-app",
    "scheme": "rorkapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-router"
    ]
  }
}`;

const EXPO_BABEL_CONFIG = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;

export function PreviewPanel({ projectId, onExpoURLChange, onDevicesChange }: PreviewPanelProps) {
  const { files, generatingFiles } = useProjectStore();
  const { isRunning: isAgentRunning } = useAgentStore();

  const isGenerating = isAgentRunning;
  const hasRealFiles = Object.keys(files).length > 0;
  const [deviceSize, setDeviceSize] = useState<'phone' | 'tablet'>('phone');

  // Map the files to Sandpack format.
  // We use the "react-ts" template which has a standard web bundler.
  // To make it run React Native, we override package.json to include react-native-web
  // and map the files accordingly.
  const sandpackFiles = useMemo(() => {
    const sFiles: Record<string, string | { code: string; hidden?: boolean }> = {};
    
    let hasPackageJson = false;

    // Add user generated files
    Object.values(files).forEach((file) => {
      let path = file.path.startsWith('/') ? file.path : `/${file.path}`;
      
      // Keep track if AI wrote its own package.json
      if (path === '/package.json') {
        hasPackageJson = true;
        // Intercept package.json to inject required web dependencies for sandpack to work
        try {
          const pkg = JSON.parse(file.content);
          pkg.dependencies = {
            ...pkg.dependencies,
            "react-native-web": "latest",
            "expo-router": "latest",
            "expo": "latest",
            "react-native-safe-area-context": "latest",
            "react-native-screens": "latest",
            "@expo/metro-runtime": "latest",
          };
          sFiles[path] = JSON.stringify(pkg, null, 2);
          return;
        } catch(e) {
          // If parse fails, just use original
        }
      }
      
      sFiles[path] = file.content;
    });

    const hasExpoRouter = Object.keys(files).some(p => p.startsWith('app/') || p.startsWith('/app/'));

    // Inject base Expo files if not present
    if (!hasPackageJson) {
      const baseDeps = {
        "react": "18.2.0",
        "react-dom": "18.2.0",
        "react-native": "0.74.5",
        "react-native-web": "0.19.12",
        "expo": "~51.0.28",
        "expo-status-bar": "~1.12.1",
        "@expo/vector-icons": "^14.0.2",
        "expo-router": "~3.5.23",
        "react-native-safe-area-context": "4.10.5",
        "react-native-screens": "3.31.1"
      };

      sFiles['/package.json'] = {
        code: JSON.stringify({
          name: "rork-app",
          main: "expo-router/entry",
          dependencies: baseDeps
        }, null, 2),
        hidden: true
      };
    }

    if (hasExpoRouter && !sFiles['/index.js'] && !sFiles['/index.tsx']) {
      sFiles['/index.js'] = {
        code: EXPO_APP_ENTRY,
        hidden: true
      };
    }

    if (!sFiles['/app.json']) {
      sFiles['/app.json'] = { code: EXPO_APP_JSON, hidden: true };
    }
    
    if (!sFiles['/babel.config.js']) {
      sFiles['/babel.config.js'] = { code: EXPO_BABEL_CONFIG, hidden: true };
    }

    // Default app if completely empty
    if (!hasRealFiles) {
      sFiles['/App.tsx'] = DEFAULT_APP;
      sFiles['/package.json'] = {
        code: JSON.stringify({
          main: "App.tsx",
          dependencies: {
            "react": "18.2.0",
            "react-native": "0.74.5",
            "react-native-web": "0.19.12",
            "expo-status-bar": "~1.12.1"
          }
        }, null, 2),
        hidden: true
      };
    }

    return sFiles;
  }, [files, hasRealFiles]);

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a1d]">
      {/* Top bar */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[#27272a] bg-[#0f0f11] flex-shrink-0">
        <div className="flex items-center gap-2">
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
        {/* Device Frame */}
        <div className={`relative bg-black border-[3px] border-[#333] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-10 ${
          deviceSize === 'tablet'
            ? 'w-[580px] h-[760px] rounded-[24px]'
            : 'w-[320px] h-[693px] rounded-[40px]'
        }`}>
          <div className={`absolute inset-0 bg-[#0a0a0a] overflow-hidden ${deviceSize === 'tablet' ? 'rounded-[21px]' : 'rounded-[37px]'}`}>
            
            <SandpackProvider 
              template="react-ts" 
              theme="dark"
              files={sandpackFiles}
              customSetup={{
                dependencies: {
                  "react-native-web": "latest",
                }
              }}
              options={{
                classes: {
                  "sp-wrapper": "h-full w-full",
                  "sp-layout": "h-full w-full rounded-none border-none",
                  "sp-preview-container": "h-full w-full bg-[#0a0a0a]",
                  "sp-preview-iframe": "h-full w-full border-none",
                }
              }}
            >
              <SandpackLayout>
                <SandpackPreview 
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  className="h-full w-full"
                />
              </SandpackLayout>
            </SandpackProvider>

            {/* Building overlay */}
            {isGenerating && (
              <div className="absolute inset-0 z-30 flex flex-col bg-[#0a0a0a]/90 backdrop-blur-sm">
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <div className="relative mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                      <FileCode2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 opacity-30 animate-ping" />
                  </div>
                  
                  <p className="text-white font-semibold text-sm mb-1">Building your app</p>
                  <p className="text-gray-500 text-xs mb-5">Rork is writing code...</p>
                  
                  {generatingFiles.length > 0 && (
                    <div className="w-full max-w-[240px] space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                      {generatingFiles.map((filePath) => (
                         <div 
                           key={filePath}
                           className="flex items-center gap-2 text-xs animate-fade-in"
                         >
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

            {!hasRealFiles && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-20">
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

          </div>
        </div>
      </div>
    </div>
  );
}
