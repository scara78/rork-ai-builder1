/**
 * Component Patterns for Expo Snack environment
 * @expo/vector-icons, expo-image, expo-blur, expo-haptics, native controls
 */

export const SF_SYMBOLS = `## Icons (@expo/vector-icons)

Use \`@expo/vector-icons\` for app icons. Multiple icon families are available.

### Basic Usage (Ionicons — recommended)
\`\`\`tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color="#fff" />
<Ionicons name="home-outline" size={24} color="#8e8e93" />
\`\`\`

### Other Icon Families
\`\`\`tsx
import { MaterialIcons, FontAwesome, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

<MaterialIcons name="dashboard" size={24} color="#fff" />
<FontAwesome name="star" size={24} color="#FFD60A" />
<Feather name="search" size={24} color="#fff" />
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
- \`create\` / \`create-outline\`
- \`bookmark\` / \`bookmark-outline\`

**Status:**
- \`checkmark\` / \`checkmark-circle\`
- \`alert-circle\` / \`warning\`
- \`information-circle\`
- \`notifications\` / \`notifications-outline\`
- \`eye\` / \`eye-off\`

**Misc:**
- \`refresh\`
- \`location\` / \`location-outline\`
- \`map\` / \`map-outline\`
- \`time\` / \`time-outline\`
- \`calendar\` / \`calendar-outline\`
- \`cart\` / \`cart-outline\`
- \`globe\`
- \`filter\`
- \`flash\` / \`flash-off\`
- \`moon\` / \`sunny\`
- \`log-out\` / \`log-in\`
`;

export const EXPO_IMAGE = `## Images (expo-image)

Use \`expo-image\` for ALL images. It's faster and more feature-rich than RN Image.

### Basic Usage
\`\`\`tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  transition={200}
/>
\`\`\`

### Image Props
\`\`\`tsx
<Image
  source={{ uri: imageUrl }}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  contentFit="cover"          // cover|contain|fill|none|scale-down
  placeholder={{ blurhash: 'LEHV6nWB2yk8' }}  // Blur placeholder while loading
  transition={200}            // Fade-in duration ms
/>
\`\`\`

### Avatar Pattern
\`\`\`tsx
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

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
      contentFit="cover"
      transition={200}
    />
  );
}
\`\`\``;

export const MEDIA_COMPONENTS = `## Media Components

### Camera (expo-camera)
\`\`\`tsx
// NOTE: Camera works on real devices via Expo Go but NOT in web preview.
// Design camera UIs to degrade gracefully with a placeholder on web.
import { Ionicons } from '@expo/vector-icons';

function CameraPlaceholder({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.cameraPlaceholder}>
      <Ionicons name="camera" size={32} color="#8e8e93" />
      <Text style={{ color: '#8e8e93', fontSize: 12, marginTop: 8 }}>Tap to take photo</Text>
    </Pressable>
  );
}
\`\`\`

### Audio/Video
For audio use \`expo-audio\`, for video use \`expo-video\`. These work on device but may not render in web preview.
Design placeholder UIs for web:

\`\`\`tsx
import { Ionicons } from '@expo/vector-icons';

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
\`\`\``;

export const GLASS_AND_BLUR = `## Glass / Blur Effects (expo-blur)

Use \`expo-blur\` for native blur effects. Works on iOS and Android.

### BlurView Usage
\`\`\`tsx
import { BlurView } from 'expo-blur';

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={styles.glassCard}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
\`\`\`

### Blur Overlay
\`\`\`tsx
import { BlurView } from 'expo-blur';

<View style={[StyleSheet.absoluteFillObject]}>
  <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 24 }}>Modal Content</Text>
  </View>
</View>
\`\`\`

### Fallback for Web Preview
If BlurView doesn't render on web, use a semi-transparent background:
\`\`\`tsx
<View style={{
  backgroundColor: 'rgba(28, 28, 30, 0.85)',
  borderRadius: 16,
  padding: 16,
}} />
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
    borderCurve: 'continuous',
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
import { Ionicons } from '@expo/vector-icons';

function SettingsRow({ iconName, title, value, onToggle }: {
  iconName: string; title: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <Ionicons name={iconName as any} size={22} color="#8e8e93" />
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

export const HAPTICS = `## Haptics (expo-haptics)

Use \`expo-haptics\` for tactile feedback on iOS. Conditionally call it so it doesn't crash on web.

### Basic Usage
\`\`\`tsx
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (Platform.OS !== 'web') {
    switch (type) {
      case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
      case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    }
  }
}

// Usage
<Pressable onPress={() => { hapticFeedback('light'); handleAction(); }}>
  <Text>Tap me</Text>
</Pressable>
\`\`\`

### Selection Feedback (for pickers, toggles)
\`\`\`tsx
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const onSelectionChange = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
};
\`\`\``;

export const THREE_D_GRAPHICS = `## 3D Games and Graphics (Rork Max Feature)

Rork Max supports 3D graphics using \`@react-three/fiber\` and \`@react-three/drei\`.
These work in the web preview. For native, use \`expo-gl\` as the GL context.

### Basic 3D Scene
\`\`\`tsx
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function SpinningCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#007AFF" />
    </mesh>
  );
}

export default function GameScreen() {
  return (
    <View style={styles.container}>
      <Canvas style={{ flex: 1 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <SpinningCube />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
});
\`\`\`

### Guidelines for 3D
- Use \`Canvas\` from \`@react-three/fiber\` directly inside a React Native \`View\` with \`flex: 1\`
- Import \`three\` when you need specific classes like \`THREE.Mesh\`
- \`@react-three/drei\` provides helpers: \`OrbitControls\`, \`Environment\`, \`Text3D\`
- 3D works in web preview; for native devices, ensure \`expo-gl\` is available
`;
