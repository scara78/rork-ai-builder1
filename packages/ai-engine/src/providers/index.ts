import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';
import type { AIProvider } from '../types';

export type AIProviderType = 'claude' | 'gemini';

export function createAIProvider(
  type: AIProviderType,
  apiKey: string
): AIProvider {
  switch (type) {
    case 'claude':
      return new ClaudeProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider type: ${type}`);
  }
}

export { ClaudeProvider } from './claude';
export { GeminiProvider } from './gemini';
