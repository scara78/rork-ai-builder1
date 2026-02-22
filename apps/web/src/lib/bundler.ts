import * as esbuild from 'esbuild';
import { createClient } from '@/lib/supabase/server';

interface BundleOptions {
  projectId: string;
  accessToken?: string;
}

// Banned packages that crash esbuild / Vite or have no web equivalents
const IGNORED_PACKAGES = new Set([
  'expo', 'expo-router', 'expo-status-bar', 'expo-constants',
  'expo-font', 'expo-asset', 'expo-file-system', 'expo-updates',
  'expo-splash-screen', 'expo-camera', 'expo-haptics',
  'expo-image-picker', 'expo-linking',
  'react-native-screens', 'react-native-safe-area-context',
  'react-native-gesture-handler', 'react-native-reanimated',
  '@react-native-async-storage/async-storage',
  '@tamagui/core', 'tamagui', 'nativewind', 'tailwindcss',
  'expo-symbols', 'react-native-svg', 'react-native-maps',
  '@shopify/flash-list',
]);

async function getProjectFiles(projectId: string, accessToken?: string): Promise<Record<string, string>> {
  // Use admin client if no user token, otherwise use authenticated client
  // Wait, createClient() inside an API route will read cookies for auth automatically.
  // But we also pass accessToken explicitly just in case.
  const supabase = await createClient();
  
  const { data: files, error } = await supabase
    .from('project_files')
    .select('path, content')
    .eq('project_id', projectId);

  if (error || !files) {
    throw new Error('Failed to load project files');
  }

  const fileMap: Record<string, string> = {};
  files.forEach((f) => {
    let normalizedPath = f.path.startsWith('/') ? f.path : `/${f.path}`;
    fileMap[normalizedPath] = f.content;
  });

  return fileMap;
}

function normalizePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      stack.pop();
    } else if (part !== '.') {
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}

