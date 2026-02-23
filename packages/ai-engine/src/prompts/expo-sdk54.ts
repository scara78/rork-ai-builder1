/**
 * React Native Web Core Rules and Library Preferences
 * For esbuild + react-native-web preview environment
 */

export const EXPO_SDK54_RULES = `## React Native Web Core Rules

### Runtime Environment
This app runs in a **react-native-web** environment inside the browser.
- React Native components are rendered as web elements via \`react-native-web\`
- There is NO Expo Go, NO Metro bundler, NO native device
- Everything runs in an iframe in the browser with a phone-sized viewport
- The entry point is always \`App.tsx\` (NOT expo-router file-based routing)
- A built-in status bar (54px) and home indicator (34px) are rendered by the preview chrome

### Library Preferences
| Use This | NOT This |
|----------|----------|
| \`lucide-react-native\` | @expo/vector-icons / expo-symbols / SymbolView |
| State-based navigation (custom TabNavigator/Navigator) | expo-router (NOT available) |
| Custom ScreenHeader component | Stack.Screen options |
| \`react-native\` components via react-native-web | Web HTML elements (<div>, <span>) |
| \`Animated\` from react-native | react-native-reanimated (NOT available) |
| \`React.useContext\` | \`React.use\` (not stable) |
| \`useWindowDimensions\` | \`Dimensions.get()\` |
| \`StyleSheet.create\` | nativewind / tailwind |

### Available Packages
- react, react-native (aliased to react-native-web)
- lucide-react-native (icons)
- three, @react-three/fiber, @react-three/drei (3D graphics)
- AsyncStorage-like patterns using localStorage

### Project Structure Rules
\`\`\`
App.tsx                 # Entry point — ALWAYS required
components/             # Reusable components (TabNavigator, Navigator, Modal, ScreenHeader)
screens/                # Screen components
hooks/                  # Custom hooks
utils/                  # Utility functions
constants/              # App constants (colors, spacing)
types/                  # TypeScript types
\`\`\`

### CRITICAL: NO expo-router
- Do NOT import from \`expo-router\` — it does NOT work in this environment
- Do NOT create an \`app/\` directory for file-based routing
- Use state-based navigation (see Navigation section)
- Always export a default component from \`App.tsx\`

### File Naming
- Use kebab-case for files: \`comment-card.tsx\`, \`use-search.ts\`
- Screen files go in \`screens/\`: \`HomeScreen.tsx\`, \`ProfileScreen.tsx\`
- Component files go in \`components/\`: \`TabNavigator.tsx\`, \`ScreenHeader.tsx\`

### Code Style
- Always use import statements at top of file
- Be cautious of unterminated strings - escape nested backticks
- TypeScript strict mode enabled
- Use \`export default\` for screen and page components

### IMPORTANT: Web Preview Compatibility
This app runs in a browser-based react-native-web preview. Keep code simple:
- Do NOT use packages that require native builds
- Do NOT use file system APIs, camera, haptics, or device-specific APIs
- Do NOT use react-native-reanimated — use Animated from react-native
- Use StyleSheet.create for styles
- For storage, use a simple in-memory store or wrap localStorage
- For images, use \`<Image source={{ uri: 'https://...' }} />\` from react-native`;

export const EXPO_PACKAGES = `## Available Packages

### UI Components (from react-native / react-native-web)
\`\`\`typescript
import { View, Text, Pressable, ScrollView, FlatList, TextInput, Switch, StyleSheet, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { useWindowDimensions } from 'react-native';
\`\`\`

### Icons
\`\`\`typescript
import { Home, Settings, User } from 'lucide-react-native';
\`\`\`

### Storage (localStorage wrapper for web)
\`\`\`typescript
// utils/storage.ts — simple AsyncStorage replacement for web
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
\`\`\``;

export const EXPO_BEST_PRACTICES = `## Best Practices

### Responsiveness
- ALWAYS wrap root content in ScrollView for responsiveness
- Use flexbox for layout instead of fixed dimensions
- ALWAYS prefer \`useWindowDimensions\` over \`Dimensions.get()\`
- Test with both phone and tablet device sizes

### Text Content
- Use \`<Text selectable />\` for data that could be copied
- Format large numbers: 1.4M, 38k instead of 1400000

### Performance
- Use FlatList for lists (not ScrollView with map)
- Proper key props on list items
- Avoid inline functions in render when possible
- Use useCallback/useMemo appropriately

### Images
- Use Image from react-native with \`source={{ uri: '...' }}\`
- Always specify width and height for images
- Use resizeMode="cover" for background-style images

### Error Handling
- Always use try/catch for async operations
- Show user-friendly error messages
- Handle loading states with ActivityIndicator`;
