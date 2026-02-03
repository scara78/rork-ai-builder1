/**
 * Expo Router Navigation Patterns
 * NativeTabs, Link.Preview, Link.Menu, Stacks, Modals, Sheets
 */

export const NATIVE_TABS = `## NativeTabs (SDK 54+)

ALWAYS prefer NativeTabs from 'expo-router/unstable-native-tabs' for the best iOS experience.

### Basic Usage
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
      <NativeTabs.Trigger name="settings">
        <Icon sf="gear" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <Label>Search</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
\`\`\`

### NativeTabs Rules
- Include a trigger for EACH tab
- Trigger 'name' must match route name exactly (including parentheses)
- Place search tab LAST for best UX
- Use 'role' prop for common tab types

### Icon Component
\`\`\`tsx
// SF Symbol only (iOS)
<Icon sf="house.fill" />

// With Android drawable
<Icon sf="house.fill" drawable="ic_home" />

// State variants (default/selected)
<Icon sf={{ default: "house", selected: "house.fill" }} />
\`\`\`

### Badge Component
\`\`\`tsx
<Badge>9+</Badge>  // Numeric badge
<Badge />          // Dot indicator
\`\`\`

### iOS 26 Features
- Liquid glass tab bar automatically
- \`minimizeBehavior="onScrollDown"\` for auto-hide
- Search tab with role="search"

### Available Roles
\`search\` | \`more\` | \`favorites\` | \`bookmarks\` | \`contacts\` | \`downloads\` | \`featured\` | \`history\` | \`mostRecent\` | \`mostViewed\` | \`recents\` | \`topRated\`

### NativeTabs + Stacks
Native tabs don't render headers. Nest Stacks inside each tab:

\`\`\`tsx
// app/_layout.tsx
<NativeTabs>
  <NativeTabs.Trigger name="(home)">
    <Label>Home</Label>
    <Icon sf="house.fill" />
  </NativeTabs.Trigger>
</NativeTabs>

// app/(home)/_layout.tsx
import { Stack } from 'expo-router/stack';

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home', headerLargeTitle: true }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}
\`\`\``;

export const LINK_PATTERNS = `## Link Component Patterns

### Basic Link
\`\`\`tsx
import { Link } from 'expo-router';

<Link href="/path" />

// Wrapping custom components
<Link href="/path" asChild>
  <Pressable>...</Pressable>
</Link>
\`\`\`

### Link with Preview (iOS)
Use Link.Preview frequently to enhance navigation:

\`\`\`tsx
<Link href="/settings">
  <Link.Trigger>
    <Pressable>
      <Card />
    </Pressable>
  </Link.Trigger>
  <Link.Preview />
</Link>
\`\`\`

### Link with Context Menu
Add long press context menus to Link components:

\`\`\`tsx
import { Link } from 'expo-router';

<Link href="/settings" asChild>
  <Link.Trigger>
    <Pressable>
      <Card />
    </Pressable>
  </Link.Trigger>
  <Link.Menu>
    <Link.MenuAction
      title="Share"
      icon="square.and.arrow.up"
      onPress={handleSharePress}
    />
    <Link.MenuAction
      title="Block"
      icon="nosign"
      destructive
      onPress={handleBlockPress}
    />
    <Link.Menu title="More" icon="ellipsis">
      <Link.MenuAction title="Copy" icon="doc.on.doc" onPress={() => {}} />
      <Link.MenuAction title="Delete" icon="trash" destructive onPress={() => {}} />
    </Link.Menu>
  </Link.Menu>
</Link>
\`\`\`

### Link Preview + Menu Combined
\`\`\`tsx
<Link href="/item/123">
  <Link.Trigger>
    <Pressable><ItemCard /></Pressable>
  </Link.Trigger>
  <Link.Preview />
  <Link.Menu>
    <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={share} />
    <Link.MenuAction title="Delete" icon="trash" destructive onPress={remove} />
  </Link.Menu>
</Link>
\`\`\``;

