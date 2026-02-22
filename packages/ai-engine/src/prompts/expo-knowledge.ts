/**
 * UI Patterns and Knowledge Base
 * For Sandpack + Vite + React Native Web environment
 */

// Consolidated UI guidelines
export const EXPO_UI_GUIDELINES = `## Common UI Patterns (Frequently Needed)

### ActivityIndicator (Loading Spinner)
\`\`\`typescript
import { ActivityIndicator, View, StyleSheet } from 'react-native';

function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
});
\`\`\`

### Alert Dialogs
\`\`\`typescript
import { Alert } from 'react-native';

// Simple alert
Alert.alert('Title', 'Message');

// Confirmation dialog
Alert.alert(
  'Delete Item',
  'Are you sure you want to delete this?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => handleDelete() },
  ]
);
\`\`\`

### Pull-to-Refresh
\`\`\`typescript
import { FlatList, RefreshControl } from 'react-native';

function RefreshableList() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemCard item={item} />}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    />
  );
}
\`\`\`

### Opening URLs / Links
\`\`\`typescript
import { Linking } from 'react-native';

// Open URL in browser
Linking.openURL('https://example.com');

// Open email
Linking.openURL('mailto:support@example.com');
\`\`\`

### Simple State Management (React Context)
\`\`\`typescript
// context/AppContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState { theme: 'dark' | 'light'; }
interface AppContextType { state: AppState; setTheme: (theme: 'dark' | 'light') => void; }

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ theme: 'dark' });
  const setTheme = (theme: 'dark' | 'light') => setState(prev => ({ ...prev, theme }));
  return <AppContext.Provider value={{ state, setTheme }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
\`\`\``;

export const EXPO_DATA_FETCHING = `## Data Fetching Patterns

### Basic Fetch
\`\`\`typescript
async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  return response.json();
}
\`\`\`

### With Loading & Error States
\`\`\`typescript
import { useState, useEffect } from 'react';

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    load();
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}
\`\`\`

### Request Cancellation
Use AbortController to cancel requests when component unmounts:
\`\`\`typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err.message);
    });
  
  return () => controller.abort();
}, [url]);
\`\`\``;

export const EXPO_ANIMATIONS = `## Animations

### Simple Animations with React Native Animated
\`\`\`typescript
import { Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';

function FadeInView({ children }: { children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
}
\`\`\`

### Slide-In Animation
\`\`\`typescript
function SlideInView({ children }: { children: React.ReactNode }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ 
      opacity: fadeAnim, 
      transform: [{ translateY: slideAnim }] 
    }}>
      {children}
    </Animated.View>
  );
}
\`\`\`

### Staggered List Animation
\`\`\`typescript
function StaggeredList({ items }: { items: any[] }) {
  return (
    <>
      {items.map((item, index) => {
        const fadeAnim = useRef(new Animated.Value(0)).current;
        
        useEffect(() => {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
          }).start();
        }, []);
        
        return (
          <Animated.View key={item.id} style={{ opacity: fadeAnim }}>
            <ItemCard item={item} />
          </Animated.View>
        );
      })}
    </>
  );
}
\`\`\``;

export const EXPO_STORAGE = `## Storage Patterns

### localStorage Wrapper (AsyncStorage replacement for web)
\`\`\`typescript
// utils/storage.ts
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
  removeItem: async (key: string): Promise<void> => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};
export default storage;
\`\`\`

### Custom Hook for Persistent State
\`\`\`typescript
import { useState, useEffect } from 'react';
import storage from '../utils/storage';

function useStoredState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.getItem(key).then(stored => {
      if (stored) setValue(JSON.parse(stored));
      setLoaded(true);
    });
  }, [key]);

  const setAndStore = (newValue: T) => {
    setValue(newValue);
    storage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setAndStore, loaded] as const;
}
\`\`\``;

export const EXPO_CONTROLS = `## Package Rules (Sandpack + Vite + React Native Web)

### Allowed packages
| Package | Notes |
|---------|-------|
| react, react-native | Core — react-native is aliased to react-native-web |
| lucide-react-native | Icons for the project |
| react-native-web | Automatically aliased from react-native |
| three, @react-three/fiber, @react-three/drei | Supported for 3D games and AR UI |

### BANNED packages — DO NOT USE
- **expo-router** — NO file-system routing in Vite! Use state-based navigation
- **expo-status-bar** — not available in web environment
- **expo-blur** — not available in react-native-web
- **expo-linear-gradient** — use CSS-style gradient via web styles if needed
- **expo-image** — use \`<Image>\` from react-native directly
- **expo-av** — no audio/video support in Sandpack
- **expo-camera** — no camera in browser sandbox
- **expo-haptics** — no haptics on web
- **expo-image-picker** — no file picker in sandbox
- **expo-constants**, **expo-font**, **expo-file-system** — not available
- **react-native-safe-area-context** — use manual padding instead
- **react-native-gesture-handler** — use Pressable from react-native
- **react-native-reanimated** — use Animated from react-native
- **@react-native-async-storage/async-storage** — use localStorage wrapper (see storage patterns)
- **@expo/vector-icons** — use lucide-react-native
- **@tamagui/core** or any tamagui package
- **nativewind** or **tailwind** — use StyleSheet.create
- **react-native-svg** — not available
- **react-native-maps** — not available
- **@shopify/flash-list** — use FlatList from react-native

### Icons: ALWAYS use lucide-react-native
\`\`\`typescript
import { Heart } from 'lucide-react-native';
<Heart size={24} color="#FF6B6B" />
\`\`\`

Do NOT import packages outside the allowed list above. Keep dependencies minimal.`;
