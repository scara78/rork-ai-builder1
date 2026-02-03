/**
 * Expo App Scaffolds - Pre-built templates for common app patterns
 * These are used by the agent as references when building apps
 */

export interface AppScaffold {
  name: string;
  description: string;
  files: Record<string, string>;
}

/**
 * Base app layout with NativeTabs
 */
export const BASE_TAB_LAYOUT = `import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search" />
    </NativeTabs>
  );
}`;

/**
 * Base stack layout
 */
export const BASE_STACK_LAYOUT = `import { Stack } from 'expo-router/stack';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
    </Stack>
  );
}`;

/**
 * Base screen with ScrollView
 */
export const BASE_SCREEN = `import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Screen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  return (
    <ScrollView 
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
          Hello World
        </Text>
      </View>
    </ScrollView>
  );
}`;

/**
 * Card component template
 */
export const CARD_COMPONENT = `import { View, Text, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';

interface CardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function Card({ title, subtitle, onPress }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#222' : '#1a1a1a',
        borderRadius: 16,
        borderCurve: 'continuous',
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      })}
    >
      <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}`;

/**
 * Button component template
 */
export const BUTTON_COMPONENT = `import { Pressable, Text, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const handlePress = async () => {
    if (process.env.EXPO_OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  const bgColor = {
    primary: '#fff',
    secondary: '#333',
    destructive: '#ef4444',
  }[variant];
  
  const textColor = {
    primary: '#000',
    secondary: '#fff',
    destructive: '#fff',
  }[variant];
  
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#ccc' : bgColor,
        opacity: disabled ? 0.5 : 1,
        borderRadius: 12,
        borderCurve: 'continuous',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
      })}
    >
      {loading && <ActivityIndicator color={textColor} />}
      <Text style={{ 
        fontSize: 17, 
        fontWeight: '600', 
        color: textColor,
      }}>
        {title}
      </Text>
    </Pressable>
  );
}`;

/**
 * Empty state component template
 */
export const EMPTY_STATE_COMPONENT = `import { View, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { PlatformColor } from 'react-native';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 32,
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <SymbolView 
          name={icon} 
          tintColor={PlatformColor('secondaryLabel')} 
          size={36} 
        />
      </View>
      <Text style={{ 
        fontSize: 20, 
        fontWeight: '600', 
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        {title}
      </Text>
      <Text style={{ 
        fontSize: 15, 
        color: '#888',
        textAlign: 'center',
        maxWidth: 280,
      }}>
        {message}
      </Text>
    </View>
  );
}`;

/**
 * List item component template
 */
export const LIST_ITEM_COMPONENT = `import { View, Text, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { PlatformColor } from 'react-native';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}

export function ListItem({ 
  title, 
  subtitle, 
  icon, 
  trailing,
  onPress 
}: ListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: pressed ? '#1a1a1a' : 'transparent',
        gap: 12,
      })}
    >
      {icon && (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: '#1a1a1a',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <SymbolView 
            name={icon} 
            tintColor={PlatformColor('label')} 
            size={20} 
          />
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, color: '#fff' }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 14, color: '#888', marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {trailing || (
        onPress && (
          <SymbolView 
            name="chevron.right" 
            tintColor={PlatformColor('tertiaryLabel')} 
            size={16} 
          />
        )
      )}
    </Pressable>
  );
}`;

/**
 * Input component template
 */
export const INPUT_COMPONENT = `import { View, TextInput, Text } from 'react-native';
import { useState } from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  error,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#888' }}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 12,
          borderCurve: 'continuous',
          padding: 16,
          fontSize: 17,
          color: '#fff',
          borderWidth: 1,
          borderColor: error ? '#ef4444' : isFocused ? '#fff' : '#333',
        }}
      />
      {error && (
        <Text style={{ fontSize: 13, color: '#ef4444' }}>
          {error}
        </Text>
      )}
    </View>
  );
}`;

/**
 * Colors constants template
 */
export const COLORS_CONSTANTS = `export const colors = {
  // Backgrounds
  background: '#000',
  surface: '#1a1a1a',
  surfaceHover: '#222',
  
  // Text
  text: '#fff',
  textSecondary: '#888',
  textTertiary: '#555',
  
  // Accent
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Border
  border: '#333',
  borderFocus: '#fff',
};

export type ColorName = keyof typeof colors;`;

/**
 * Todo App scaffold
 */
export const TODO_APP_SCAFFOLD: AppScaffold = {
  name: 'Todo App',
  description: 'A simple todo app with NativeTabs',
  files: {
    'app/_layout.tsx': BASE_TAB_LAYOUT,
    'components/button.tsx': BUTTON_COMPONENT,
    'components/card.tsx': CARD_COMPONENT,
    'components/empty-state.tsx': EMPTY_STATE_COMPONENT,
    'components/input.tsx': INPUT_COMPONENT,
    'constants/colors.ts': COLORS_CONSTANTS,
  },
};

/**
 * Get scaffold by app type
 */
export function getScaffold(appType: string): AppScaffold | null {
  const scaffolds: Record<string, AppScaffold> = {
    todo: TODO_APP_SCAFFOLD,
  };
  
  return scaffolds[appType.toLowerCase()] || null;
}

/**
 * Get component template by name
 */
export function getComponentTemplate(name: string): string | null {
  const templates: Record<string, string> = {
    button: BUTTON_COMPONENT,
    card: CARD_COMPONENT,
    'empty-state': EMPTY_STATE_COMPONENT,
    'list-item': LIST_ITEM_COMPONENT,
    input: INPUT_COMPONENT,
  };
  
  return templates[name.toLowerCase()] || null;
}
