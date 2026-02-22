/**
 * Navigation Patterns for Sandpack/Vite + React Native Web
 * Uses state-based routing (NO expo-router — Vite can't do file-system routing)
 */

export const NATIVE_TABS = `## Tab Navigation (State-Based)

Since this app runs in a Vite + React Native Web environment (NOT Expo Go), we use
state-based navigation instead of expo-router. Build a simple tab navigator from scratch.

### Tab Navigator Component
\`\`\`tsx
// components/TabNavigator.tsx
import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Tab {
  key: string;
  title: string;
  icon: string;
  iconOutline: string;
  component: React.ComponentType;
}

interface TabNavigatorProps {
  tabs: Tab[];
  initialTab?: string;
}

export default function TabNavigator({ tabs, initialTab }: TabNavigatorProps) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.key || '');

  const ActiveScreen = tabs.find(t => t.key === activeTab)?.component;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {ActiveScreen && <ActiveScreen />}
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={(isActive ? tab.icon : tab.iconOutline) as any}
                size={24}
                color={isActive ? '#007AFF' : '#8e8e93'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#38383a',
    paddingBottom: 20, // safe area
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#8e8e93',
  },
  tabLabelActive: {
    color: '#007AFF',
  },
});
\`\`\`

### Using the Tab Navigator in App.tsx
\`\`\`tsx
// App.tsx
import React from 'react';
import TabNavigator from './components/TabNavigator';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import ProfileScreen from './screens/ProfileScreen';

const tabs = [
  { key: 'home', title: 'Home', icon: 'home', iconOutline: 'home-outline', component: HomeScreen },
  { key: 'explore', title: 'Explore', icon: 'compass', iconOutline: 'compass-outline', component: ExploreScreen },
  { key: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline', component: ProfileScreen },
];

export default function App() {
  return <TabNavigator tabs={tabs} />;
}
\`\`\`

### Common Ionicons Names
**Navigation:** home, home-outline, compass, compass-outline, search, search-outline
**Social:** heart, heart-outline, person, person-outline, people, chatbubble
**Media:** camera, image, play, musical-notes, mic
**Actions:** add, add-circle, close, checkmark, trash, pencil, share
**Status:** notifications, settings, star, bookmark, flag
**Misc:** cart, calendar, map, location, time, globe`;

export const LINK_PATTERNS = `## Screen Navigation (State-Based)

### Simple Navigation with State
\`\`\`tsx
// components/Navigator.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigatorContextType {
  currentScreen: string;
  params: Record<string, string>;
  navigate: (screen: string, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigatorContext = createContext<NavigatorContextType | undefined>(undefined);

export function useNavigator() {
  const ctx = useContext(NavigatorContext);
  if (!ctx) throw new Error('useNavigator must be used within NavigatorProvider');
  return ctx;
}

interface NavigatorProviderProps {
  initialScreen: string;
  children: ReactNode;
}

export function NavigatorProvider({ initialScreen, children }: NavigatorProviderProps) {
  const [history, setHistory] = useState<Array<{ screen: string; params: Record<string, string> }>>([
    { screen: initialScreen, params: {} },
  ]);

  const current = history[history.length - 1];

  const navigate = useCallback((screen: string, params: Record<string, string> = {}) => {
    setHistory(prev => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  return (
    <NavigatorContext.Provider value={{
      currentScreen: current.screen,
      params: current.params,
      navigate,
      goBack,
      canGoBack: history.length > 1,
    }}>
      {children}
    </NavigatorContext.Provider>
  );
}
\`\`\`

### Rendering Screens
\`\`\`tsx
// App.tsx
import { NavigatorProvider, useNavigator } from './components/Navigator';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';

function ScreenRouter() {
  const { currentScreen } = useNavigator();
  
  switch (currentScreen) {
    case 'home': return <HomeScreen />;
    case 'details': return <DetailsScreen />;
    default: return <HomeScreen />;
  }
}

export default function App() {
  return (
    <NavigatorProvider initialScreen="home">
      <ScreenRouter />
    </NavigatorProvider>
  );
}
\`\`\`

### Navigating Between Screens
\`\`\`tsx
import { useNavigator } from '../components/Navigator';

function HomeScreen() {
  const { navigate } = useNavigator();
  
  return (
    <Pressable onPress={() => navigate('details', { id: '123' })}>
      <Text>View Details</Text>
    </Pressable>
  );
}

function DetailsScreen() {
  const { params, goBack, canGoBack } = useNavigator();
  
  return (
    <View>
      {canGoBack && (
        <Pressable onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
      )}
      <Text>Detail ID: {params.id}</Text>
    </View>
  );
}
\`\`\``;

