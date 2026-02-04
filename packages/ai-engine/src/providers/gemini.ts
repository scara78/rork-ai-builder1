import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  AIProvider, 
  GenerateParams, 
  GenerateResult, 
  StreamChunk,
  ConversationMessage 
} from '../types';
import { parseGeneratedFiles } from '../parser';
import { FULL_SYSTEM_PROMPT } from '../prompts';

// Gemini 3 Pro - Latest and most intelligent model
const GEMINI_MODEL = 'gemini-3-pro-preview';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  displayName = 'Gemini 3 Pro';
  
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
      maxTokens = 65536,
    } = params;
    
    // Build the full system prompt with Expo SDK 54+ knowledge
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    const model = this.client.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 1.0, // Gemini 3 recommends keeping at 1.0
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
    
    // Get usage metadata if available
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || Math.ceil(userContent.length / 4);
    const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
    
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
      maxTokens = 65536,
    } = params;
    
    // Build the full system prompt with Expo SDK 54+ knowledge
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    const model = this.client.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 1.0, // Gemini 3 recommends keeping at 1.0
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
      
      // Get final response for usage
      const finalResponse = await result.response;
      const usageMetadata = finalResponse.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || Math.ceil(userContent.length / 4);
      const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(fullText.length / 4);
      
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
