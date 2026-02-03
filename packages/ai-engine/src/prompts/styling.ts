/**
 * Modern Expo Styling Rules
 * boxShadow, borderCurve, inline styles, safe areas
 */

export const STYLING_RULES = `## Modern Styling Rules

### General Rules
- **Inline styles preferred** over StyleSheet.create unless reusing styles
- **CSS and Tailwind NOT supported** - use inline styles only
- Prefer flex gap over margin/padding
- Prefer padding over margin where possible
- Add entering/exiting animations for state changes
- ALWAYS use navigation stack title instead of custom text on page

### Safe Area Handling
- ALWAYS account for safe area (top AND bottom)
- Use Stack headers, tabs, or ScrollView with \`contentInsetAdjustmentBehavior="automatic"\`
- When padding a ScrollView, use \`contentContainerStyle\` padding instead of ScrollView padding (reduces clipping)

### Shadows (CRITICAL)
Use CSS \`boxShadow\` style prop. NEVER use legacy React Native shadow or elevation styles:

\`\`\`tsx
// CORRECT - Modern CSS boxShadow
<View style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }} />
<View style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
<View style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />

// Inset shadows supported
<View style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)' }} />

// WRONG - Never use these
<View style={{ 
  shadowColor: '#000',     // DEPRECATED
  shadowOffset: {},        // DEPRECATED
  shadowOpacity: 0.1,      // DEPRECATED
  shadowRadius: 3,         // DEPRECATED
  elevation: 5,            // DEPRECATED
}} />
\`\`\`

### Common Shadow Presets
\`\`\`tsx
const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
};
\`\`\`

### Border Radius
Use \`borderCurve: 'continuous'\` for Apple-style rounded corners:

\`\`\`tsx
// CORRECT - Smooth continuous corners
<View style={{ 
  borderRadius: 16,
  borderCurve: 'continuous',  // Apple's squircle
}} />

// Exception: Capsule shapes (pills)
<View style={{ 
  borderRadius: 9999,  // No borderCurve for perfect circles/capsules
}} />
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
<View
  style={{
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }}
>
  <Text style={{ fontSize: 17, fontWeight: '600', color: PlatformColor('label') }}>
    Title
  </Text>
  <Text style={{ fontSize: 15, color: PlatformColor('secondaryLabel') }}>
    Description
  </Text>
</View>
\`\`\`

### Row Pattern
\`\`\`tsx
<View
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  }}
>
  <SymbolView name="star.fill" tintColor={PlatformColor('systemYellow')} size={24} />
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: 17, color: PlatformColor('label') }}>Title</Text>
    <Text style={{ fontSize: 15, color: PlatformColor('secondaryLabel') }}>Subtitle</Text>
  </View>
  <SymbolView name="chevron.right" tintColor={PlatformColor('tertiaryLabel')} size={16} />
</View>
\`\`\``;

export const TEXT_STYLING = `## Text Styling

### Text Rules
- Add \`selectable\` prop to every <Text/> displaying important data or error messages
- Use \`fontVariant: 'tabular-nums'\` for counters and numbers (alignment)
- Format large numbers: 1.4M, 38k instead of 1400000

### Typography Scale
\`\`\`tsx
const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' },
  title1: { fontSize: 28, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  title3: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  callout: { fontSize: 16, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  footnote: { fontSize: 13, fontWeight: '400' },
  caption1: { fontSize: 12, fontWeight: '400' },
  caption2: { fontSize: 11, fontWeight: '400' },
};
\`\`\`

### Platform Colors
Always use PlatformColor for automatic dark mode support:
\`\`\`tsx
import { PlatformColor } from 'react-native';

// Text colors
PlatformColor('label')           // Primary text
PlatformColor('secondaryLabel')  // Secondary text
PlatformColor('tertiaryLabel')   // Tertiary text
PlatformColor('quaternaryLabel') // Quaternary text

// Background colors
PlatformColor('systemBackground')           // Primary background
PlatformColor('secondarySystemBackground')  // Cards, grouped content
PlatformColor('tertiarySystemBackground')   // Nested content

// Accent colors
PlatformColor('systemBlue')
PlatformColor('systemGreen')
PlatformColor('systemRed')
PlatformColor('systemYellow')
PlatformColor('systemOrange')
PlatformColor('systemPurple')
PlatformColor('systemPink')
PlatformColor('systemTeal')
PlatformColor('systemIndigo')
\`\`\``;

export const RESPONSIVE_DESIGN = `## Responsive Design

### Screen Dimensions
ALWAYS use \`useWindowDimensions\` - never \`Dimensions.get()\`:

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

### Safe Area
\`\`\`tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Content */}
    </View>
  );
}
\`\`\`

### Keyboard Avoiding
\`\`\`tsx
import { KeyboardAvoidingView } from 'react-native';

<KeyboardAvoidingView
  behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* Form content */}
</KeyboardAvoidingView>
\`\`\``;

export const ANIMATION_STYLING = `## Animation Patterns

### Entering/Exiting Animations
Add animations for state changes using react-native-reanimated:

\`\`\`tsx
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';

// Fade in/out
<Animated.View entering={FadeIn} exiting={FadeOut}>
  <Card />
</Animated.View>

// Slide in from right
<Animated.View entering={SlideInRight.duration(300)}>
  <ListItem />
</Animated.View>
\`\`\`

### Layout Animations
\`\`\`tsx
import Animated, { LinearTransition } from 'react-native-reanimated';

<Animated.View layout={LinearTransition.springify()}>
  {/* Content that changes size */}
</Animated.View>
\`\`\`

### Common Animation Presets
\`\`\`tsx
// Fade
FadeIn, FadeOut, FadeInUp, FadeInDown, FadeOutUp, FadeOutDown

// Slide
SlideInRight, SlideInLeft, SlideOutRight, SlideOutLeft
SlideInUp, SlideInDown, SlideOutUp, SlideOutDown

// Zoom
ZoomIn, ZoomOut, ZoomInUp, ZoomInDown

// Bounce
BounceIn, BounceOut, BounceInUp, BounceInDown
\`\`\``;
