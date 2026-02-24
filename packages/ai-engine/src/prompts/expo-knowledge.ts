/**
 * UI Patterns, Data Fetching, Storage, and Package Rules
 * For Expo Snack SDK environment
 */

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

Linking.openURL('https://example.com');
Linking.openURL('mailto:support@example.com');
\`\`\`

### StatusBar
\`\`\`typescript
import { StatusBar } from 'expo-status-bar';

// In your root layout
<StatusBar style="light" />
\`\`\`

### Linear Gradient
\`\`\`typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#007AFF', '#BF5AF2']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1, padding: 16 }}
>
  <Text style={{ color: '#fff' }}>Gradient background</Text>
</LinearGradient>
\`\`\`

### State Management (React Context)
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

### react-native-reanimated (Recommended)
\`\`\`typescript
import Animated, { FadeIn, FadeOut, FadeInUp, SlideInRight, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

// Entering/Exiting — declarative, zero config
<Animated.View entering={FadeIn.duration(300)} exiting={FadeOut}>
  <Text>Fade in content</Text>
</Animated.View>

// Staggered list
{items.map((item, i) => (
  <Animated.View key={item.id} entering={FadeInUp.delay(i * 80).springify()}>
    <ItemCard item={item} />
  </Animated.View>
))}
\`\`\`

### Shared Value Animations
\`\`\`typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

function AnimatedCard() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={animatedStyle}>
        <Card />
      </Animated.View>
    </Pressable>
  );
}
\`\`\`

### Fallback: Animated from react-native
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
\`\`\``;

export const EXPO_STORAGE = `## Storage Patterns

### AsyncStorage (@react-native-async-storage/async-storage)
\`\`\`typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
await AsyncStorage.setItem('user_token', 'abc123');

// Read data
const token = await AsyncStorage.getItem('user_token');

// Remove data
await AsyncStorage.removeItem('user_token');

// Store objects
await AsyncStorage.setItem('user', JSON.stringify({ name: 'Alex', age: 30 }));
const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
\`\`\`

### Custom Hook for Persistent State
\`\`\`typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function useStoredState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored) setValue(JSON.parse(stored));
      setLoaded(true);
    });
  }, [key]);

  const setAndStore = (newValue: T) => {
    setValue(newValue);
    AsyncStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setAndStore, loaded] as const;
}
\`\`\``;

export const EXPO_CONTROLS = `## Package Rules (Expo Snack Environment)

### Available Packages — USE THESE (with exact versions for SDK 52)
| Package | Version in package.json | Notes |
|---------|------------------------|-------|
| react, react-native | (core, don't list) | Core framework |
| expo-router | ~4.0.0 | File-based routing and navigation |
| @expo/vector-icons | * | Icon families (Ionicons, MaterialIcons, FontAwesome, Feather) |
| react-native-safe-area-context | * | Safe area insets |
| react-native-reanimated | * | Smooth animations (UI thread) |
| react-native-gesture-handler | * | Touch gestures |
| @react-native-async-storage/async-storage | ~2.1.0 | Persistent key-value storage |
| expo-image | ~2.0.0 | Fast image component with blurhash |
| expo-blur | ~14.0.0 | Native blur effects (BlurView) |
| expo-haptics | ~14.0.0 | Tactile feedback (iOS) |
| expo-linear-gradient | ~14.0.0 | Gradient backgrounds |
| expo-status-bar | ~2.0.0 | Status bar styling |
| expo-constants | ~17.0.0 | Device/app constants |
| expo-font | ~13.0.0 | Custom fonts |
| expo-linking | ~7.0.0 | URL handling |
| expo-clipboard | ~7.0.0 | Clipboard access |
| three, @react-three/fiber, @react-three/drei | latest | 3D graphics (web preview) |

**CRITICAL: Use EXACTLY the versions listed above in your package.json. Wrong versions (e.g. expo-image@~4.0.0) will cause Snackager 500 errors and the preview will not load.**

### BANNED Packages — DO NOT USE
- **lucide-react-native** — use \`@expo/vector-icons\` (Ionicons) instead
- **nativewind** / **tailwind** — use StyleSheet.create
- **@tamagui/core** or any tamagui package — not available
- **@shopify/flash-list** — use FlatList from react-native
- **react-native-svg** — not preloaded in Snack, use icons from @expo/vector-icons
- **react-native-maps** — not available in Snack web preview
- **expo-gl** — use @react-three/fiber for 3D on web

### Platform-Specific Considerations
- \`expo-haptics\` — wrap calls in \`Platform.OS !== 'web'\` check
- \`expo-camera\` — works on device, show placeholder on web
- \`expo-audio\` / \`expo-video\` — works on device, may not render on web
- Always test that your app works in BOTH web preview AND on device via Expo Go

### Icons: ALWAYS use @expo/vector-icons
\`\`\`typescript
import { Ionicons } from '@expo/vector-icons';
<Ionicons name="heart" size={24} color="#FF6B6B" />
\`\`\`

Do NOT use packages outside the available list above unless absolutely necessary. Keep dependencies minimal.`;
