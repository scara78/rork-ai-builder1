/**
 * Expo SDK 52 Core Rules and Library Preferences
 * For Expo Snack SDK preview environment (real Expo code)
 */

export const EXPO_SDK54_RULES = `## Expo SDK 52 Core Rules

### Runtime Environment
This app runs in **Expo Snack** — a real Expo environment powered by Metro bundler.
- Code runs natively on iOS/Android via Expo Go, AND as a web preview via react-native-web
- The Snack web player renders your app in an iframe — users can also scan a QR code to test on real devices
- The entry point is always \`App.tsx\` (default export)
- Expo SDK 52 is the target — use packages compatible with this version

### Library Preferences
| Use This | NOT This |
|----------|----------|
| \`@expo/vector-icons\` (Ionicons, MaterialIcons, etc.) | lucide-react-native (not available in Snack) |
| \`expo-router\` file-based routing | Custom state-based navigation |
| \`react-native-safe-area-context\` | Manual padding constants |
| \`react-native-reanimated\` | Animated from react-native (use reanimated for better perf) |
| \`expo-image\` | Image from react-native |
| \`expo-blur\` (BlurView) | Semi-transparent backgrounds |
| \`expo-haptics\` | Visual-only feedback |
| \`@react-native-async-storage/async-storage\` | localStorage wrappers |
| \`StyleSheet.create\` | nativewind / tailwind (not available) |
| CSS \`boxShadow\` style prop | Legacy RN shadow props |
| \`React.useContext\` | \`React.use\` (not stable in all envs) |
| \`useWindowDimensions\` | \`Dimensions.get()\` |

### Available Packages (Pre-loaded in Snack)
These packages are pre-loaded and resolve instantly:
- react, react-native
- expo-router
- @expo/vector-icons
- react-native-safe-area-context
- react-native-reanimated
- react-native-gesture-handler
- @react-native-async-storage/async-storage
- expo-constants, expo-font

### Available Packages (Resolved by Snackager)
These packages are available but need resolution (slight delay on first use):
- expo-image
- expo-blur
- expo-haptics
- expo-linear-gradient
- expo-status-bar
- expo-linking
- expo-clipboard

### Project Structure (expo-router file-based routing)
\`\`\`
App.tsx                    # Entry point — renders ExpoRoot or <Slot />
app/
  _layout.tsx              # Root layout (Stack, Tabs, or NativeTabs)
  (tabs)/
    _layout.tsx            # Tab layout
    index.tsx              # Home tab (matches /)
    explore.tsx            # Explore tab
    profile.tsx            # Profile tab
  [id].tsx                 # Dynamic route
  modal.tsx                # Modal screen
components/                # Reusable components
hooks/                     # Custom hooks
utils/                     # Utility functions
constants/                 # App constants (colors, spacing)
types/                     # TypeScript types
\`\`\`

### File Naming
- Use kebab-case for component files: \`comment-card.tsx\`, \`use-search.ts\`
- Route files use lowercase: \`index.tsx\`, \`profile.tsx\`, \`[id].tsx\`
- Layout files are always \`_layout.tsx\`
- Never co-locate components/utils inside the \`app/\` directory

### Code Style
- Always use import statements at top of file
- Be cautious of unterminated strings — escape nested backticks
- TypeScript strict mode enabled
- Use \`export default\` for route/screen components
- Use named exports for components and hooks`;

export const EXPO_PACKAGES = `## Available Packages

### Core UI (from react-native)
\`\`\`typescript
import { View, Text, Pressable, ScrollView, FlatList, TextInput, Switch, StyleSheet, Platform, ActivityIndicator, Alert, Linking, KeyboardAvoidingView } from 'react-native';
import { useWindowDimensions } from 'react-native';
\`\`\`

### Images (expo-image — preferred over RN Image)
\`\`\`typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  placeholder={{ blurhash: 'LEHV6nWB2yk8' }}
  transition={200}
/>
\`\`\`

### Icons (@expo/vector-icons)
\`\`\`typescript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color="#fff" />
<Ionicons name="heart" size={24} color="#FF3B30" />
<Ionicons name="settings-outline" size={24} color="#8e8e93" />
\`\`\`

### Navigation (expo-router)
\`\`\`typescript
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Tabs } from 'expo-router';
\`\`\`

### Safe Area
\`\`\`typescript
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
\`\`\`

### Storage
\`\`\`typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
\`\`\`

### Effects
\`\`\`typescript
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
\`\`\``;

export const EXPO_BEST_PRACTICES = `## Best Practices

### Responsiveness
- ALWAYS wrap root content in ScrollView with \`contentInsetAdjustmentBehavior="automatic"\`
- Use flexbox for layout instead of fixed dimensions
- ALWAYS prefer \`useWindowDimensions\` over \`Dimensions.get()\`
- Use \`contentContainerStyle\` for ScrollView padding (not style prop)

### Safe Area
- Use \`react-native-safe-area-context\` for proper insets
- Use \`<SafeAreaView>\` or \`useSafeAreaInsets()\` hook
- Stack headers and Tab bars handle safe area automatically
- For custom layouts, always account for both top AND bottom insets

### Text Content
- Use \`<Text selectable />\` for data that could be copied
- Format large numbers: 1.4M, 38k instead of 1400000
- Use \`{ fontVariant: ['tabular-nums'] }\` for counters

### Performance
- Use FlatList for lists (not ScrollView with map)
- Proper key props on list items
- Use useCallback/useMemo appropriately
- Use \`react-native-reanimated\` for 60fps animations

### Images
- Use \`expo-image\` Image component (not RN Image)
- Use \`contentFit="cover"\` instead of \`resizeMode\`
- Use blurhash placeholders for smooth loading
- Always specify width and height

### Error Handling
- Always use try/catch for async operations
- Show user-friendly error messages
- Handle loading states with ActivityIndicator`;
