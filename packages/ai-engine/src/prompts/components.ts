/**
 * Component Patterns for React Native Web + Vite (Sandpack)
 * Ionicons, Image, Native Controls
 */

export const SF_SYMBOLS = `## Icons (@expo/vector-icons - Ionicons)

Use Ionicons from @expo/vector-icons for app icons. This is the icon library available in the Sandpack/Vite environment.

### Basic Usage
\`\`\`tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color="#fff" />
<Ionicons name="home-outline" size={24} color="#8e8e93" />
\`\`\`

### Icon in Pressable
\`\`\`tsx
<Pressable onPress={handlePress} style={{ padding: 8 }}>
  <Ionicons name="heart" size={24} color="#FF3B30" />
</Pressable>
\`\`\`

### Common Ionicons Names

**Navigation & Actions:**
- \`home\` / \`home-outline\`
- \`settings\` / \`settings-outline\`
- \`search\` / \`search-outline\`
- \`add\` / \`add-circle\` / \`add-circle-outline\`
- \`close\` / \`close-circle\`
- \`chevron-back\` / \`chevron-forward\`
- \`arrow-back\` / \`arrow-forward\`
- \`menu\` / \`ellipsis-horizontal\` / \`ellipsis-vertical\`

**Media:**
- \`play\` / \`pause\` / \`stop\`
- \`volume-high\` / \`volume-mute\`
- \`camera\` / \`camera-outline\`
- \`image\` / \`image-outline\`
- \`mic\` / \`mic-outline\`
- \`musical-notes\`

**Social:**
- \`heart\` / \`heart-outline\`
- \`star\` / \`star-outline\`
- \`thumbs-up\` / \`thumbs-down\`
- \`person\` / \`person-outline\`
- \`people\` / \`people-outline\`
- \`chatbubble\` / \`chatbubble-outline\`

**Content Actions:**
- \`share\` / \`share-outline\`
- \`download\` / \`download-outline\`
- \`copy\` / \`copy-outline\`
- \`trash\` / \`trash-outline\`
- \`pencil\` / \`create-outline\`
- \`bookmark\` / \`bookmark-outline\`

**Status:**
- \`checkmark\` / \`checkmark-circle\`
- \`close-circle\` / \`alert-circle\`
- \`warning\` / \`information-circle\`
- \`notifications\` / \`notifications-outline\`
- \`eye\` / \`eye-off\`

**Misc:**
- \`refresh\` / \`reload\`
- \`location\` / \`location-outline\`
- \`map\` / \`map-outline\`
- \`time\` / \`time-outline\`
- \`calendar\` / \`calendar-outline\`
- \`cart\` / \`cart-outline\`
- \`globe\` / \`globe-outline\`
- \`filter\` / \`options\`
- \`flash\` / \`flash-off\`
- \`moon\` / \`sunny\`
- \`log-out\` / \`log-in\`

### Other Icon Families Available
\`\`\`tsx
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
\`\`\``;

export const EXPO_IMAGE = `## Images (react-native Image)

Use Image from react-native for ALL images. This renders correctly via react-native-web.

### Basic Usage
\`\`\`tsx
import { Image } from 'react-native';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  resizeMode="cover"
/>
\`\`\`

### Image Props
\`\`\`tsx
<Image
  source={{ uri: imageUrl }}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  resizeMode="cover"        // cover|contain|stretch|repeat|center
/>
\`\`\`

### Avatar Pattern
\`\`\`tsx
<Image
  source={{ uri: avatarUrl }}
  style={{
    width: 48,
    height: 48,
    borderRadius: 24,
  }}
  resizeMode="cover"
/>
\`\`\`

### Placeholder for missing images
\`\`\`tsx
function Avatar({ uri, size = 48 }: { uri?: string; size?: number }) {
  if (!uri) {
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="person" size={size * 0.5} color="#8e8e93" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
    />
  );
}
\`\`\``;

export const MEDIA_COMPONENTS = `## Media (Limited in Sandpack)

Audio, video, and camera are NOT available in the Sandpack/Vite environment.
For apps that need media features, create placeholder UI that shows a mockup.

### Audio Player Placeholder
\`\`\`tsx
function AudioPlayer({ title }: { title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.player}>
      <Pressable onPress={() => setIsPlaying(!isPlaying)}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
      </Pressable>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{title}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: '35%' }]} />
        </View>
      </View>
    </View>
  );
}
\`\`\`

### Image Placeholder (for camera/gallery features)
\`\`\`tsx
function ImagePlaceholder({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.imagePlaceholder}>
      <Ionicons name="camera" size={32} color="#8e8e93" />
      <Text style={{ color: '#8e8e93', fontSize: 12, marginTop: 8 }}>Tap to add photo</Text>
    </Pressable>
  );
}
\`\`\``;

export const GLASS_AND_BLUR = `## Glass / Blur Effects (Web Alternative)

BlurView from expo-blur is NOT available. Use semi-transparent backgrounds instead.

### Frosted Glass Effect
\`\`\`tsx
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.glassCard}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
\`\`\`

### Overlay with Semi-transparent Background
\`\`\`tsx
<View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 24 }}>Modal Content</Text>
  </View>
</View>
\`\`\``;

export const NATIVE_CONTROLS = `## Native Controls

### Switch
\`\`\`tsx
import { Switch } from 'react-native';

const [enabled, setEnabled] = useState(false);

<Switch
  value={enabled}
  onValueChange={setEnabled}
  trackColor={{ false: '#3a3a3c', true: '#30D158' }}
  thumbColor="#fff"
/>
\`\`\`

### TextInput
\`\`\`tsx
<TextInput
  placeholder="Enter text..."
  placeholderTextColor="#8e8e93"
  style={{
    padding: 12,
    fontSize: 17,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    color: '#fff',
  }}
/>
\`\`\`

### Keyboard Types
\`\`\`tsx
// Email
<TextInput keyboardType="email-address" autoCapitalize="none" />

// Phone
<TextInput keyboardType="phone-pad" />

// Number
<TextInput keyboardType="numeric" />

// Password
<TextInput secureTextEntry />

// Search
<TextInput returnKeyType="search" enablesReturnKeyAutomatically />
\`\`\`

### Settings Row Pattern
\`\`\`tsx
function SettingsRow({ icon, title, value, onToggle }: {
  icon: string; title: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <Ionicons name={icon as any} size={22} color="#8e8e93" />
        <Text style={styles.settingsRowTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#3a3a3c', true: '#30D158' }}
      />
    </View>
  );
}
\`\`\``;

export const HAPTICS = `## Haptics

Haptics are NOT available in the Sandpack/Vite web environment.
Do NOT import or use expo-haptics. Instead, focus on visual feedback:

### Visual Feedback Alternatives
\`\`\`tsx
// Scale feedback on press
function PressableWithFeedback({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      }}
    >
      {children}
    </Pressable>
  );
}
\`\`\`

### Button with Active State
\`\`\`tsx
<Pressable
  onPress={handleAction}
  style={({ pressed }) => [
    styles.button,
    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
  ]}
>
  <Text style={styles.buttonText}>Action</Text>
</Pressable>
\`\`\``;
