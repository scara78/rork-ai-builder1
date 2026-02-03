import { GoogleGenerativeAI, type GenerateContentStreamResult } from '@google/generative-ai';
import type { 
  AIProvider, 
  GenerateParams, 
  GenerateResult, 
  StreamChunk,
  ConversationMessage 
} from '../types';
import { parseGeneratedFiles } from '../parser';
import { FULL_SYSTEM_PROMPT } from '../prompts';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  displayName = 'Gemini';
  
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async generateCode(params: GenerateParams): Promise<GenerateResult> {
    const {
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory = [],
      maxTokens = 8192,
    } = params;
    
    // Build the full system prompt with Expo SDK 54+ knowledge
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    });
    
    // Build content with file context
    let userContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      userContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }
    
    // Build chat history
    const chat = model.startChat({
      history: this.formatHistory(conversationHistory),
    });
    
    const result = await chat.sendMessage(userContent);
    const response = result.response;
    const text = response.text();
    
    // Parse generated files
    const files = parseGeneratedFiles(text);
    
    // Gemini doesn't provide exact token counts, estimate
    const inputTokens = Math.ceil(userContent.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    
    return {
      text,
      files,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  }
  
  async *streamCode(params: GenerateParams): AsyncGenerator<StreamChunk> {
    const {
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory = [],
      maxTokens = 8192,
    } = params;
    
    // Build the full system prompt with Expo SDK 54+ knowledge
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    });
    
    let userContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      userContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }
    
    const chat = model.startChat({
      history: this.formatHistory(conversationHistory),
    });
    
    let fullText = '';
    
    try {
      const result = await chat.sendMessageStream(userContent);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          yield { type: 'text', content: text };
        }
      }
      
      // Parse files after streaming is complete
      const files = parseGeneratedFiles(fullText);
      for (const file of files) {
        yield { type: 'file', file };
      }
      
      const inputTokens = Math.ceil(userContent.length / 4);
      const outputTokens = Math.ceil(fullText.length / 4);
      
      yield { 
        type: 'done', 
        usage: { inputTokens, outputTokens } 
      };
    } catch (error) {
      yield { 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private formatHistory(history: ConversationMessage[]): Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> {
    return history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }
}
