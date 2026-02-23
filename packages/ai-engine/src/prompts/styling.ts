/**
 * Styling Rules for Expo Snack environment
 * StyleSheet.create, CSS boxShadow, safe areas, reanimated animations
 */

export const STYLING_RULES = `## Styling Rules

### General Rules
- Use **StyleSheet.create** for all styles (inline styles also acceptable)
- **CSS and Tailwind NOT supported** — use React Native styles only
- Prefer flex gap over margin/padding where supported
- Prefer padding over margin where possible
- Use \`{ borderCurve: 'continuous' }\` for rounded corners (iOS continuous corners)
- ALWAYS use navigation stack title instead of custom text on page

### Safe Area Handling
- ALWAYS use \`react-native-safe-area-context\` for proper safe area insets
- Use \`<SafeAreaView>\` or \`useSafeAreaInsets()\` hook
- Stack headers and Tab bars handle safe area automatically
- When using ScrollView: \`contentInsetAdjustmentBehavior="automatic"\` handles safe area
- When padding a ScrollView, use \`contentContainerStyle\` padding instead of ScrollView padding

\`\`\`tsx
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Option 1: SafeAreaView wrapper
<SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
  {/* Content */}
</SafeAreaView>

// Option 2: Hook for custom insets
function Screen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Content */}
    </View>
  );
}
\`\`\`

### Shadows — Use CSS boxShadow
Use the CSS \`boxShadow\` style prop. NEVER use legacy React Native shadow props (shadowColor, shadowOffset, shadowOpacity, shadowRadius) or elevation.

\`\`\`tsx
// CORRECT — CSS boxShadow
<View style={{
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  backgroundColor: '#1c1c1e',
  borderRadius: 12,
}} />

// Inset shadows are supported too
<View style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)' }} />
\`\`\`

### Common Shadow Presets
\`\`\`tsx
const shadows = {
  sm: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
  md: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' },
  lg: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)' },
};
\`\`\`

### Border Radius
\`\`\`tsx
// Standard rounded corners with continuous curve
<View style={{ borderRadius: 16, borderCurve: 'continuous' }} />

// Pill/capsule shape
<View style={{ borderRadius: 9999 }} />
\`\`\``;

export const LAYOUT_PATTERNS = `## Layout Patterns

### ScrollView Pattern
\`\`\`tsx
<ScrollView
  contentInsetAdjustmentBehavior="automatic"
  contentContainerStyle={{
    padding: 16,
    gap: 16,
  }}
  style={{ backgroundColor: '#0a0a0a' }}
>
  {/* Content */}
</ScrollView>
\`\`\`

### FlatList Pattern
\`\`\`tsx
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  contentInsetAdjustmentBehavior="automatic"
  contentContainerStyle={{
    padding: 16,
    gap: 12,
  }}
/>
\`\`\`

### Card Pattern
\`\`\`tsx
<View style={styles.card}>
  <Text style={styles.cardTitle}>Title</Text>
  <Text style={styles.cardDescription}>Description</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 16,
    gap: 8,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 15,
    color: '#8e8e93',
  },
});
\`\`\`

### Row Pattern
\`\`\`tsx
import { Ionicons } from '@expo/vector-icons';

<View style={styles.row}>
  <Ionicons name="star" size={24} color="#FFD60A" />
  <View style={{ flex: 1 }}>
    <Text style={styles.rowTitle}>Title</Text>
    <Text style={styles.rowSubtitle}>Subtitle</Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#48484a" />
</View>
\`\`\``;

export const TEXT_STYLING = `## Text Styling

### Text Rules
- Add \`selectable\` prop to every <Text/> displaying important data or error messages
- Format large numbers: 1.4M, 38k instead of 1400000
- Use \`{ fontVariant: ['tabular-nums'] }\` for counters and numbers that change

### Typography Scale
\`\`\`tsx
const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const },
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 22, fontWeight: '700' as const },
  title3: { fontSize: 20, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  callout: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption1: { fontSize: 12, fontWeight: '400' as const },
  caption2: { fontSize: 11, fontWeight: '400' as const },
};
\`\`\`

### Color System (Dark Theme)
Use a consistent color palette for dark theme:
\`\`\`tsx
const colors = {
  // Backgrounds
  background: '#0a0a0a',
  surface: '#1c1c1e',
  surfaceSecondary: '#2c2c2e',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#8e8e93',
  textTertiary: '#48484a',

  // Accent
  blue: '#007AFF',
  green: '#30D158',
  red: '#FF3B30',
  yellow: '#FFD60A',
  orange: '#FF9500',
  purple: '#BF5AF2',
  pink: '#FF2D55',
  teal: '#64D2FF',

  // Borders
  border: '#38383a',
  separator: '#2c2c2e',
};
\`\`\``;

export const RESPONSIVE_DESIGN = `## Responsive Design

### Screen Dimensions
ALWAYS use \`useWindowDimensions\` — never \`Dimensions.get()\`:

\`\`\`tsx
import { useWindowDimensions } from 'react-native';

function Component() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  return (
    <View style={{ padding: isTablet ? 24 : 16 }}>
      {/* ... */}
    </View>
  );
}
\`\`\`

### Flexbox Layout
Use flexbox instead of absolute positioning:

\`\`\`tsx
// Responsive grid
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
  {items.map(item => (
    <View key={item.id} style={{ width: (width - 48) / columns }}>
      <Card item={item} />
    </View>
  ))}
</View>
\`\`\`

### Safe Area with react-native-safe-area-context
\`\`\`tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      backgroundColor: '#0a0a0a',
    }}>
      {/* Content */}
    </View>
  );
}
\`\`\`

### Keyboard Avoiding
\`\`\`tsx
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* Form content */}
</KeyboardAvoidingView>
\`\`\``;

export const ANIMATION_STYLING = `## Animation Patterns

### react-native-reanimated (Recommended)
Use \`react-native-reanimated\` for smooth 60fps animations. It runs on the UI thread.

\`\`\`tsx
import Animated, { FadeIn, FadeOut, SlideInRight, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Entering/Exiting animations (declarative)
<Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
  <Text style={{ color: '#fff' }}>Animated content</Text>
</Animated.View>

// Slide in from right
<Animated.View entering={SlideInRight.springify()}>
  <Card />
</Animated.View>
\`\`\`

### Spring Animation with Shared Values
\`\`\`tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function ScaleButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
\`\`\`

### Staggered List Animation
\`\`\`tsx
import Animated, { FadeInUp } from 'react-native-reanimated';

function StaggeredList({ items }: { items: any[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInUp.delay(index * 80).springify()}
        >
          <ItemCard item={item} />
        </Animated.View>
      ))}
    </>
  );
}
\`\`\`

### Fallback: Animated from react-native
If reanimated causes issues, you can use the built-in \`Animated\` API:
\`\`\`tsx
import { Animated, Easing } from 'react-native';

function FadeInView({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
\`\`\``;
