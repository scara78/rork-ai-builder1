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
  function sendConsole(type, args) {
    try {
      const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      parent.postMessage({ source: 'rork-preview-console', type, message: msg }, '*');
    } catch(e) {}
  }
  window.addEventListener('error', function(e){
    send('preview-error', (e && (e.error && e.error.message)) || (e && e.message) || 'Runtime error', (e && e.error && e.error.stack) || '');
  });
  window.addEventListener('unhandledrejection', function(e){
    var reason = e && e.reason;
    send('preview-error', (reason && reason.message) || String(reason) || 'Unhandled rejection', (reason && reason.stack) || '');
  });
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  console.log = function() { sendConsole('log', arguments); originalLog.apply(console, arguments); };
  console.info = function() { sendConsole('info', arguments); originalInfo.apply(console, arguments); };
  console.warn = function() { sendConsole('warn', arguments); originalWarn.apply(console, arguments); };
  console.error = function() { sendConsole('error', arguments); originalError.apply(console, arguments); };
})();
</script>`;

    // ── Import Map ──────────────────────────────────────────────────────
    // Pin ONE React singleton. Every esm.sh URL uses ?external=react,react-dom
    // so the browser import-map resolves them to the SAME module instance.
    // Without this, React sees two copies and throws Error #31 / hooks errors.
    //
    // react-native → react-native-web (standard web shim)
    // react-native/* deep paths → catch-all stub API (native-only, no web equiv)
    // lucide-react-native → lucide-react (web SVG, avoids react-native-svg chain)
    // react-native-svg → stub (native-only, would pull codegenNativeComponent)

    const REACT_V = '18.3.1';
    const RNW_V = '0.19.13';
    const ESM = 'https://esm.sh';
    // All esm.sh URLs externalize react+react-dom so the browser resolves them
    // through the importmap → single instance guaranteed.
    const EXT_REACT = 'external=react,react-dom';

    const importMapScript = `<script type="importmap">
{
  "imports": {
    "react": "${ESM}/react@${REACT_V}",
    "react/": "${ESM}/react@${REACT_V}/",
    "react-dom": "${ESM}/react-dom@${REACT_V}?${EXT_REACT}",
    "react-dom/": "${ESM}/react-dom@${REACT_V}&${EXT_REACT}/",
    "react-native": "${ESM}/react-native-web@${RNW_V}?${EXT_REACT}",
    "react-native/": "/api/stub/",
    "react-native-web": "${ESM}/react-native-web@${RNW_V}?${EXT_REACT}",
    "react-native-svg": "/api/stub/react-native-svg",
    "react-native-svg/": "/api/stub/react-native-svg/",
    "lucide-react-native": "${ESM}/lucide-react@0.475.0?external=react",
    "three": "${ESM}/three@0.160.0",
    "@react-three/fiber": "${ESM}/@react-three/fiber@8.15.14?external=react,react-dom,three",
    "@react-three/drei": "${ESM}/@react-three/drei@9.96.1?external=react,react-dom,three,@react-three/fiber"
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
        // ── Resolve requests ────────────────────────────────────────────
        build.onResolve({ filter: /.*/ }, (args) => {
          const req = args.path;

          // Already a URL → pass through
          if (req.startsWith('http')) return { path: req, external: true };

          // ── React singleton: keep bare so the browser importmap resolves ONE copy
          // Matches: react, react/jsx-runtime, react-dom, react-dom/client, etc.
          if (req === 'react' || req.startsWith('react/'))
            return { path: req, external: true };
          if (req === 'react-dom' || req.startsWith('react-dom/'))
            return { path: req, external: true };

          // ── react-native bare → external (importmap → react-native-web)
          if (req === 'react-native')
            return { path: req, external: true };

          // ── react-native deep paths → stub (native-only, no web equivalent)
          if (req.startsWith('react-native/'))
            return { path: req, namespace: 'empty-module' };

          // ── Packages mapped in importmap → keep bare external
          const IMPORTMAP_EXTERNALS = [
            'react-native-web', 'lucide-react-native',
            'three', '@react-three/fiber', '@react-three/drei',
          ];
          if (IMPORTMAP_EXTERNALS.includes(req))
            return { path: req, external: true };

          // ── Ignored / native-only packages → empty stub (exact + subpath)
          if (
            IGNORED_PACKAGES.has(req) ||
            req.startsWith('@expo/vector-icons') ||
            [...IGNORED_PACKAGES].some(pkg => req.startsWith(pkg + '/'))
          ) {
            return { path: req, namespace: 'empty-module' };
          }

          // ── CSS imports → stub (no CSS bundling in preview)
          if (req.endsWith('.css'))
            return { path: req, namespace: 'empty-module' };

          // ── Relative imports
          if (req.startsWith('.')) {
            const importer = args.importer.replace(/\\/g, '/');
            const importerDir = importer.substring(0, importer.lastIndexOf('/'));
            const resolvedBase = normalizePath((importerDir ? importerDir + '/' : '') + req);
            const hit = tryResolveProjectPath(resolvedBase);
            if (hit) return { path: hit, namespace: 'virtual-fs' };
          } else {
            // Alias or project-local bare path
            const reqMapped = mapAlias(req);
            const projHit = tryResolveProjectPath(reqMapped);
            if (projHit) return { path: projHit, namespace: 'virtual-fs' };
            
            // Unknown bare specifier → npm via esm.sh, externalize react singleton
            if (!req.startsWith('/') && !req.startsWith('.')) {
              return { path: `https://esm.sh/${req}?external=react,react-dom,react-native,react-native-web`, external: true };
            }
          }
          
          return null;
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
      html, body { width: 100%; height: 100%; overflow: hidden; background-color: #0a0a0a; }
      body {
        -ms-overflow-style: none;
        scrollbar-width: none;
        font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ::-webkit-scrollbar { display: none; }

      /* ── Global polish ─────────────────────────────── */
      * { -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
      input, textarea { -webkit-user-select: text; user-select: text; }
      [role="button"] { transition: opacity 0.1s ease, transform 0.1s ease; cursor: pointer; }
      [role="button"]:active { opacity: 0.7; }

      /* ── Phone chrome: status bar ──────────────────── */
      #rork-status-bar {
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        height: 54px;
        background: linear-gradient(180deg, #000 0%, rgba(0,0,0,0.92) 100%);
        display: flex; align-items: flex-end; justify-content: space-between;
        padding: 0 20px 8px 20px;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 15px; font-weight: 600; color: #fff;
        pointer-events: none;
      }
      #rork-status-bar .sb-time { flex: 1; text-align: left; }
      #rork-status-bar .sb-notch { flex: 1; display: flex; justify-content: center; }
      #rork-status-bar .sb-notch-pill {
        width: 126px; height: 34px; border-radius: 20px;
        background: #000;
      }
      #rork-status-bar .sb-icons { flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 5px; }
      #rork-status-bar .sb-icons svg { width: 16px; height: 16px; }

      /* ── Phone chrome: home indicator ──────────────── */
      #rork-home-indicator {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
        height: 34px;
        background: linear-gradient(0deg, #000 0%, rgba(0,0,0,0.85) 100%);
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      #rork-home-indicator .hi-pill {
        width: 134px; height: 5px; border-radius: 3px;
        background: rgba(255,255,255,0.3);
      }

      /* ── App root with safe-area padding ───────────── */
      #root {
        width: 100%; height: 100%;
        padding-top: 54px;
        padding-bottom: 34px;
        overflow: hidden;
      }
    </style>
    ${importMapScript}
  </head>
  <body>
    <!-- iOS-style status bar -->
    <div id="rork-status-bar">
      <span class="sb-time">9:41</span>
      <span class="sb-notch"><span class="sb-notch-pill"></span></span>
      <span class="sb-icons">
        <svg viewBox="0 0 16 16" fill="white"><path d="M1 7c0-.6.4-1 1-1h1c.6 0 1 .4 1 1v5c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V7zm4-2c0-.6.4-1 1-1h1c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V5zm4-2c0-.6.4-1 1-1h1c.6 0 1 .4 1 1v9c0 .6-.4 1-1 1h-1c-.6 0-1-.4-1-1V3z"/></svg>
        <svg viewBox="0 0 16 16" fill="white"><path d="M8 3C5.5 3 3.3 4 1.7 5.7l1.4 1.4C4.5 5.8 6.1 5 8 5s3.5.8 4.9 2.1l1.4-1.4C12.7 4 10.5 3 8 3zm0 4c-1.4 0-2.7.6-3.5 1.4l1.4 1.4c.5-.5 1.3-.8 2.1-.8s1.6.3 2.1.8l1.4-1.4C10.7 7.6 9.4 7 8 7zm0 4c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z"/></svg>
        <svg viewBox="0 0 24 16" fill="white"><rect x="0" y="2" width="20" height="12" rx="2" ry="2" fill="none" stroke="white" stroke-width="1.5"/><rect x="2" y="4" width="14" height="8" rx="1" fill="white"/><rect x="21" y="5.5" width="2.5" height="5" rx="1" fill="white" opacity="0.4"/></svg>
      </span>
    </div>

    <!-- App content -->
    <div id="root"></div>

    <!-- Home indicator -->
    <div id="rork-home-indicator"><span class="hi-pill"></span></div>

    ${errorReporterScript}
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
