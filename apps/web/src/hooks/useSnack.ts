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
 * Hook that manages an Expo Snack session.
 * - Creates a Snack instance on mount
 * - Exposes updateFiles / updateDependencies / getState
 * - Provides webPreviewURL for the iframe
 * - Provides expoURL for QR code / Expo Go
 */
export function useSnack() {
  const webPreviewRef = useRef<Window | null>(null);
  const snackRef = useRef<Snack | null>(null);

  const [webPreviewURL, setWebPreviewURL] = useState<string | undefined>(undefined);
  const [expoURL, setExpoURL] = useState<string | undefined>(undefined);
  const [connectedClients, setConnectedClients] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Create Snack instance once
  useEffect(() => {
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
      codeChangesDelay: 1500, // debounce code pushes during streaming
      webPreviewRef,
    });

    snackRef.current = snack;

    // Listen for state changes
    const unsubscribe = snack.addStateListener((state, prevState) => {
      // Web preview URL
      if (state.webPreviewURL !== prevState.webPreviewURL) {
        setWebPreviewURL(state.webPreviewURL);
      }

      // Expo URL (for QR code)
      if (state.url !== prevState.url) {
        setExpoURL(state.url);
      }

      // Connected clients
      const clientCount = Object.keys(state.connectedClients).length;
      const prevClientCount = Object.keys(prevState.connectedClients).length;
      if (clientCount !== prevClientCount) {
        setConnectedClients(clientCount);
      }

      // Online status
      if (state.online !== prevState.online) {
        setIsOnline(state.online);
      }

      // Busy (resolving deps etc.)
      const busy = computeIsBusy(state);
      const prevBusy = computeIsBusy(prevState);
      if (busy !== prevBusy) {
        setIsBusy(busy);
      }
    });

    // Go online
    snack.setOnline(true);

    return () => {
      unsubscribe();
      snack.setOnline(false);
    };
  }, []);

  /**
   * Update files in the Snack.
   * Accepts our project file format { path: string, content: string }[]
   * and converts to Snack's format.
   */
  const updateFiles = useCallback((files: Array<{ path: string; content: string }>) => {
    const snack = snackRef.current;
    if (!snack) return;

    const snackFiles: SnackFiles = {};
    for (const file of files) {
      // Snack expects paths without leading slash
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      snackFiles[path] = {
        type: 'CODE',
        contents: file.content,
      };
    }

    snack.updateFiles(snackFiles);
    setError(null);
  }, []);

  /**
   * Update all files at once (replace entire file set).
   * Used when loading a project or after agent completes.
   */
  const setAllFiles = useCallback((files: Record<string, { path: string; content: string }>) => {
    const snack = snackRef.current;
    if (!snack) return;

    const snackFiles: SnackFiles = {};
    for (const [, file] of Object.entries(files)) {
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      snackFiles[path] = {
        type: 'CODE',
        contents: file.content,
      };
    }

    snack.updateFiles(snackFiles);
    setError(null);
  }, []);

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