export const STACK_NAVIGATION = `## Stack-Style Navigation Headers

### Custom Header Component
\`\`\`tsx
// components/ScreenHeader.tsx
import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function ScreenHeader({ title, onBack, showBack, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack && onBack && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </Pressable>
        )}
      </View>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.headerRight}>
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#38383a',
  },
  headerLeft: { width: 60, alignItems: 'flex-start' },
  headerRight: { width: 60, alignItems: 'flex-end' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  backButton: { padding: 4 },
});
\`\`\`

### Using ScreenHeader in a Screen
\`\`\`tsx
import ScreenHeader from '../components/ScreenHeader';
import { useNavigator } from '../components/Navigator';

export default function DetailsScreen() {
  const { goBack, canGoBack, params } = useNavigator();
  
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScreenHeader 
        title="Details" 
        showBack={canGoBack}
        onBack={goBack}
        rightAction={
          <Pressable onPress={handleEdit}>
            <Ionicons name="pencil" size={22} color="#007AFF" />
          </Pressable>
        }
      />
      <ScrollView style={{ flex: 1 }}>
        {/* Screen content */}
      </ScrollView>
    </View>
  );
}
\`\`\``;

export const MODALS_AND_SHEETS = `## Modals (Custom)

### Modal Component
\`\`\`tsx
// components/Modal.tsx
import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  transparent?: boolean;
}

export default function Modal({ visible, onClose, children, transparent }: ModalProps) {
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <View style={[styles.content, transparent && styles.transparentContent]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  transparentContent: {
    backgroundColor: 'transparent',
  },
});
\`\`\`

### Using Modals
\`\`\`tsx
const [showModal, setShowModal] = useState(false);

<Modal visible={showModal} onClose={() => setShowModal(false)}>
  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Create New</Text>
  {/* Modal content */}
  <Pressable onPress={() => setShowModal(false)}>
    <Text style={{ color: '#007AFF' }}>Cancel</Text>
  </Pressable>
</Modal>
\`\`\``;

export const ROUTE_STRUCTURE = `## Project Structure for State-Based Routing

### Standard App with Tabs
\`\`\`
App.tsx                 — Root entry point, renders TabNavigator or NavigatorProvider
components/
  TabNavigator.tsx      — Tab bar component
  Navigator.tsx         — State-based navigation context
  ScreenHeader.tsx      — Header with back button
  Modal.tsx             — Custom modal
screens/
  HomeScreen.tsx        — Home tab screen
  ExploreScreen.tsx     — Explore tab screen
  ProfileScreen.tsx     — Profile tab screen
  DetailsScreen.tsx     — Detail screen (navigated from any tab)
hooks/
  useApi.ts             — Data fetching hook
utils/
  helpers.ts            — Utility functions
constants/
  colors.ts             — Color palette
  index.ts              — App constants
types/
  index.ts              — TypeScript types
\`\`\`

### IMPORTANT: NO expo-router
- Do NOT use \`expo-router\`, \`Stack\`, \`Tabs\`, \`Link\` from expo-router
- Do NOT create an \`app/\` directory with file-based routing
- Put screens in \`screens/\` directory, components in \`components/\`
- Use the state-based navigation pattern shown above
- Always have an \`App.tsx\` as the entry point`;

export const NAVIGATION_HOOKS = `## Navigation Patterns

### useNavigator Hook (from components/Navigator.tsx)
\`\`\`tsx
import { useNavigator } from '../components/Navigator';

const { currentScreen, params, navigate, goBack, canGoBack } = useNavigator();

navigate('details', { id: '123' });   // Navigate to screen with params
goBack();                               // Go back to previous screen
canGoBack;                              // Boolean: true if history has previous entries
params.id;                              // Access route params
currentScreen;                          // Current screen name
\`\`\`

### Tabs + Detail Navigation Pattern
\`\`\`tsx
// App.tsx — Combined tabs + detail navigation
import React, { useState } from 'react';
import { NavigatorProvider, useNavigator } from './components/Navigator';
import TabNavigator from './components/TabNavigator';
import DetailsScreen from './screens/DetailsScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import ProfileScreen from './screens/ProfileScreen';

function MainApp() {
  const { currentScreen } = useNavigator();

  // If we're on a detail screen, show it (pushed on top of tabs)
  if (currentScreen === 'details') {
    return <DetailsScreen />;
  }

  // Otherwise show tabs
  const tabs = [
    { key: 'home', title: 'Home', icon: 'home', iconOutline: 'home-outline', component: HomeScreen },
    { key: 'explore', title: 'Explore', icon: 'compass', iconOutline: 'compass-outline', component: ExploreScreen },
    { key: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline', component: ProfileScreen },
  ];

  return <TabNavigator tabs={tabs} />;
}

export default function App() {
  return (
    <NavigatorProvider initialScreen="home">
      <MainApp />
    </NavigatorProvider>
  );
}
\`\`\``;
