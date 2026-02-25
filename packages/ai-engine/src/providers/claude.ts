import type { 
  AIProvider, 
  GenerateParams, 
  GenerateResult, 
  StreamChunk,
  ConversationMessage,
  ImageAttachment,
} from '../types';
import { getLanguageFromPath } from '../tools';
import { FULL_SYSTEM_PROMPT } from '../prompts';

const WRITE_FILE_TOOL = {
  type: 'function',
  function: {
    name: 'write_file',
    description: 'Write or create a file in the project. Always provide COMPLETE file content.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Complete file content' },
      },
      required: ['path', 'content'],
    },
  },
};

export class ClaudeProvider implements AIProvider {
  name = 'openrouter';
  displayName = 'OpenRouter (Multi-Model)';
  
  private apiKey: string;
  private defaultModel: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Prioritizează modelul din ENV, altfel fallback pe Gemini 2.0 Flash
    this.defaultModel = process.env.AI_MODEL || 'google/gemini-2.0-flash-001';
  }
  
  async generateCode(params: GenerateParams): Promise<GenerateResult> {
    const {
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory = [],
      maxTokens = 16384,
      images = [],
      // Permite suprascrierea modelului per apel dacă este trimis în params
      model = this.defaultModel, 
    } = params;
    
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    let messages = this.buildMessages(prompt, conversationHistory, currentFiles, images);
    
    let fullText = '';
    const files: Array<{ path: string; content: string; language: string }> = [];
    let inputTokens = 0;
    let outputTokens = 0;
    
    for (let round = 0; round < 10; round++) {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://rork.io', 
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: fullSystemPrompt }, ...messages],
          tools: [WRITE_FILE_TOOL],
          max_tokens: maxTokens,
          tool_choice: 'auto'
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(`OpenRouter Error: ${data.error.message}`);

      const message = data.choices[0].message;
      inputTokens += data.usage?.prompt_tokens || 0;
      outputTokens += data.usage?.completion_tokens || 0;

      if (message.content) fullText += message.content;

      if (message.tool_calls) {
        messages.push(message); // Adaugă răspunsul asistentului cu tool_calls
        
        for (const toolCall of message.tool_calls) {
          if (toolCall.function.name === 'write_file') {
            const input = JSON.parse(toolCall.function.arguments);
            files.push({
              path: input.path.trim(),
              content: input.content,
              language: getLanguageFromPath(input.path),
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: 'write_file',
              content: 'File written successfully',
            });
          }
        }
      } else {
        break; 
      }
    }
    
    return { text: fullText, files, usage: { inputTokens, outputTokens } };
  }
  
  async *streamCode(params: GenerateParams): AsyncGenerator<StreamChunk> {
    const {
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory = [],
      maxTokens = 16384,
      images = [],
      model = this.defaultModel,
    } = params;
    
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    const messages = this.buildMessages(prompt, conversationHistory, currentFiles, images);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://rork.io',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: fullSystemPrompt }, ...messages],
          tools: [WRITE_FILE_TOOL],
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let toolArguments = "";
      let isCollectingTool = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          const cleanLine = line.replace(/^data: /, '').trim();
          if (cleanLine === '[DONE]') continue;
          
          try {
            const json = JSON.parse(cleanLine);
            const delta = json.choices[0].delta;

            if (delta.content) {
              yield { type: 'text', content: delta.content };
            }

            if (delta.tool_calls) {
              isCollectingTool = true;
              toolArguments += delta.tool_calls[0].function.arguments || "";
            }

            if (json.choices[0].finish_reason === 'tool_calls') {
              const input = JSON.parse(toolArguments);
              yield {
                type: 'file',
                file: {
                  path: input.path.trim(),
                  content: input.content,
                  language: getLanguageFromPath(input.path),
                },
              };
              isCollectingTool = false;
              toolArguments = "";
            }
          } catch (e) { /* Ignoră chunk-uri parțiale */ }
        }
      }
      yield { type: 'done', usage: { inputTokens: 0, outputTokens: 0 } };
    } catch (error) {
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private buildMessages(prompt: string, history: ConversationMessage[], files: any, images: ImageAttachment[]) {
    let textContent = prompt;
    if (files && Object.keys(files).length > 0) {
      const fileContext = Object.entries(files)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      textContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }

    const userContent: any[] = [{ type: 'text', text: textContent }];
    images.forEach(img => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mediaType};base64,${img.data}` }
      });
    });

    return [
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userContent }
    ];
  }
}
