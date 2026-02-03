// Database types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  expo_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  files_changed: string[] | null;
  tokens_used: number | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  preferred_model: 'claude' | 'gemini';
  github_token: string | null;
  expo_token: string | null;
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
}

// AI types
export interface AIProvider {
  name: string;
  displayName: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  maxTokens: number;
}

export interface GenerateRequest {
  prompt: string;
  projectId: string;
  model: 'claude' | 'gemini';
  currentFiles: Record<string, string>;
  conversationHistory?: ChatMessage[];
}

export interface GenerateResponse {
  message: string;
  files: ParsedFile[];
  usage: TokenUsage;
}

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

// Editor types
export interface EditorFile {
  path: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

export interface EditorState {
  projectId: string | null;
  projectName: string;
  files: Record<string, EditorFile>;
  activeFile: string | null;
  messages: UIMessage[];
  isGenerating: boolean;
  selectedModel: 'claude' | 'gemini';
}

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filesChanged?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

// Preview types
export interface PreviewConfig {
  projectId: string;
  webUrl?: string;
  expoUrl?: string;
  status: 'idle' | 'starting' | 'running' | 'error';
  error?: string;
}
