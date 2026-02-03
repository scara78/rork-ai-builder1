/**
 * Expo SDK 54+ Core Rules and Library Preferences
 * Based on official Expo skills from github.com/expo/skills
 */

export const EXPO_SDK54_RULES = `## Expo SDK 54+ Core Rules

### Library Preferences (CRITICAL)
ALWAYS use these modern libraries. NEVER use the deprecated alternatives:

| Use This | NOT This |
|----------|----------|
| \`expo-audio\` | \`expo-av\` |
| \`expo-video\` | \`expo-av\` |
| \`expo-symbols\` (SymbolView) | \`@expo/vector-icons\` |
| \`expo-image\` | intrinsic \`<img>\` or RN Image |
| \`expo-glass-effect\` | custom blur overlays |
| \`process.env.EXPO_OS\` | \`Platform.OS\` |
| \`React.use\` | \`React.useContext\` |
| \`react-native-safe-area-context\` | RN SafeAreaView |
| \`useWindowDimensions\` | \`Dimensions.get()\` |

### Project Structure Rules
\`\`\`
app/                    # Routes ONLY - no components here!
  _layout.tsx           # Root layout (NativeTabs or Stack)
  +not-found.tsx        # 404 handler
  (tabs)/               # Tab group
    _layout.tsx         # Tab layout
    (home)/             # Stack inside tab
      _layout.tsx       # Stack layout
      index.tsx         # Home screen
      [id].tsx          # Dynamic route
components/             # Reusable components
  ui/                   # Generic UI components
  [feature]/            # Feature-specific components
hooks/                  # Custom hooks
utils/                  # Utility functions
constants/              # App constants (colors, spacing)
types/                  # TypeScript types
\`\`\`

### Route File Rules
- Routes belong ONLY in the \`app/\` directory
- NEVER co-locate components, types, or utilities in app directory
- Use \`[]\` for dynamic routes: \`[id].tsx\`, \`[slug].tsx\`
- Use \`(group)\` for route groups that don't affect URL
- Routes can NEVER be named \`(foo).tsx\` - use \`(foo)/index.tsx\`
- Ensure app ALWAYS has a route matching "/" (never blank)
- ALWAYS use \`_layout.tsx\` files to define navigation structure

### File Naming
- Use kebab-case for files: \`comment-card.tsx\`, \`use-search.ts\`
- Never use special characters in file names
- Configure tsconfig.json with path aliases (@/ for src)

### Code Style
- Always use import statements at top of file
- Be cautious of unterminated strings - escape nested backticks
- Prefer path aliases over deep relative imports
- TypeScript strict mode enabled

### Running the App
1. **Start with Expo Go**: \`npx expo start\` - most apps work here
2. Only use \`npx expo run:ios/android\` when required:
   - Custom native modules in \`modules/\`
   - Apple targets (widgets, extensions)
   - Third-party native modules not in Expo Go

### Environment Variables
- Use \`process.env.EXPO_OS\` instead of Platform.OS
- Access env vars via \`process.env.EXPO_PUBLIC_*\`
- Configure in app.json or .env files`;

export const EXPO_PACKAGES = `## Essential Expo Packages

### Navigation & Routing
\`\`\`typescript
import { Stack } from 'expo-router/stack';
import { Link, useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
\`\`\`

### UI & Visuals
\`\`\`typescript
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
\`\`\`

### Media
\`\`\`typescript
import { useAudioPlayer, useAudioRecorder, AudioModule } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
\`\`\`

### Device & Platform
\`\`\`typescript
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions, PlatformColor } from 'react-native';
\`\`\`

### Storage
\`\`\`typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
\`\`\`

### Native Controls
\`\`\`typescript
import { Switch, TextInput, ScrollView, FlatList } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
\`\`\``;

export const EXPO_BEST_PRACTICES = `## Expo Best Practices

### Responsiveness
- ALWAYS wrap root component in ScrollView for responsiveness
- Use \`<ScrollView contentInsetAdjustmentBehavior="automatic" />\` instead of SafeAreaView
- Apply same to FlatList and SectionList
- Use flexbox instead of Dimensions API
- ALWAYS prefer \`useWindowDimensions\` over \`Dimensions.get()\`

### Safe Area Handling
- Use \`contentInsetAdjustmentBehavior="automatic"\` on scroll views
- This handles both top and bottom safe areas automatically
- Works better with dynamic island, notches, home indicators

### Haptics
- Use \`expo-haptics\` conditionally on iOS for delightful experiences
- Native controls like Switch and DateTimePicker have built-in haptics
- Don't add extra haptics to components that already have them

### Text Content
- Use \`<Text selectable />\` for data that could be copied
- Format large numbers: 1.4M, 38k instead of 1400000
- Use \`fontVariant: 'tabular-nums'\` for counters/numbers

### Performance
- Use FlatList for lists (not ScrollView with map)
- Proper key props on list items
- Avoid inline functions in render when possible
- Use useCallback/useMemo appropriately

### Permissions
- Eagerly request camera permission
- Lazily request media library permission
- Always handle permission denied states gracefully`;
