'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FileTree } from '@/components/editor/FileTree';
import { CodePanel } from '@/components/editor/CodePanel';
import { ChatPanel } from '@/components/editor/ChatPanel';
import { Toolbar } from '@/components/editor/Toolbar';
import { CommandPalette } from '@/components/editor/CommandPalette';
import { useSnack } from '@/hooks/useSnack';

const PreviewPanel = dynamic(
  () => import('@/components/editor/PreviewPanel').then(mod => mod.PreviewPanel),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-gray-500">Loading preview...</div> }
);
import { useProjectStore, type EditorFile } from '@/stores/projectStore';
import { useToast } from '@/components/ui/Toast';

// Demo template files
const DEMO_FILES: Record<string, EditorFile> = {
  'app/_layout.tsx': {
    path: 'app/_layout.tsx',
    content: `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
    </>
  );
}
`,
    language: 'typescript',
  },
  'app/(tabs)/_layout.tsx': {
    path: 'app/(tabs)/_layout.tsx',
    content: `import { Tabs } from 'expo-router';
import { Home, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#222' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
`,
    language: 'typescript',
  },
  'app/(tabs)/index.tsx': {
    path: 'app/(tabs)/index.tsx',
    content: `import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          Describe what you want to build in the chat
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
`,
    language: 'typescript',
  },
  'app/(tabs)/explore.tsx': {
    path: 'app/(tabs)/explore.tsx',
    content: `import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Explore</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
`,
    language: 'typescript',
  },
  'app/(tabs)/profile.tsx': {
    path: 'app/(tabs)/profile.tsx',
    content: `import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});
`,
    language: 'typescript',
  },
};

export default function DemoPage() {
  const [loading] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const { setProject } = useProjectStore();
  const { showToast } = useToast();

  // Snack SDK for demo preview
  const {
    webPreviewRef,
    webPreviewURL,
    expoURL: snackExpoURL,
    connectedClients: snackConnectedClients,
    isOnline: snackIsOnline,
    isBusy: snackIsBusy,
    error: snackError,
    setAllFiles: snackSetAllFiles,
  } = useSnack();

  // Initialize demo project
  useEffect(() => {
    setProject('demo', 'Demo App', DEMO_FILES);
    // Push demo files to Snack
    snackSetAllFiles(DEMO_FILES as Record<string, { path: string; content: string }>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setProject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mock save (just show toast)
  const handleSave = useCallback(() => {
    showToast('Demo mode - files saved locally', 'success');
  }, [showToast]);

  // Mock export
  const handleExport = useCallback(() => {
    showToast('Demo mode - export not available', 'info');
  }, [showToast]);

  // Save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center text-sm py-2">
        Demo Mode - Chat with AI to generate code (requires API key in .env.local)
      </div>
      
      {/* Toolbar */}
      <Toolbar projectId="demo" onSave={handleSave} onExport={handleExport} />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <div className="w-56 border-r border-border flex-shrink-0">
          <FileTree />
        </div>
        
        {/* Center - Code Editor */}
        <div className="flex-1 min-w-0 border-r border-border">
          <CodePanel projectId="demo" />
        </div>
        
        {/* Right Side - Preview & Chat */}
        <div className="w-[500px] flex flex-col flex-shrink-0">
          {/* Preview */}
          <div className="flex-1 border-b border-border min-h-0">
            <PreviewPanel
              projectId="demo"
              webPreviewRef={webPreviewRef}
              webPreviewURL={webPreviewURL}
              expoURL={snackExpoURL}
              isOnline={snackIsOnline}
              isBusy={snackIsBusy}
              connectedClients={snackConnectedClients}
              snackError={snackError}
              hasRequestedOnline={true}
            />
          </div>
          
          {/* Chat */}
          <div className="h-[300px] flex-shrink-0">
            <DemoChatPanel projectId="demo" />
          </div>
        </div>
      </div>
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projectId="demo"
        onSave={handleSave}
        onExport={handleExport}
      />
    </div>
  );
}

// Demo Chat Panel that doesn't require auth
function DemoChatPanel({ projectId }: { projectId: string }) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  
  const { files, applyGeneratedFiles } = useProjectStore();
  const { showToast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    const prompt = input.trim();
    setInput('');
    setIsGenerating(true);
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    try {
      // Build current files context
      const currentFiles: Record<string, string> = {};
      Object.values(files).forEach(f => {
        currentFiles[f.path] = f.content;
      });
      
      // Call the demo generate endpoint
      const response = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentFiles,
          conversationHistory: messages.slice(-6),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let fullContent = '';
      const generatedFiles: Array<{ path: string; content: string; language: string }> = [];
      
      // Add assistant placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // Keep incomplete last line for next chunk
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'text') {
                  fullContent += data.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = fullContent;
                    return newMessages;
                  });
                } else if (data.type === 'file' && data.file) {
                  generatedFiles.push(data.file);
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected end of JSON input' && !e.message.startsWith('Unexpected token')) {
                  throw e; // Re-throw non-parse errors (like the data.error case above)
                }
                console.warn('SSE parse error (demo):', e);
              }
            }
          }
        }
      }
      
      // Apply generated files
      if (generatedFiles.length > 0) {
        applyGeneratedFiles(generatedFiles);
        showToast(`Generated ${generatedFiles.length} file(s)`, 'success');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="font-medium">Start building your app</p>
              <p className="text-sm mt-1">Try: &quot;Add a todo list to the home screen&quot;</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-[#27272a] text-gray-200 px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%]">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                    <span className="font-bold text-gray-100 text-sm">Rork</span>
                  </div>
                  <div className="pl-4 text-gray-300 text-[13px] whitespace-pre-wrap">
                    {msg.content || (isGenerating && index === messages.length - 1 ? 'Generating...' : '')}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-[#27272a]">
        <div className="relative bg-[#18181b] rounded-xl border border-[#27272a] p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe what you want to build..."
            className="w-full bg-transparent outline-none text-[13px] text-gray-200 resize-none h-10 placeholder-gray-500"
            disabled={isGenerating}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={isGenerating || !input.trim()}
              className={`p-1.5 rounded-md transition-all ${
                input.trim() && !isGenerating
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'text-gray-600'
              }`}
            >
              {isGenerating ? '...' : '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
