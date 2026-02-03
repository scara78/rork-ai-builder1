/**
 * Modern Expo Component Patterns
 * SF Symbols, expo-image, expo-audio/video, Glass Effects, Native Controls
 */

export const SF_SYMBOLS = `## SF Symbols (expo-symbols)

Use SF Symbols for native iOS feel. NEVER use FontAwesome or Ionicons.

### Basic Usage
\`\`\`tsx
import { SymbolView } from 'expo-symbols';
import { PlatformColor } from 'react-native';

<SymbolView
  name="square.and.arrow.down"
  tintColor={PlatformColor('label')}
  resizeMode="scaleAspectFit"
  style={{ width: 24, height: 24 }}
/>
\`\`\`

### SymbolView Props
\`\`\`tsx
<SymbolView
  name="star.fill"                    // SF Symbol name (required)
  tintColor={PlatformColor('label')}  // Icon color
  size={24}                           // Shorthand for width/height
  resizeMode="scaleAspectFit"         // How to scale
  weight="regular"                    // thin|ultraLight|light|regular|medium|semibold|bold|heavy|black
  scale="medium"                      // small|medium|large
/>
\`\`\`

### Common SF Symbol Names

**Navigation & Actions:**
- \`house.fill\` - home
- \`gear\` - settings
- \`magnifyingglass\` - search
- \`plus\` - add
- \`xmark\` - close
- \`chevron.left\` / \`chevron.right\` - back/forward
- \`arrow.left\` / \`arrow.right\` - back/forward arrows

**Media:**
- \`play.fill\` / \`pause.fill\` - play/pause
- \`speaker.wave.2.fill\` / \`speaker.slash.fill\` - volume/mute
- \`camera\` / \`camera.fill\` - camera
- \`photo\` - gallery
- \`bolt\` / \`bolt.slash\` - flash on/off
- \`arrow.triangle.2.circlepath\` - flip camera

**Social:**
- \`heart\` / \`heart.fill\` - like
- \`star\` / \`star.fill\` - favorite
- \`hand.thumbsup\` / \`hand.thumbsdown\` - thumbs
- \`person\` / \`person.fill\` - profile
- \`person.2\` / \`person.2.fill\` - people

**Content Actions:**
- \`square.and.arrow.up\` - share
- \`square.and.arrow.down\` - download
- \`doc.on.doc\` - copy
- \`trash\` - delete
- \`pencil\` - edit
- \`bookmark\` / \`bookmark.fill\` - bookmark

**Status:**
- \`checkmark\` / \`checkmark.circle.fill\` - success
- \`xmark.circle.fill\` - error
- \`exclamationmark.triangle\` - warning
- \`info.circle\` - info
- \`bell\` / \`bell.fill\` - notification

**Misc:**
- \`ellipsis\` - more options
- \`line.3.horizontal\` - menu
- \`slider.horizontal.3\` - filters
- \`arrow.clockwise\` - refresh
- \`location\` / \`location.fill\` - location
- \`mappin\` - pin
- \`clock\` - time
- \`calendar\` - calendar
- \`nosign\` - block

### Animated Symbols
\`\`\`tsx
<SymbolView
  name="checkmark.circle"
  animationSpec={{
    effect: { type: 'bounce', direction: 'up' },
  }}
/>

// Animation types: bounce, pulse, variableColor, scale
\`\`\`

### Multicolor Symbols
\`\`\`tsx
<SymbolView
  name="cloud.sun.rain.fill"
  type="multicolor"
/>
\`\`\``;

export const EXPO_IMAGE = `## expo-image

Use expo-image for ALL images. Never use intrinsic <img> or RN Image.

### Basic Usage
\`\`\`tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
/>
\`\`\`

### Image Props
\`\`\`tsx
<Image
  source={{ uri: imageUrl }}
  style={{ width: '100%', aspectRatio: 16 / 9 }}
  contentFit="cover"        // cover|contain|fill|none|scale-down
  placeholder={blurhash}     // Blurhash placeholder
  transition={200}           // Fade-in duration (ms)
  cachePolicy="memory-disk"  // Caching strategy
/>
\`\`\`

### Local Images
\`\`\`tsx
<Image
  source={require('./assets/logo.png')}
  style={{ width: 100, height: 100 }}
/>
\`\`\`

### Blurhash Placeholder
\`\`\`tsx
<Image
  source={{ uri: imageUrl }}
  placeholder="LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
  contentFit="cover"
  transition={300}
  style={{ width: '100%', height: 200 }}
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
  contentFit="cover"
/>
\`\`\``;