export async function bundleProject(options: BundleOptions): Promise<string> {
  const { projectId, accessToken } = options;

  try {
    const files = await getProjectFiles(projectId, accessToken);
    const filePaths = Object.keys(files);

    if (filePaths.length === 0) {
      return `<!DOCTYPE html><html><body><h1>Project is Empty</h1><p>No files found.</p></body></html>`;
    }

    const errorReporterScript = `<script>
(function(){
  function send(type, message, stack){
    try {
      parent.postMessage({ source:'rork-preview', type, message: String(message||''), stack: stack?String(stack):'' }, '*');
    } catch(e){}
  }
  window.addEventListener('error', function(e){
    send('preview-error', (e && (e.error && e.error.message)) || (e && e.message) || 'Runtime error', (e && e.error && e.error.stack) || '');
  });
  window.addEventListener('unhandledrejection', function(e){
    var reason = e && e.reason;
    send('preview-error', (reason && reason.message) || String(reason) || 'Unhandled rejection', (reason && reason.stack) || '');
  });
})();
</script>`;

    const importMapScript = `<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-native": "https://esm.sh/react-native-web@0.19.13?external=react,react-dom",
    "react-native-web": "https://esm.sh/react-native-web@0.19.13?external=react,react-dom",
    "lucide-react-native": "https://esm.sh/lucide-react-native@0.475.0?external=react,react-native",
    "three": "https://esm.sh/three@0.160.0",
    "@react-three/fiber": "https://esm.sh/@react-three/fiber@8.15.14?external=react,react-dom,three",
    "@react-three/drei": "https://esm.sh/@react-three/drei@9.96.1?external=react,react-dom,three,@react-three/fiber"
  }
}
</script>`;

    // Special web entry point for React Native Web
    const VIRTUAL_ENTRY_ID = '/__rork_entry__.tsx';
    
    // Find App.tsx or App.js
    const appEntry = filePaths.find(p => p === '/App.tsx' || p === '/App.js');
    
    if (!appEntry) {
      return `<!DOCTYPE html><html><body><h1>Build Error</h1><p>App.tsx not found in project.</p></body></html>`;
    }

    const appImportPath = appEntry.replace(/\.(tsx|ts|js)$/, '');

    const virtualEntryContent = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '.${appImportPath}';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`;

    files[VIRTUAL_ENTRY_ID] = virtualEntryContent;
    filePaths.push(VIRTUAL_ENTRY_ID);

    const tryResolveProjectPath = (base: string): string | null => {
      const exts = ['.tsx', '.ts', '.jsx', '.js'];
      const indexExts = ['/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      
      // Exact match first
      if (files[base]) return base;
      
      // Add extensions
      for (const ext of exts) {
        if (files[base + ext]) return base + ext;
      }
      
      // Add index + extensions
      for (const idx of indexExts) {
        const p = base.replace(/\/+$/, '') + idx;
        if (files[p]) return p;
      }
      
      return null;
    };

    const mapAlias = (p: string): string => {
      if (p.startsWith('@/')) return '/' + p.slice(2);
      if (p.startsWith('~/')) return '/' + p.slice(2);
      if (!p.startsWith('/')) return '/' + p;
      return p;
    };

    const virtualFsPlugin: esbuild.Plugin = {
      name: 'virtual-fs',
      setup(build) {
        // Resolve requests
        build.onResolve({ filter: /.*/ }, (args) => {
          let req = args.path;

          // External packages via esm.sh
          if (req.startsWith('http')) return { path: req, external: true };

          // Core packages that are in the import map -> keep them bare
          if (['react', 'react-dom', 'react-dom/client', 'react-native', 'react-native-web', 'lucide-react-native', 'three', '@react-three/fiber', '@react-three/drei'].includes(req)) {
            return { path: req, external: true };
          }

          // Ignored packages -> return empty module
          if (IGNORED_PACKAGES.has(req) || req.startsWith('@expo/vector-icons')) {
            return { path: req, namespace: 'empty-module' };
          }

          // Resolve relative or aliased local paths
          if (args.path.startsWith('.')) {
            const importer = args.importer.replace(/\\/g, '/');
            const importerDir = importer.substring(0, importer.lastIndexOf('/'));
            const resolvedBase = normalizePath((importerDir ? importerDir + '/' : '') + args.path);
            const hit = tryResolveProjectPath(resolvedBase);
            if (hit) return { path: hit, namespace: 'virtual-fs' };
          } else {
            // Not a relative path, could be an alias
            const reqMapped = mapAlias(req);
            const projHit = tryResolveProjectPath(reqMapped);
            if (projHit) return { path: projHit, namespace: 'virtual-fs' };
            
            // If it's a bare specifier not in our system, assume npm package and rewrite to esm.sh
            if (!req.startsWith('/') && !req.startsWith('.')) {
              return { path: `https://esm.sh/${req}?external=react,react-native,react-native-web`, external: true };
            }
          }
          
          return null; // Let esbuild handle or fail
        });

        // Load virtual files
        build.onLoad({ filter: /.*/, namespace: 'virtual-fs' }, (args) => {
          const content = files[args.path];
          const isTSX = args.path.endsWith('.tsx');
          const isTS = args.path.endsWith('.ts');
          const isJSX = args.path.endsWith('.jsx');
          const isJS = args.path.endsWith('.js');
          const loader: esbuild.Loader = (isTSX && 'tsx') || (isTS && 'ts') || (isJSX && 'jsx') || (isJS && 'js') || 'tsx';
          
          return { contents: content, loader, resolveDir: '/' };
        });

        // Load empty modules for ignored packages
        build.onLoad({ filter: /.*/, namespace: 'empty-module' }, () => {
          return { 
            contents: `
              export default new Proxy({}, {
                get: function(target, prop) {
                  return function() { return null; };
                }
              });
              export const Ionicons = () => null;
              export const MaterialIcons = () => null;
              export const FontAwesome = () => null;
              export const Feather = () => null;
            `, 
            loader: 'js' 
          };
        });
      },
    };

    const result = await esbuild.build({
      entryPoints: [VIRTUAL_ENTRY_ID],
      bundle: true,
      write: false,
      outdir: 'out',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      plugins: [virtualFsPlugin],
      define: {
        'process.env.NODE_ENV': '"development"',
        '__DEV__': 'true',
        'process.env': '{}' 
      },
      jsx: 'automatic',
      logLevel: 'warning',
    });

    const jsCode = result.outputFiles.find((f) => f.path.endsWith('.js'))?.text || '';
    
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Preview</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { width: 100%; height: 100%; overflow: hidden; background-color: #0a0a0a; }
      ::-webkit-scrollbar { display: none; }
      body { -ms-overflow-style: none; scrollbar-width: none; font-family: -apple-system, system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    ${errorReporterScript}
    ${importMapScript}
    <script type="module">${jsCode}</script>
  </body>
</html>`;

  } catch (error) {
    console.error('Bundle Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const safeError = errorMessage.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/</g, '\\<');
    
    return `<!DOCTYPE html>
<html>
  <head><title>Build Error</title></head>
  <body style="color:#f87171; background:#450a0a; padding:20px; font-family: monospace;">
    <script>
      try {
        parent.postMessage({ source: 'rork-preview', type: 'preview-error', message: \`Build Error:\\n\${${JSON.stringify(errorMessage)}}\` }, '*');
      } catch(e) {}
    </script>
    <h2>Build Error</h2>
    <pre style="white-space: pre-wrap; font-size: 12px;">${errorMessage}</pre>
  </body>
</html>`;
  }
}
