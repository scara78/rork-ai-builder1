import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getLanguageFromPath } from '@/lib/language';

export interface EditorFile {
  path: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filesChanged?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface RuntimeError {
  id: string;
  message: string;
  details?: string;
  timestamp: Date;
}

interface ProjectState {
  // State
  projectId: string | null;
  projectName: string;
  files: Record<string, EditorFile>;
  activeFile: string | null;
  messages: UIMessage[];
  isGenerating: boolean;
  selectedModel: 'claude' | 'gemini';
  streamingContent: string;
  generatingFiles: string[]; // File paths being generated in real-time
  runtimeErrors: RuntimeError[];
  
  // Actions
  setProject: (id: string, name: string, files: Record<string, EditorFile>, messages?: UIMessage[]) => void;
  setFiles: (files: Record<string, EditorFile>) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  createFile: (path: string, content: string, language?: string) => void;
  setActiveFile: (path: string | null) => void;
  addMessage: (message: Omit<UIMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string, filesChanged?: string[]) => void;
  setMessages: (messages: UIMessage[]) => void;
  setGenerating: (value: boolean) => void;
  setSelectedModel: (model: 'claude' | 'gemini') => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  addGeneratingFile: (file: { path: string; content: string; language?: string }) => void;
  applyGeneratedFiles: (files: Array<{ path: string; content: string; language?: string }>) => void;
  addRuntimeError: (message: string, details?: string) => void;
  clearRuntimeErrors: () => void;
  reset: () => void;
}

const initialState = {
  projectId: null,
  projectName: '',
  files: {},
  activeFile: null,
  messages: [],
  isGenerating: false,
  selectedModel: 'gemini' as const,
  streamingContent: '',
  generatingFiles: [] as string[],
  runtimeErrors: [] as RuntimeError[],
};

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    ...initialState,
    
    setProject: (id, name, files, messages) => set((state) => {
      state.projectId = id;
      state.projectName = name;
      state.files = files;
      state.activeFile = Object.keys(files)[0] || null;
      state.messages = messages || [];
    }),
    
    setFiles: (files) => set((state) => {
      state.files = files;
    }),
    
    updateFile: (path, content) => set((state) => {
      if (state.files[path]) {
        state.files[path].content = content;
        state.files[path].isDirty = true;
      }
    }),
    
    deleteFile: (path) => set((state) => {
      delete state.files[path];
      if (state.activeFile === path) {
        state.activeFile = Object.keys(state.files)[0] || null;
      }
    }),
    
    createFile: (path, content, language) => set((state) => {
      state.files[path] = {
        path,
        content,
        language: language || getLanguageFromPath(path),
        isDirty: true,
      };
    }),
    
    setActiveFile: (path) => set((state) => {
      state.activeFile = path;
    }),
    
    addMessage: (message) => set((state) => {
      state.messages.push({
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      });
    }),
    
    updateLastMessage: (content, filesChanged) => set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = content;
        lastMessage.isStreaming = false;
        if (filesChanged && filesChanged.length > 0) {
          lastMessage.filesChanged = filesChanged;
        }
      }
    }),
    
    setMessages: (messages) => set((state) => {
      state.messages = messages;
    }),
    
    setGenerating: (value) => set((state) => {
      state.isGenerating = value;
      if (!value) {
        state.streamingContent = '';
        state.generatingFiles = [];
      } else {
        state.generatingFiles = [];
      }
    }),
    
    setSelectedModel: (model) => set((state) => {
      state.selectedModel = model;
    }),
    
    setStreamingContent: (content) => set((state) => {
      state.streamingContent = content;
    }),
    
    appendStreamingContent: (content) => set((state) => {
      state.streamingContent += content;
    }),
    
    addGeneratingFile: (file) => set((state) => {
      // Apply file immediately to the store AND track it
      state.files[file.path] = {
        path: file.path,
        content: file.content,
        language: file.language || getLanguageFromPath(file.path),
        isDirty: false,
      };
      if (!state.generatingFiles.includes(file.path)) {
        state.generatingFiles.push(file.path);
      }
    }),
    
    applyGeneratedFiles: (files) => set((state) => {
      for (const file of files) {
        state.files[file.path] = {
          path: file.path,
          content: file.content,
          language: file.language || getLanguageFromPath(file.path),
          isDirty: false,
        };
      }
    }),
    
    addRuntimeError: (message, details) => set((state) => {
      state.runtimeErrors.push({
        id: crypto.randomUUID(),
        message,
        details,
        timestamp: new Date(),
      });
    }),
    
    clearRuntimeErrors: () => set((state) => {
      state.runtimeErrors = [];
    }),
    
    reset: () => set(initialState),
  }))
);
