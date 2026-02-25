'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Snack, SnackFiles, isModulePreloaded } from 'snack-sdk';
import type { SnackState } from 'snack-sdk';

interface DepState {
  handle?: unknown;
  error?: { message?: string } | string;
  version?: string;
}

/**
 * Replicates the internal `isBusy` check from snack-sdk/State.
 * Deps that have ERRORS are NOT counted as unresolved (they failed, not pending).
 */
function computeIsBusy(state: SnackState): boolean {
  const hasUnresolvedDeps = Object.keys(state.dependencies).some((name) => {
    const dep = state.dependencies[name] as DepState;
    if (dep.error) return false;
    return !dep.handle && !isModulePreloaded(name, state.sdkVersion);
  });
  const hasUploadingAssets = Object.values(state.files).some(
    (file) => file.type === 'ASSET' && typeof file.contents !== 'string'
  );
  return hasUnresolvedDeps || hasUploadingAssets;
}

/**
 * Collects dependency resolution errors from Snack state.
 */
function collectDepErrors(state: SnackState): string | null {
  const errors: string[] = [];
  for (const name of Object.keys(state.dependencies)) {
    const dep = state.dependencies[name] as DepState;
    if (dep.error) {
      const msg = typeof dep.error === 'string'
        ? dep.error
        : dep.error.message || 'resolution failed';
      errors.push(`${name}@${dep.version || '?'}: ${msg}`);
    }
  }
  return errors.length > 0
    ? `Failed to resolve dependencies:\n${errors.join('\n')}`
    : null;
}

const DEFAULT_SDK_VERSION = '52.0.0';

/**
 * Known-good dependency versions for Expo SDK 52 in the Snack environment.
 * AI models frequently hallucinate wrong version numbers. This map overrides
 * whatever version the AI puts in package.json with a version Snackager can resolve.
 */
const SDK52_VERSION_MAP: Record<string, string> = {
  'expo-image': '~2.0.0',
  'expo-blur': '~14.0.0',
  'expo-haptics': '~14.0.0',
  'expo-linear-gradient': '~14.0.0',
  'expo-status-bar': '~2.0.0',
  'expo-constants': '~17.0.0',
  'expo-font': '~13.0.0',
  'expo-linking': '~7.0.0',
  'expo-clipboard': '~7.0.0',
  'expo-router': '~4.0.0',
  '@expo/vector-icons': '*',
  'react-native-safe-area-context': '*',
  'react-native-reanimated': '*',
  'react-native-gesture-handler': '*',
  'react-native-screens': '*',
  '@react-native-async-storage/async-storage': '~2.1.0',
};

function resolveVersion(name: string, aiVersion: string): string {
  return SDK52_VERSION_MAP[name] ?? aiVersion;
}

function parseDependencies(packageJsonContent: string): Record<string, string> {
  try {
    const pkg = JSON.parse(packageJsonContent);
    return pkg.dependencies || {};
  } catch {
    return {};
  }
}

// Retry backoff delays in ms
const RETRY_DELAYS = [5000, 10000, 15000];

/**
 * Hook that manages an Expo Snack session.
 *
 * KEY CHANGE: Snack does NOT go online automatically on mount.
 * The caller must explicitly call `goOnline()` when there are real files to preview
 * (after agent completes or after loading a project with existing files).
 */