export const STACK_NAVIGATION = `## Stack Navigation

### Stack Setup
\`\`\`tsx
import { Stack } from 'expo-router/stack';
import { PlatformColor } from 'react-native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { color: PlatformColor('label') },
        headerLargeTitle: true,
        headerBlurEffect: 'none',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}
\`\`\`

### Page Titles
ALWAYS use Stack.Screen options for titles - never custom text elements:
\`\`\`tsx
<Stack.Screen options={{ title: 'Home' }} />
\`\`\`

### Search Bar in Header
Prefer headerSearchBarOptions to add search:
\`\`\`tsx
<Stack.Screen
  options={{
    title: 'Search',
    headerSearchBarOptions: {
      placeholder: 'Search items...',
      onChangeText: setSearchText,
    },
  }}
/>
\`\`\``;

export const MODALS_AND_SHEETS = `## Modals and Sheets

### Modal Presentation
\`\`\`tsx
<Stack.Screen name="modal" options={{ presentation: 'modal' }} />
\`\`\`
Prefer this over building custom modal components.

### Form Sheet with Detents
\`\`\`tsx
<Stack.Screen
  name="sheet"
  options={{
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
    contentStyle: { backgroundColor: 'transparent' },
  }}
/>
\`\`\`

### Glass Background Sheet (iOS 26+)
Use \`contentStyle: { backgroundColor: 'transparent' }\` for liquid glass:
\`\`\`tsx
<Stack.Screen
  name="glass-sheet"
  options={{
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 0.75, 1.0],
    contentStyle: { backgroundColor: 'transparent' },
  }}
/>
\`\`\``;

export const ROUTE_STRUCTURE = `## Route Structure Patterns

### Standard App with Tabs
\`\`\`
app/
  _layout.tsx — <NativeTabs />
  (index,search)/
    _layout.tsx — <Stack />
    index.tsx — Main list
    search.tsx — Search view
    i/[id].tsx — Detail page
\`\`\`

### Root Layout with NativeTabs
\`\`\`tsx
// app/_layout.tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Theme } from '../components/theme';

export default function Layout() {
  return (
    <Theme>
      <NativeTabs>
        <NativeTabs.Trigger name="(index)">
          <Icon sf="list.dash" />
          <Label>Items</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(search)" role="search" />
      </NativeTabs>
    </Theme>
  );
}
\`\`\`

### Shared Group Route (Multiple Stacks)
Create shared routes so tabs can push common screens:

\`\`\`tsx
// app/(index,search)/_layout.tsx
import { Stack } from 'expo-router/stack';
import { PlatformColor } from 'react-native';

export const unstable_settings = {
  index: { anchor: 'index' },
  search: { anchor: 'search' },
};

export default function Layout({ segment }: { segment: string }) {
  const screen = segment.match(/\\((.*?)\\)/)?.[1]!;
  const titles: Record<string, string> = { index: 'Items', search: 'Search' };

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerTitleStyle: { color: PlatformColor('label') },
        headerLargeTitle: true,
        headerBlurEffect: 'none',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name={screen} options={{ title: titles[screen] }} />
      <Stack.Screen name="i/[id]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
\`\`\`

### Dynamic Routes
\`\`\`tsx
// app/users/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function UserPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // ...
}
\`\`\`

### Catch-All Routes
\`\`\`
app/docs/[...slug].tsx  // Matches /docs/a, /docs/a/b, /docs/a/b/c
\`\`\``;

export const NAVIGATION_HOOKS = `## Navigation Hooks

### useRouter
\`\`\`tsx
import { useRouter } from 'expo-router';

const router = useRouter();

router.push('/details');           // Push new screen
router.replace('/home');           // Replace current screen
router.back();                     // Go back
router.canGoBack();               // Check if can go back
router.dismiss();                 // Dismiss modal
router.dismissAll();              // Dismiss all modals
\`\`\`

### useLocalSearchParams
\`\`\`tsx
import { useLocalSearchParams } from 'expo-router';

// For [id].tsx route
const { id } = useLocalSearchParams<{ id: string }>();

// For query params ?filter=active
const { filter } = useLocalSearchParams<{ filter?: string }>();
\`\`\`

### usePathname
\`\`\`tsx
import { usePathname } from 'expo-router';

const pathname = usePathname(); // e.g., '/users/123'
\`\`\`

### useSegments
\`\`\`tsx
import { useSegments } from 'expo-router';

const segments = useSegments(); // ['users', '123']
\`\`\``;
