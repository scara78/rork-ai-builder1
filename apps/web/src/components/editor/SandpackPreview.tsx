'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface SandpackPreviewProps {
  className?: string;
  showNavigator?: boolean;
}

// Generate HTML that runs React Native Web in an iframe
function generatePreviewHTML(appCode: string): string {
  // Escape backticks and backslashes for template literal
  const escapedCode = appCode
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>App Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { 
      width: 100%; 
      height: 100%; 
      background: #000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    /* React Native Web resets */
    #root > div { display: flex; flex: 1; min-height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- React Native Web -->
  <script crossorigin src="https://unpkg.com/react-native-web@0.19.12/dist/react-native-web.umd.min.js"></script>
  
  <!-- Babel Standalone for JSX -->
  <script crossorigin src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  
  <script type="text/babel" data-presets="react">
    const { 
      View, 
      Text, 
      StyleSheet, 
      ScrollView, 
      TouchableOpacity,
      TextInput,
      Image,
      SafeAreaView,
      FlatList,
      ActivityIndicator,
      Pressable,
      Platform,
      Dimensions,
      StatusBar,
    } = window.ReactNativeWeb;
    
    const React = window.React;
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    
    // Mock expo-linear-gradient
    const LinearGradient = ({ colors, style, children, ...props }) => {
      const gradientStyle = colors && colors.length >= 2 
        ? { background: \`linear-gradient(180deg, \${colors.join(', ')})\` }
        : {};
      return React.createElement(View, { style: [style, gradientStyle], ...props }, children);
    };
    
    // Mock expo-blur
    const BlurView = ({ intensity = 50, tint = 'dark', style, children, ...props }) => {
      const blurStyle = {
        backdropFilter: \`blur(\${intensity / 10}px)\`,
        WebkitBackdropFilter: \`blur(\${intensity / 10}px)\`,
        backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
      };
      return React.createElement(View, { style: [style, blurStyle], ...props }, children);
    };
    
    // Mock expo-haptics
    const Haptics = {
      impactAsync: () => Promise.resolve(),
      notificationAsync: () => Promise.resolve(),
      selectionAsync: () => Promise.resolve(),
    };
    
    // Mock expo-router Link
    const Link = ({ href, children, style, asChild, ...props }) => {
      if (asChild && React.Children.count(children) === 1) {
        return React.cloneElement(children, { onPress: () => console.log('Navigate to:', href) });
      }
      return React.createElement(TouchableOpacity, { 
        onPress: () => console.log('Navigate to:', href),
        style,
        ...props 
      }, children);
    };
    
    // Mock useRouter
    const useRouter = () => ({
      push: (path) => console.log('router.push:', path),
      replace: (path) => console.log('router.replace:', path),
      back: () => console.log('router.back'),
    });
    
    // Mock Ionicons
    const Ionicons = ({ name, size = 24, color = '#fff' }) => {
      const iconMap = {
        'home': '🏠',
        'home-outline': '🏠',
        'search': '🔍',
        'search-outline': '🔍',
        'person': '👤',
        'person-outline': '👤',
        'settings': '⚙️',
        'settings-outline': '⚙️',
        'add': '+',
        'add-circle': '⊕',
        'add-circle-outline': '⊕',
        'close': '✕',
        'close-circle': '⊗',
        'chevron-back': '‹',
        'chevron-forward': '›',
        'chevron-down': '⌄',
        'chevron-up': '⌃',
        'checkmark': '✓',
        'checkmark-circle': '✓',
        'heart': '❤️',
        'heart-outline': '♡',
        'star': '★',
        'star-outline': '☆',
        'trash': '🗑',
        'trash-outline': '🗑',
        'create': '✏️',
        'create-outline': '✏️',
        'menu': '☰',
        'menu-outline': '☰',
        'notifications': '🔔',
        'notifications-outline': '🔔',
        'mail': '✉️',
        'mail-outline': '✉️',
        'calendar': '📅',
        'calendar-outline': '📅',
        'time': '🕐',
        'time-outline': '🕐',
        'location': '📍',
        'location-outline': '📍',
        'camera': '📷',
        'camera-outline': '📷',
        'image': '🖼',
        'image-outline': '🖼',
        'play': '▶',
        'pause': '⏸',
        'stop': '⏹',
      };
      return React.createElement(Text, { 
        style: { fontSize: size, color, textAlign: 'center', width: size, height: size, lineHeight: size } 
      }, iconMap[name] || '●');
    };
    
    // Mock @expo/vector-icons
    const FontAwesome = Ionicons;
    const MaterialIcons = Ionicons;
    const Feather = Ionicons;
    
    // User's App Code
    ${escapedCode}
  </script>
  
  <script>
    window.onerror = function(msg, url, line, col, error) {
      document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #ef4444; font-family: monospace; font-size: 12px;"><strong>Error:</strong><br>' + msg + '<br><br>Line: ' + line + '</div>';
      return true;
    };
  </script>
</body>
</html>`;
}

// Transform project files to a simple React component
function transformToPreviewCode(files: Record<string, { path: string; content: string }>): string {
  // Find the main entry file
  const fileList = Object.values(files);
  
  // Priority: app/index.tsx > app/(tabs)/index.tsx > App.tsx > App.js
  const mainFile = 
    fileList.find(f => f.path === 'app/index.tsx' || f.path === '/app/index.tsx') ||
    fileList.find(f => f.path === 'app/(tabs)/index.tsx' || f.path === '/app/(tabs)/index.tsx') ||
    fileList.find(f => f.path.toLowerCase().includes('app.tsx')) ||
    fileList.find(f => f.path.toLowerCase().includes('app.js'));
  
  if (!mainFile) {
    // Return default welcome screen
    return `
function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>Welcome to Rork</Text>
      <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>Your app will appear here when you start building</Text>
    </View>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
`;
  }
  
  let code = mainFile.content;
  
  // Remove TypeScript types
  code = code
    .replace(/:\s*React\.FC\b/g, '')
    .replace(/:\s*\w+\[\]/g, '')
    .replace(/:\s*\w+\s*\|/g, '')
    .replace(/<\w+>/g, '') // Remove generic types
    .replace(/:\s*(string|number|boolean|any|void|null|undefined)\b/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/as\s+\w+/g, '');
  
  // Remove all import statements (we provide globals)
  code = code.replace(/^import\s+.*$/gm, '');
  
  // Remove export statements but keep the content
  code = code.replace(/export\s+default\s+/g, '');
  code = code.replace(/export\s+/g, '');
  
  // Find the main component name
  const componentMatch = code.match(/(?:function|const)\s+(\w+)/);
  const componentName = componentMatch ? componentMatch[1] : 'App';
  
  // Add render call
  code += `

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(${componentName}));
`;
  
  return code;
}

export function SandpackPreview({ className = '', showNavigator = false }: SandpackPreviewProps) {
  const { files } = useProjectStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  
  // Generate preview HTML
  const previewHTML = useMemo(() => {
    try {
      const appCode = transformToPreviewCode(files);
      return generatePreviewHTML(appCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
      return null;
    }
  }, [files]);
  
  // Create blob URL for iframe
  const blobUrl = useMemo(() => {
    if (!previewHTML) return null;
    const blob = new Blob([previewHTML], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [previewHTML]);
  
  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);
  
  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load preview');
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    setKey(k => k + 1);
  };
  
  if (error) {
    return (
      <div className={`h-full w-full flex items-center justify-center bg-[#0a0a0a] ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm mb-2">Preview Error</p>
          <p className="text-gray-500 text-xs">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-3 py-1.5 bg-white/10 text-white rounded text-xs hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`h-full w-full relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading preview...</p>
          </div>
        </div>
      )}
      
      {blobUrl && (
        <iframe
          key={key}
          ref={iframeRef}
          src={blobUrl}
          className="w-full h-full border-0 bg-[#0a0a0a]"
          title="App Preview"
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

export default SandpackPreview;