export function useSnack() {
  const webPreviewRef = useRef<Window | null>(null);
  const snackRef = useRef<Snack | null>(null);
  const isInitializedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [webPreviewURL, setWebPreviewURL] = useState<string | undefined>(undefined);
  const [expoURL, setExpoURL] = useState<string | undefined>(undefined);
  const [connectedClients, setConnectedClients] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // Track whether goOnline() has been called (so SnackPreview can distinguish "waiting for AI" vs "connecting")
  const [hasRequestedOnline, setHasRequestedOnline] = useState(false);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Create or re-create the Snack instance (without going online).
   */
  const ensureSnackInstance = useCallback(() => {
    if (snackRef.current) return snackRef.current;

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

    // Attach state listener
    if (unsubscribeRef.current) unsubscribeRef.current();
    const unsub = snack.addStateListener((state, prevState) => {
      if (state.webPreviewURL !== prevState.webPreviewURL) {
        console.log(`[useSnack] webPreviewURL changed: ${prevState.webPreviewURL} → ${state.webPreviewURL}`);
        setWebPreviewURL(state.webPreviewURL);
        // Got a preview URL — clear connection timeout + retry state
        if (state.webPreviewURL) {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          retryCountRef.current = 0;
        }
      }
      if (state.url !== prevState.url) {
        console.log(`[useSnack] expoURL changed: ${state.url}`);
        setExpoURL(state.url);
      }
      const clientCount = Object.keys(state.connectedClients).length;
      const prevClientCount = Object.keys(prevState.connectedClients).length;
      if (clientCount !== prevClientCount) {
        console.log(`[useSnack] connectedClients: ${prevClientCount} → ${clientCount}`);
        setConnectedClients(clientCount);
      }
      if (state.online !== prevState.online) {
        console.log(`[useSnack] online: ${prevState.online} → ${state.online}`);
        setIsOnline(state.online);
      }

      // Check for dependency resolution errors
      if (state.dependencies !== prevState.dependencies) {
        const depError = collectDepErrors(state);
        if (depError) {
          console.warn(`[useSnack] Dependency errors detected:`, depError);
          setError(depError);
          if (busyTimeoutRef.current) {
            clearTimeout(busyTimeoutRef.current);
            busyTimeoutRef.current = null;
          }
        }
      }

      // Track busy state + timeout
      const busy = computeIsBusy(state);
      const prevBusy = computeIsBusy(prevState);
      if (busy !== prevBusy) {
        console.log(`[useSnack] isBusy: ${prevBusy} → ${busy}`);
        setIsBusy(busy);
        if (busy) {
          busyTimeoutRef.current = setTimeout(() => {
            const currentState = snack.getState();
            const depErr = collectDepErrors(currentState);
            if (depErr) {
              setError(depErr);
            } else if (computeIsBusy(currentState)) {
              setError('Dependencies are taking too long to resolve. Try refreshing the page.');
            }
          }, 20_000);
        } else {
          if (busyTimeoutRef.current) {
            clearTimeout(busyTimeoutRef.current);
            busyTimeoutRef.current = null;
          }
        }
      }
    });
    unsubscribeRef.current = unsub;
    isInitializedRef.current = true;

    // Sync initial state — webPreviewURL may already exist from Snack init
    const initState = snack.getState();
    if (initState.webPreviewURL) {
      console.log(`[useSnack] Initial webPreviewURL: ${initState.webPreviewURL}`);
      setWebPreviewURL(initState.webPreviewURL);
    }
    if (initState.url) setExpoURL(initState.url);
    if (initState.online) setIsOnline(initState.online);

    return snack;
  }, [webPreviewRef]);

  /**
   * Wire up iframe ref on mount — but do NOT go online.
   */
  useEffect(() => {
    // Just create the Snack instance so files can be pushed before going online
    ensureSnackInstance();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (busyTimeoutRef.current) clearTimeout(busyTimeoutRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const snack = snackRef.current;
      if (snack) {
        try { snack.setOnline(false); } catch { /* ignore */ }
      }
    };
  }, [ensureSnackInstance]);

  /**
   * Internal: attempt to go online with retry logic.
   * Does NOT reset retryCountRef — that's the caller's responsibility.
   */
  const attemptOnline = useCallback(() => {
    console.log('[useSnack] attemptOnline() entered');
    const snack = ensureSnackInstance();
    console.log(`[useSnack] attemptOnline() snack=${snack ? 'exists' : 'NULL'}, webPreviewURL=${snack?.getState().webPreviewURL}, online=${snack?.getState().online}`);

    // Already fully connected — nothing to do
    const currentState = snack.getState();
    if (currentState.online && currentState.webPreviewURL) {
      console.log('[useSnack] attemptOnline() early return — already online with webPreviewURL');
      return;
    }

    // Clear any pending timers from previous attempts
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    // Force a clean reconnection: offline first, then online
    try { snack.setOnline(false); } catch (err) { console.error('[useSnack] setOnline(false) threw:', err); }

    // Wait for webPreviewRef to be wired (iframe contentWindow).
    // Snack SDK needs this ref BEFORE setOnline(true) so it knows where to send code.
    // SnackPreview mounts asynchronously (dynamic import), so we poll.
    let pollCount = 0;
    const MAX_POLLS = 50; // 50 * 100ms = 5s max wait

    const doGoOnline = () => {
      console.log(`[useSnack] Going online (attempt ${retryCountRef.current + 1}/${RETRY_DELAYS.length + 1}), webPreviewRef.current=${webPreviewRef.current ? 'Window' : 'NULL'}, state.online=${snack.getState().online}`);
      try { snack.setOnline(true); } catch (err) { console.error('[useSnack] setOnline(true) threw:', err); }
      console.log(`[useSnack] After setOnline(true): online=${snack.getState().online}`);

      // Start connection timeout — if no connectedClients after 20s, retry
      connectionTimeoutRef.current = setTimeout(() => {
        const state = snack.getState();
        // If online and has connected clients, we're good
        if (state.online && Object.keys(state.connectedClients).length > 0) return;

        const attempt = retryCountRef.current;
        if (attempt < RETRY_DELAYS.length) {
          console.log(`[useSnack] No connected clients after 20s. Retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 2}/${RETRY_DELAYS.length + 1})...`);
          retryCountRef.current = attempt + 1;

          try { snack.setOnline(false); } catch { /* ignore */ }
          retryTimerRef.current = setTimeout(() => {
            setError(null);
            attemptOnline();
          }, RETRY_DELAYS[attempt]);
        } else {
          setError('Could not connect to Expo preview server after multiple attempts. Check your internet connection and try refreshing.');
        }
      }, 20_000);
    };

    const pollForRef = () => {
      pollCount++;
      if (webPreviewRef.current) {
        doGoOnline();
      } else if (pollCount < MAX_POLLS) {
        setTimeout(pollForRef, 100);
      } else {
        console.warn(`[useSnack] webPreviewRef still NULL after ${MAX_POLLS * 100}ms — going online anyway`);
        doGoOnline();
      }
    };

    // Start polling (first check after 100ms)
    setTimeout(pollForRef, 100);
  }, [ensureSnackInstance]);

  /**
   * Go online — call this when there are real files to preview.
   * Resets retry counter so user-triggered retries get fresh attempts.
   */
  const goOnline = useCallback(() => {
    console.log('[useSnack] goOnline() called');
    setHasRequestedOnline(true);
    setError(null);
    retryCountRef.current = 0;
    attemptOnline();
  }, [attemptOnline]);

  /**
   * Update files in the Snack.
   */
  const updateFiles = useCallback((files: Array<{ path: string; content: string }>) => {
    const snack = snackRef.current ?? ensureSnackInstance();

    const snackFiles: SnackFiles = {};
    let depsToSync: Record<string, string> | null = null;

    for (const file of files) {
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;

      if (path === 'package.json') {
        depsToSync = parseDependencies(file.content);
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

    if (depsToSync && Object.keys(depsToSync).length > 0) {
      const snackDeps: Record<string, { version: string }> = {};
      for (const [name, version] of Object.entries(depsToSync)) {
        if (name === 'react' || name === 'react-native' || name === 'react-dom') continue;
        snackDeps[name] = { version: resolveVersion(name, version) };
      }
      if (Object.keys(snackDeps).length > 0) {
        snack.updateDependencies(snackDeps);
      }
    }

    setError(null);
  }, [ensureSnackInstance]);

  /**
   * Update all files at once (replace entire file set).
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
    const snack = snackRef.current ?? ensureSnackInstance();

    const snackDeps: Record<string, { version: string }> = {};
    for (const [name, version] of Object.entries(deps)) {
      snackDeps[name] = { version: resolveVersion(name, version) };
    }
    snack.updateDependencies(snackDeps);
  }, [ensureSnackInstance]);

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
    hasRequestedOnline,
    updateFiles,
    setAllFiles,
    updateDependencies,
    goOnline,
    saveSnack,
    getDownloadURL,
    snackRef,
  };
}
