'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Snack, SnackFiles, isModulePreloaded } from 'snack-sdk';
import type { SnackState } from 'snack-sdk';

/**
 * Replicates the internal `isBusy` check from snack-sdk/State.
 * The Snack is "busy" when dependencies are still being resolved
 * or asset files are still being uploaded.
 */
function computeIsBusy(state: SnackState): boolean {
  const hasUnresolvedDeps = Object.keys(state.dependencies).some(
    (name) => !(state.dependencies[name] as { handle?: unknown }).handle && !isModulePreloaded(name, state.sdkVersion)
  );
  const hasUploadingAssets = Object.values(state.files).some(
    (file) => file.type === 'ASSET' && typeof file.contents !== 'string'
  );
  return hasUnresolvedDeps || hasUploadingAssets;
}

const DEFAULT_SDK_VERSION = '52.0.0';

/**
 * Parses a package.json content string and extracts dependencies as { name: version } pairs.
 */
function parseDependencies(packageJsonContent: string): Record<string, string> {
  try {
    const pkg = JSON.parse(packageJsonContent);
    return pkg.dependencies || {};
  } catch {
    return {};
  }
}

/**
 * Hook that manages an Expo Snack session.
 * - Creates a Snack instance on mount (delayed until iframe is ready)
 * - Exposes updateFiles / updateDependencies / getState
 * - Provides webPreviewURL for the iframe
 * - Provides expoURL for QR code / Expo Go
 */
export function useSnack() {
  const webPreviewRef = useRef<Window | null>(null);
  const snackRef = useRef<Snack | null>(null);
  const isInitializedRef = useRef(false);

  const [webPreviewURL, setWebPreviewURL] = useState<string | undefined>(undefined);
  const [expoURL, setExpoURL] = useState<string | undefined>(undefined);
  const [connectedClients, setConnectedClients] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  /**
   * Initialize the Snack instance.
   * Called once after the iframe has mounted and webPreviewRef.current is set.
   */
  const initSnack = useCallback(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const snack = new Snack({
      sdkVersion: DEFAULT_SDK_VERSION,
      files: {
        'App.tsx': {
          type: 'CODE',
          contents: `import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Waiting for AI to generate your app...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#666', fontSize: 16 },
});`,
        },
      },
      codeChangesDelay: 1500,
      webPreviewRef,
    });

    snackRef.current = snack;

    // Listen for state changes
    const unsubscribe = snack.addStateListener((state, prevState) => {
      if (state.webPreviewURL !== prevState.webPreviewURL) {
        setWebPreviewURL(state.webPreviewURL);
      }
      if (state.url !== prevState.url) {
        setExpoURL(state.url);
      }
      const clientCount = Object.keys(state.connectedClients).length;
      const prevClientCount = Object.keys(prevState.connectedClients).length;
      if (clientCount !== prevClientCount) {
        setConnectedClients(clientCount);
      }
      if (state.online !== prevState.online) {
        setIsOnline(state.online);
      }
      const busy = computeIsBusy(state);
      const prevBusy = computeIsBusy(prevState);
      if (busy !== prevBusy) {
        setIsBusy(busy);
      }
    });

    // Go online — webPreviewRef.current should already be set by the iframe
    snack.setOnline(true);

    return () => {
      unsubscribe();
      snack.setOnline(false);
    };
  }, [webPreviewRef]);

  // Wait a tick for the iframe to mount, then initialize Snack.
  // The iframe renders with about:blank immediately, so after first render
  // webPreviewRef.current will be set by SnackPreview's useEffect.
  useEffect(() => {
    const timer = setTimeout(() => {
      initSnack();
    }, 100);
    return () => clearTimeout(timer);
  }, [initSnack]);

  /**
   * Update files in the Snack.
   * Accepts our project file format { path: string, content: string }[]
   * and converts to Snack's format.
   * Also auto-parses package.json to sync dependencies.
   */
  const updateFiles = useCallback((files: Array<{ path: string; content: string }>) => {
    const snack = snackRef.current;
    if (!snack) return;

    const snackFiles: SnackFiles = {};
    let depsToSync: Record<string, string> | null = null;

    for (const file of files) {
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;

      // If this is package.json, parse it for dependencies
      if (path === 'package.json') {
        depsToSync = parseDependencies(file.content);
        // Don't push package.json as a Snack file — Snack manages deps separately
        continue;
      }

      snackFiles[path] = {
        type: 'CODE',
        contents: file.content,
      };
    }

    if (Object.keys(snackFiles).length > 0) {
      snack.updateFiles(snackFiles);
    }

    // Sync dependencies from package.json
    if (depsToSync && Object.keys(depsToSync).length > 0) {
      const snackDeps: Record<string, { version: string }> = {};
      for (const [name, version] of Object.entries(depsToSync)) {
        // Skip react/react-native — they're always included
        if (name === 'react' || name === 'react-native' || name === 'react-dom') continue;
        snackDeps[name] = { version };
      }
      if (Object.keys(snackDeps).length > 0) {
        snack.updateDependencies(snackDeps);
      }
    }

    setError(null);
  }, []);

  /**
   * Update all files at once (replace entire file set).
   * Used when loading a project or after agent completes.
   */
  const setAllFiles = useCallback((files: Record<string, { path: string; content: string }>) => {
    const fileArray = Object.values(files).map(f => ({
      path: f.path,
      content: f.content,
    }));
    updateFiles(fileArray);
  }, [updateFiles]);

  /**
   * Add or update dependencies.
   */
  const updateDependencies = useCallback((deps: Record<string, string>) => {
    const snack = snackRef.current;
    if (!snack) return;

    const snackDeps: Record<string, { version: string }> = {};
    for (const [name, version] of Object.entries(deps)) {
      snackDeps[name] = { version };
    }
    snack.updateDependencies(snackDeps);
  }, []);

  /**
   * Save the Snack to Expo servers. Returns the URL.
   */
  const saveSnack = useCallback(async () => {
    const snack = snackRef.current;
    if (!snack) return null;

    try {
      const result = await snack.saveAsync();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Snack');
      return null;
    }
  }, []);

  /**
   * Get download URL for zip export.
   */
  const getDownloadURL = useCallback(async () => {
    const snack = snackRef.current;
    if (!snack) return null;

    try {
      const url = await snack.getDownloadURLAsync();
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL');
      return null;
    }
  }, []);

  return {
    webPreviewRef,
    webPreviewURL,
    expoURL,
    connectedClients,
    isOnline,
    isBusy,
    error,
    updateFiles,
    setAllFiles,
    updateDependencies,
    saveSnack,
    getDownloadURL,
    snackRef,
  };
}
