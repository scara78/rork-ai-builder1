/**
 * AI Context Injection System
 * Dynamically loads relevant documentation based on user prompts
 */

// Keywords mapped to documentation topics
const KEYWORD_TO_TOPIC: Record<string, string[]> = {
  // Navigation
  'tabs': ['navigation', 'native-tabs'],
  'tab': ['navigation', 'native-tabs'],
  'nativetabs': ['navigation', 'native-tabs'],
  'navigation': ['navigation'],
  'router': ['navigation'],
  'stack': ['navigation'],
  'modal': ['navigation'],
  'sheet': ['navigation'],
  'link': ['navigation'],
  'route': ['navigation'],
  
  // Styling
  'style': ['styling'],
  'shadow': ['styling'],
  'boxshadow': ['styling'],
  'border': ['styling'],
  'borderradius': ['styling'],
  'bordercurve': ['styling'],
  'animation': ['styling'],
  'layout': ['styling'],
  'responsive': ['styling'],
  'dark mode': ['styling'],
  'theme': ['styling'],
  
  // Components
  'icon': ['sf-symbols'],
  'sf symbol': ['sf-symbols'],
  'symbol': ['sf-symbols'],
  'image': ['components'],
  'camera': ['media'],
  'video': ['media'],
  'audio': ['media'],
  'blur': ['visual-effects'],
  'glass': ['visual-effects'],
  'haptic': ['components'],
  'switch': ['components'],
  'slider': ['components'],
  'picker': ['components'],
  'input': ['components'],
  'text': ['styling'],
  
  // Media
  'photo': ['media'],
  'record': ['media'],
  'play': ['media'],
  'media library': ['media'],
  'gallery': ['media'],
  
  // General
  'expo': ['expo-sdk'],
  'expo go': ['expo-sdk'],
  'safe area': ['styling', 'expo-sdk'],
  'scrollview': ['styling'],
  'flatlist': ['styling'],
  'list': ['styling'],
};

