/**
 * Navigation Patterns for Expo Snack environment
 * Uses expo-router for file-based routing
 */

export const NATIVE_TABS = `## Tab Navigation (expo-router Tabs)

### Tab Layout
\`\`\`tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopColor: '#38383a',
        },
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
\`\`\`

### Tab Screen Example
\`\`\`tsx
// app/(tabs)/index.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      style={styles.container}
    >
      <Text style={styles.title}>Home</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
});
\`\`\`

### Common Ionicons Names
**Navigation:** home, compass, search, arrow-back, chevron-forward, menu
**Social:** heart, heart-outline, person, people, chatbubble
**Media:** camera, image, play, musical-notes, mic
**Actions:** add, close, checkmark, trash, create, share
**Status:** notifications, settings, star, bookmark, flag
**Misc:** cart, calendar, location, time, globe, filter`;

export const LINK_PATTERNS = `## Navigation Between Screens

### Using Link Component
\`\`\`tsx
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

// Simple text link
<Link href="/details/123">
  <Text style={{ color: '#007AFF' }}>View Details</Text>
</Link>

// Wrapping a custom component
<Link href="/details/123" asChild>
  <Pressable style={styles.card}>
    <Text style={styles.cardTitle}>Item Title</Text>
  </Pressable>
</Link>
\`\`\`

### Using useRouter Hook
\`\`\`tsx
import { useRouter } from 'expo-router';

function HomeScreen() {
  const router = useRouter();

  const handlePress = (id: string) => {
    router.push(\`/details/\${id}\`);
  };

  return (
    <Pressable onPress={() => handlePress('123')}>
      <Text>View Details</Text>
    </Pressable>
  );
}
\`\`\`

### Reading URL Parameters
\`\`\`tsx
// app/details/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <Text style={{ color: '#fff' }}>Detail ID: {id}</Text>
    </View>
  );
}
\`\`\`

### Going Back
\`\`\`tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.back(); // Go back to previous screen
\`\`\``;

export const STACK_NAVIGATION = `## Stack Navigation

### Root Layout with Stack
\`\`\`tsx
// app/_layout.tsx
import { Stack } from 'expo-router/stack';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: '#0a0a0a' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="details/[id]" options={{ title: 'Details' }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          title: 'Create New',
        }}
      />
    </Stack>
  );
}
\`\`\`

### Setting Screen Options Dynamically
\`\`\`tsx
// app/details/[id].tsx
import { Stack } from 'expo-router/stack';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: \`Item \${id}\` }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Content */}
      </ScrollView>
    </>
  );
}
\`\`\`

### Header with Right Action
\`\`\`tsx
<Stack.Screen
  options={{
    title: 'Profile',
    headerRight: () => (
      <Pressable onPress={handleEdit}>
        <Ionicons name="create-outline" size={22} color="#007AFF" />
      </Pressable>
    ),
  }}
/>
\`\`\``;

export const MODALS_AND_SHEETS = `## Modals and Sheets

### Modal Presentation (via expo-router)
\`\`\`tsx
// In _layout.tsx
<Stack.Screen name="modal" options={{ presentation: 'modal' }} />

// app/modal.tsx
import { useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Create New</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
      {/* Modal content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1e' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#38383a',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#fff' },
  cancelText: { fontSize: 17, color: '#007AFF' },
  saveText: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
});
\`\`\`

### Form Sheet (iOS)
\`\`\`tsx
// In _layout.tsx — presents as a draggable sheet on iOS
<Stack.Screen
  name="sheet"
  options={{
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
  }}
/>
\`\`\``;

export const ROUTE_STRUCTURE = `## Project Structure for expo-router

### Standard App with Tabs + Stack
\`\`\`
App.tsx                        — Entry point (re-exports expo-router entry)
app/
  _layout.tsx                  — Root Stack layout
  (tabs)/
    _layout.tsx                — Tab layout (Tabs component)
    index.tsx                  — Home tab (/)
    explore.tsx                — Explore tab
    profile.tsx                — Profile tab
  details/
    [id].tsx                   — Detail screen (/details/123)
  modal.tsx                    — Modal screen
  +not-found.tsx               — 404 screen
components/
  card.tsx                     — Reusable card component
  avatar.tsx                   — Avatar component
  search-bar.tsx               — Search input
hooks/
  use-api.ts                   — Data fetching hook
  use-stored-state.ts          — Persistent state hook
utils/
  helpers.ts                   — Utility functions
constants/
  colors.ts                    — Color palette
  index.ts                     — App constants
types/
  index.ts                     — TypeScript types
\`\`\`

### Route Rules
- Routes belong in the \`app/\` directory only
- Never co-locate components/utils in the app directory
- Use layout groups \`(groupName)/\` to organize related routes
- Dynamic routes use \`[param].tsx\` syntax
- Catch-all routes use \`[...param].tsx\`
- \`_layout.tsx\` defines navigation structure (Stack, Tabs)
- Always have a route that matches "/" (usually \`app/(tabs)/index.tsx\`)
- Use \`+not-found.tsx\` for 404 handling`;

export const NAVIGATION_HOOKS = `## Navigation Hooks & Patterns

### expo-router Hooks
\`\`\`tsx
import { useRouter, useLocalSearchParams, usePathname, useSegments } from 'expo-router';

// Navigate programmatically
const router = useRouter();
router.push('/details/123');        // Push new screen
router.replace('/login');           // Replace current screen
router.back();                      // Go back
router.dismissAll();                // Dismiss all modals

// Read URL params
const { id } = useLocalSearchParams<{ id: string }>();

// Get current path
const pathname = usePathname();  // e.g. '/details/123'
\`\`\`

### Tab + Detail Navigation Pattern
\`\`\`tsx
// app/_layout.tsx
import { Stack } from 'expo-router/stack';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="details/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#fff',
          title: 'Details',
        }}
      />
    </Stack>
  );
}
\`\`\`

### Deep Linking
expo-router automatically generates deep links from your file structure:
- \`app/(tabs)/index.tsx\` → \`/\`
- \`app/(tabs)/profile.tsx\` → \`/profile\`
- \`app/details/[id].tsx\` → \`/details/123\`
- \`app/modal.tsx\` → \`/modal\``;
