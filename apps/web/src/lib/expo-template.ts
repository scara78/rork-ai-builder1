export function getDefaultExpoFiles(projectName: string): Record<string, string> {
  return {
    'App.tsx': `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ${projectName}</Text>
      <Text style={styles.subtitle}>
        Describe your idea in the chat and Rork will build it for you.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
});
`,
    'package.json': JSON.stringify({
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      dependencies: {
        'react': '18.3.1',
        'react-dom': '18.3.1',
        'react-native': '0.78.0',
        'react-native-web': '~0.19.13',
        '@expo/vector-icons': '^14.0.2',
      },
    }, null, 2),
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        strict: true,
        esModuleInterop: true,
        jsx: "react-jsx",
        lib: ["dom", "esnext"],
        moduleResolution: "node",
        target: "esnext"
      },
    }, null, 2),
  };
}
