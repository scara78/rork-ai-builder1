import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import type { 
  AIProvider, 
  GenerateParams, 
  GenerateResult, 
  StreamChunk,
  ConversationMessage 
} from '../types';
import { getLanguageFromPath } from '../tools';
import { FULL_SYSTEM_PROMPT } from '../prompts';

const GEMINI_MODEL = 'gemini-3-pro-preview';

// Tool declaration for Gemini function calling
const WRITE_FILE_TOOL: FunctionDeclaration = {
  name: 'write_file',
  description: 'Write or create a file in the project. Always provide COMPLETE file content with all imports and exports. Call this tool for EVERY file you want to create or modify.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      path: {
        type: SchemaType.STRING,
        description: 'File path relative to project root (e.g., app/_layout.tsx, components/Button.tsx)',
      },
      content: {
        type: SchemaType.STRING,
        description: 'Complete file content including all imports and exports',
      },
    },
    required: ['path', 'content'],
  },
};

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
    
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    const model = this.client.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 1.0,
      },
      tools: [{ functionDeclarations: [WRITE_FILE_TOOL] }],
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
    const files: Array<{ path: string; content: string; language: string }> = [];
    let inputTokens = 0;
    let outputTokens = 0;
    
    // Multi-turn: AI responds with text + function calls, we send results back, AI continues
    let result = await chat.sendMessage(userContent);
    let response = result.response;
    
    for (let round = 0; round < 20; round++) {
      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) break;
      
      const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
      
      for (const part of candidate.content.parts) {
        if ('text' in part && part.text) {
          fullText += part.text;
        }
        if ('functionCall' in part && part.functionCall) {
          const fc = part.functionCall;
          functionCalls.push({ name: fc.name, args: fc.args as Record<string, unknown> });
          if (fc.name === 'write_file') {
            const args = fc.args as { path: string; content: string };
            if (args.path && args.content) {
              files.push({
                path: args.path.trim(),
                content: args.content,
                language: getLanguageFromPath(args.path),
              });
            }
          }
        }
      }
      
      if (functionCalls.length === 0) break;
      
      const functionResponses = functionCalls.map(fc => ({
        functionResponse: {
          name: fc.name,
          response: { success: true },
        },
      }));
      
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }
    
    const usageMetadata = response.usageMetadata;
    inputTokens = usageMetadata?.promptTokenCount || Math.ceil(userContent.length / 4);
    outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(fullText.length / 4);
    
    return {
      text: fullText,
      files,
      usage: { inputTokens, outputTokens },
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
    
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    const model = this.client.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: fullSystemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 1.0,
      },
      tools: [{ functionDeclarations: [WRITE_FILE_TOOL] }],
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
      // Multi-turn streaming: stream -> collect function calls -> send results -> repeat
      let streamResult = await chat.sendMessageStream(userContent);
      
      for (let round = 0; round < 20; round++) {
        const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
        
        for await (const chunk of streamResult.stream) {
          for (const part of chunk.candidates?.[0]?.content?.parts || []) {
            if ('text' in part && part.text) {
              fullText += part.text;
              yield { type: 'text', content: part.text };
            }
            if ('functionCall' in part && part.functionCall) {
              const fc = part.functionCall;
              functionCalls.push({ name: fc.name, args: fc.args as Record<string, unknown> });
              
              if (fc.name === 'write_file') {
                const args = fc.args as { path: string; content: string };
                if (args.path && args.content) {
                  yield {
                    type: 'file',
                    file: {
                      path: args.path.trim(),
                      content: args.content,
                      language: getLanguageFromPath(args.path),
                    },
                  };
                }
              }
            }
          }
        }
        
        if (functionCalls.length === 0) break;
        
        const functionResponses = functionCalls.map(fc => ({
          functionResponse: {
            name: fc.name,
            response: { success: true },
          },
        }));
        
        streamResult = await chat.sendMessageStream(functionResponses);
      }
      
      const finalResponse = await streamResult.response;
      const usageMetadata = finalResponse.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || Math.ceil(userContent.length / 4);
      const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(fullText.length / 4);
      
      yield { type: 'done', usage: { inputTokens, outputTokens } };
    } catch (error) {
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
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
