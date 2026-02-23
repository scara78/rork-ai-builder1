import { createClient } from '@/lib/supabase/server';

const META_PATH = "project.meta.json";

const APP_TSX = `import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
      <Text style={styles.text}>Waiting for AI to generate your app...</Text>
      <Text style={styles.subtext}>Describe what you want in the chat panel</Text>
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
  spinner: {
    marginBottom: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
  },
});
`;

const PACKAGE_JSON = {
  "name": "rork-app",
  "main": "App.tsx",
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.0",
    "expo": "~52.0.0"
  }
};

export async function ensureScaffold(projectId: string, accessToken?: string) {
  const supabase = await createClient();
  
  // Check if project has files
  const { data: files, error } = await supabase
    .from('project_files')
    .select('path')
    .eq('project_id', projectId);

  if (error) {
    console.error('[Scaffold] Error fetching files:', error);
    return;
  }

  const filePaths = files?.map(f => f.path) || [];
  
  if (filePaths.length === 0) {
    console.log('[Scaffold] Creating baseline files for empty project');
    
    // Insert App.tsx
    await supabase.from('project_files').insert({
      project_id: projectId,
      path: 'App.tsx',
      content: APP_TSX,
      language: 'typescript'
    });

    // Insert package.json
    await supabase.from('project_files').insert({
      project_id: projectId,
      path: 'package.json',
      content: JSON.stringify(PACKAGE_JSON, null, 2),
      language: 'json'
    });

    console.log('[Scaffold] ✅ Created baseline files');
  } else if (!filePaths.includes('App.tsx') && !filePaths.includes('App.js')) {
    // Has some files but no entry point
    console.log('[Scaffold] Creating missing App.tsx');
    await supabase.from('project_files').insert({
      project_id: projectId,
      path: 'App.tsx',
      content: APP_TSX,
      language: 'typescript'
    });
  }
}