// Topic to documentation content
const TOPIC_DOCS: Record<string, string> = {
  'navigation': `## Navigation Context

Use NativeTabs from 'expo-router/unstable-native-tabs' for native iOS tab bars:
\`\`\`tsx
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';

<NativeTabs minimizeBehavior="onScrollDown">
  <NativeTabs.Trigger name="index">
    <Label>Home</Label>
    <Icon sf="house.fill" />
  </NativeTabs.Trigger>
</NativeTabs>
\`\`\`

Use Link.Preview and Link.Menu for context menus:
\`\`\`tsx
<Link href="/item">
  <Link.Trigger><Pressable><Card /></Pressable></Link.Trigger>
  <Link.Preview />
  <Link.Menu>
    <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={share} />
  </Link.Menu>
</Link>
\`\`\`

For modals and sheets:
\`\`\`tsx
<Stack.Screen name="sheet" options={{
  presentation: 'formSheet',
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.5, 1.0],
  contentStyle: { backgroundColor: 'transparent' }, // Liquid glass on iOS 26+
}} />
\`\`\``,

  'native-tabs': `## NativeTabs (SDK 54+)

ALWAYS prefer NativeTabs for the best iOS experience:
\`\`\`tsx
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
        <Badge>9+</Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search" />
    </NativeTabs>
  );
}
\`\`\`

Key rules:
- Trigger 'name' must match route name exactly
- Use \`role="search"\` for search tabs (place last)
- Native tabs don't render headers - nest Stacks inside each tab`,

  'styling': `## Modern Styling Rules

Use CSS boxShadow (NOT legacy shadow styles):
\`\`\`tsx
<View style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
\`\`\`

Use borderCurve: 'continuous' for Apple-style corners:
\`\`\`tsx
<View style={{ borderRadius: 16, borderCurve: 'continuous' }} />
\`\`\`

Use PlatformColor for dark mode:
\`\`\`tsx
import { PlatformColor } from 'react-native';
<Text style={{ color: PlatformColor('label') }}>Primary text</Text>
<View style={{ backgroundColor: PlatformColor('secondarySystemBackground') }} />
\`\`\`

Use contentInsetAdjustmentBehavior="automatic" on ScrollView/FlatList instead of SafeAreaView.`,

  'sf-symbols': `## SF Symbols (expo-symbols)

Use SF Symbols for native iOS icons. NEVER use @expo/vector-icons:
\`\`\`tsx
import { SymbolView } from 'expo-symbols';
import { PlatformColor } from 'react-native';

<SymbolView
  name="house.fill"
  tintColor={PlatformColor('label')}
  size={24}
/>
\`\`\`

Common icons:
- Navigation: house.fill, gear, magnifyingglass, plus, xmark, chevron.left/right
- Media: play.fill, pause.fill, camera, photo, speaker.wave.2.fill
- Social: heart/heart.fill, star/star.fill, person/person.fill
- Actions: square.and.arrow.up (share), trash, pencil, bookmark`,

  'media': `## Media (expo-audio, expo-video)

Audio playback (use expo-audio, NOT expo-av):
\`\`\`tsx
import { useAudioPlayer } from 'expo-audio';
const player = useAudioPlayer({ uri: 'https://example.com/audio.mp3' });
player.play();
\`\`\`

Video playback (use expo-video, NOT expo-av):
\`\`\`tsx
import { useVideoPlayer, VideoView } from 'expo-video';
const player = useVideoPlayer(videoUrl, p => { p.loop = true; p.play(); });
<VideoView player={player} allowsPictureInPicture nativeControls />
\`\`\`

Camera:
\`\`\`tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GlassView } from 'expo-glass-effect';

// Use GlassView buttons, mirror prop for selfie emulation
<CameraView ref={cameraRef} mirror facing={facing} />
\`\`\``,

  'visual-effects': `## Visual Effects

BlurView (expo-blur):
\`\`\`tsx
import { BlurView } from 'expo-blur';
<BlurView tint="systemMaterial" intensity={80} style={{ borderRadius: 16, overflow: 'hidden' }} />
\`\`\`

GlassView (expo-glass-effect) for iOS 26+ liquid glass:
\`\`\`tsx
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

<GlassView isInteractive style={{ borderRadius: 50, padding: 12 }}>
  <Pressable onPress={action}>
    <SymbolView name="plus" tintColor={PlatformColor('label')} size={24} />
  </Pressable>
</GlassView>
\`\`\``,

  'components': `## Modern Components

Use expo-image for all images:
\`\`\`tsx
import { Image } from 'expo-image';
<Image source={{ uri }} style={{ width: 200, height: 200 }} contentFit="cover" />
\`\`\`

Native controls with built-in haptics:
\`\`\`tsx
import { Switch, TextInput } from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import DateTimePicker from '@react-native-community/datetimepicker';
\`\`\`

Conditional haptics:
\`\`\`tsx
import * as Haptics from 'expo-haptics';
if (process.env.EXPO_OS === 'ios') {
  await Haptics.selectionAsync();
}
\`\`\``,

  'expo-sdk': `## Expo SDK 54+ Rules

Library preferences:
- expo-audio (NOT expo-av)
- expo-video (NOT expo-av)
- expo-symbols (NOT @expo/vector-icons)
- process.env.EXPO_OS (NOT Platform.OS)
- useWindowDimensions (NOT Dimensions.get())

Project structure:
- app/ for routes ONLY (never co-locate components)
- components/, hooks/, utils/ for code
- kebab-case file names

Safe areas:
- Use contentInsetAdjustmentBehavior="automatic" on ScrollView/FlatList
- NOT SafeAreaView from react-native`,
};

/**
 * Analyze prompt and return relevant context
 */
export function analyzePromptForContext(prompt: string): string[] {
  const promptLower = prompt.toLowerCase();
  const relevantTopics = new Set<string>();
  
  for (const [keyword, topics] of Object.entries(KEYWORD_TO_TOPIC)) {
    if (promptLower.includes(keyword)) {
      topics.forEach(topic => relevantTopics.add(topic));
    }
  }
  
  return Array.from(relevantTopics);
}

/**
 * Get documentation for specific topics
 */
export function getContextDocs(topics: string[]): string {
  const docs: string[] = [];
  
  for (const topic of topics) {
    if (TOPIC_DOCS[topic]) {
      docs.push(TOPIC_DOCS[topic]);
    }
  }
  
  if (docs.length === 0) {
    return '';
  }
  
  return `\n\n## Relevant Context for This Request\n\n${docs.join('\n\n---\n\n')}`;
}

/**
 * Enhance prompt with relevant context based on content analysis
 */
export function enhancePromptWithContext(prompt: string): string {
  const topics = analyzePromptForContext(prompt);
  const contextDocs = getContextDocs(topics);
  
  if (!contextDocs) {
    return prompt;
  }
  
  return `${prompt}\n\n${contextDocs}`;
}

/**
 * Get context summary for debugging
 */
export function getContextSummary(prompt: string): { topics: string[]; hasContext: boolean } {
  const topics = analyzePromptForContext(prompt);
  return {
    topics,
    hasContext: topics.length > 0,
  };
}