export const MEDIA_COMPONENTS = `## Media Components

### Audio Playback (expo-audio)
\`\`\`tsx
import { useAudioPlayer } from 'expo-audio';

function AudioPlayer() {
  const player = useAudioPlayer({ uri: 'https://example.com/audio.mp3' });

  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Pressable onPress={() => player.play()}>
        <SymbolView name="play.fill" size={32} tintColor={PlatformColor('label')} />
      </Pressable>
      <Pressable onPress={() => player.pause()}>
        <SymbolView name="pause.fill" size={32} tintColor={PlatformColor('label')} />
      </Pressable>
    </View>
  );
}
\`\`\`

### Audio Recording
\`\`\`tsx
import { useAudioRecorder, AudioModule, RecordingPresets, useAudioRecorderState } from 'expo-audio';

function Recorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  const startRecording = async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (granted) {
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
  };

  return (
    <Pressable onPress={state.isRecording ? () => recorder.stop() : startRecording}>
      <SymbolView
        name={state.isRecording ? 'stop.fill' : 'mic.fill'}
        size={48}
        tintColor={state.isRecording ? PlatformColor('systemRed') : PlatformColor('label')}
      />
    </Pressable>
  );
}
\`\`\`

### Video Playback (expo-video)
\`\`\`tsx
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';

function VideoPlayer({ source }: { source: string }) {
  const player = useVideoPlayer(source, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <VideoView
      player={player}
      style={{ width: '100%', aspectRatio: 16 / 9 }}
      allowsPictureInPicture
      nativeControls
    />
  );
}
\`\`\`

### Camera
\`\`\`tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GlassView } from 'expo-glass-effect';

function Camera({ onCapture }: { onCapture: (uri: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Camera access required</Text>
        <Pressable onPress={requestPermission}>
          <Text style={{ color: PlatformColor('systemBlue') }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo) onCapture(photo.uri);
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mirror />
      <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
        <GlassView isInteractive style={{ borderRadius: 99, padding: 8 }}>
          <Pressable onPress={takePicture} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' }} />
        </GlassView>
      </View>
    </View>
  );
}
\`\`\``;

export const GLASS_AND_BLUR = `## Glass & Blur Effects

### BlurView (expo-blur)
\`\`\`tsx
import { BlurView } from 'expo-blur';

<BlurView tint="systemMaterial" intensity={100}>
  <Text>Blurred content</Text>
</BlurView>
\`\`\`

#### Tint Options
- System materials (adapt to dark mode): \`systemMaterial\`, \`systemThinMaterial\`, \`systemUltraThinMaterial\`, \`systemThickMaterial\`
- Basic: \`light\`, \`dark\`, \`default\`
- Extra: \`extraLight\`, \`prominent\`

#### Rounded BlurView
\`\`\`tsx
<BlurView
  tint="systemMaterial"
  intensity={80}
  style={{
    borderRadius: 16,
    overflow: 'hidden',  // REQUIRED for rounded corners
    padding: 16,
  }}
>
  <Text>Card content</Text>
</BlurView>
\`\`\`

### GlassView (expo-glass-effect) - iOS 26+
\`\`\`tsx
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

<GlassView style={{ borderRadius: 16, padding: 16 }}>
  <Text>Liquid glass content</Text>
</GlassView>
\`\`\`

#### Interactive Glass Button
\`\`\`tsx
<GlassView isInteractive style={{ borderRadius: 50 }}>
  <Pressable onPress={handlePress} style={{ padding: 12 }}>
    <SymbolView name="plus" tintColor={PlatformColor('label')} size={24} />
  </Pressable>
</GlassView>
\`\`\`

#### Fallback Pattern
\`\`\`tsx
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

function AdaptiveGlass({ children, style }) {
  if (isLiquidGlassAvailable()) {
    return <GlassView style={style}>{children}</GlassView>;
  }
  return (
    <BlurView tint="systemMaterial" intensity={80} style={style}>
      {children}
    </BlurView>
  );
}
\`\`\``;

export const NATIVE_CONTROLS = `## Native Controls

### Switch
\`\`\`tsx
import { Switch } from 'react-native';

const [enabled, setEnabled] = useState(false);

<Switch value={enabled} onValueChange={setEnabled} />
\`\`\`

### Segmented Control
\`\`\`tsx
import SegmentedControl from '@react-native-segmented-control/segmented-control';

const [index, setIndex] = useState(0);

<SegmentedControl
  values={['All', 'Active', 'Done']}
  selectedIndex={index}
  onChange={({ nativeEvent }) => setIndex(nativeEvent.selectedSegmentIndex)}
/>
\`\`\`

### Slider
\`\`\`tsx
import Slider from '@react-native-community/slider';

const [value, setValue] = useState(0.5);

<Slider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={1}
/>
\`\`\`

### DateTimePicker
\`\`\`tsx
import DateTimePicker from '@react-native-community/datetimepicker';

const [date, setDate] = useState(new Date());

<DateTimePicker
  value={date}
  onChange={(event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
  }}
  mode="datetime"
/>
\`\`\`

### TextInput
\`\`\`tsx
<TextInput
  placeholder="Enter text..."
  placeholderTextColor={PlatformColor('placeholderText')}
  style={{
    padding: 12,
    fontSize: 17,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: PlatformColor('tertiarySystemBackground'),
    color: PlatformColor('label'),
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
\`\`\``;

export const HAPTICS = `## Haptics

Use expo-haptics conditionally on iOS for delightful experiences:

\`\`\`tsx
import * as Haptics from 'expo-haptics';

// Selection feedback (light)
await Haptics.selectionAsync();

// Impact feedback
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Notification feedback
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
\`\`\`

### Conditional Haptics
\`\`\`tsx
const handlePress = async () => {
  if (process.env.EXPO_OS === 'ios') {
    await Haptics.selectionAsync();
  }
  // ... rest of handler
};
\`\`\`

### Don't Double Haptic
Native controls like Switch and DateTimePicker have built-in haptics - don't add extra!`;
