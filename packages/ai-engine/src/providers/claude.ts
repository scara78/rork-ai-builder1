import Anthropic from '@anthropic-ai/sdk';
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

// Claude tool definition for write_file
const WRITE_FILE_TOOL: Anthropic.Tool = {
  name: 'write_file',
  description: 'Write or create a file in the project. Always provide COMPLETE file content with all imports and exports. Call this tool for EVERY file you want to create or modify.',
  input_schema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to project root (e.g., app/_layout.tsx, components/Button.tsx)',
      },
      content: {
        type: 'string',
        description: 'Complete file content including all imports and exports',
      },
    },
    required: ['path', 'content'],
  },
};

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  displayName = 'Claude';
  
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async generateCode(params: GenerateParams): Promise<GenerateResult> {
    const {
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory = [],
      maxTokens = 16384,
      images = [],
    } = params;
    
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    let textContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      textContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }
    
    const userContent = this.buildUserContent(textContent, images);
    
    let messages: Anthropic.MessageParam[] = [
      ...this.formatHistory(conversationHistory),
      { role: 'user', content: userContent },
    ];
    
    let fullText = '';
    const files: Array<{ path: string; content: string; language: string }> = [];
    let inputTokens = 0;
    let outputTokens = 0;
    
    // Multi-turn: Claude may respond with text + tool_use, we send tool results back
    for (let round = 0; round < 20; round++) {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: fullSystemPrompt,
        messages,
        tools: [WRITE_FILE_TOOL],
      });
      
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;
      
      // Process content blocks
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];
      
      for (const block of response.content) {
        if (block.type === 'text') {
          fullText += block.text;
        } else if (block.type === 'tool_use') {
          if (block.name === 'write_file') {
            const input = block.input as { path: string; content: string };
            if (input.path && input.content) {
              files.push({
                path: input.path.trim(),
                content: input.content,
                language: getLanguageFromPath(input.path),
              });
            }
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'File written successfully',
          });
        }
      }
      
      // If no tool calls or stop_reason is end_turn, we're done
      if (toolResults.length === 0 || response.stop_reason === 'end_turn') break;
      
      // Send tool results back for the next round
      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
    }
    
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
      maxTokens = 16384,
      images = [],
    } = params;
    
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    let textContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      textContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }
    
    const userContent = this.buildUserContent(textContent, images);
    
    let messages: Anthropic.MessageParam[] = [
      ...this.formatHistory(conversationHistory),
      { role: 'user', content: userContent },
    ];
    
    let fullText = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    try {
      // Multi-turn streaming with tool use
      for (let round = 0; round < 20; round++) {
        let inputTokens = 0;
        let outputTokens = 0;
        
        // Collect full response content blocks for multi-turn
        const contentBlocks: Anthropic.ContentBlock[] = [];
        let currentToolId = '';
        let currentToolName = '';
        let currentToolInput = '';
        let stopReason: string | null = null;
        
        const stream = this.client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system: fullSystemPrompt,
          messages,
          tools: [WRITE_FILE_TOOL],
        });
        
        for await (const event of stream) {
          if (event.type === 'message_start') {
            if (event.message.usage) {
              inputTokens = event.message.usage.input_tokens;
            }
          } else if (event.type === 'content_block_start') {
            if (event.content_block.type === 'text') {
              contentBlocks.push(event.content_block);
            } else if (event.content_block.type === 'tool_use') {
              currentToolId = event.content_block.id;
              currentToolName = event.content_block.name;
              currentToolInput = '';
              contentBlocks.push(event.content_block);
            }
          } else if (event.type === 'content_block_delta') {
            const delta = event.delta;
            if ('text' in delta && delta.text) {
              fullText += delta.text;
              yield { type: 'text', content: delta.text };
            }
            if ('partial_json' in delta && delta.partial_json) {
              currentToolInput += delta.partial_json;
            }
          } else if (event.type === 'content_block_stop') {
            // If we just finished a tool_use block, process it
            if (currentToolName === 'write_file' && currentToolInput) {
              try {
                const input = JSON.parse(currentToolInput) as { path: string; content: string };
                if (input.path && input.content) {
                  yield {
                    type: 'file',
                    file: {
                      path: input.path.trim(),
                      content: input.content,
                      language: getLanguageFromPath(input.path),
                    },
                  };
                }
              } catch {
                // JSON parse failed - ignore
              }
              // Update the content block with parsed input
              const lastBlock = contentBlocks[contentBlocks.length - 1];
              if (lastBlock && lastBlock.type === 'tool_use') {
                try {
                  (lastBlock as Anthropic.ToolUseBlock).input = JSON.parse(currentToolInput);
                } catch {
                  (lastBlock as Anthropic.ToolUseBlock).input = { path: '', content: '' };
                }
              }
              currentToolName = '';
              currentToolInput = '';
            }
          } else if (event.type === 'message_delta') {
            if (event.usage) {
              outputTokens = event.usage.output_tokens;
            }
            if ('stop_reason' in event.delta) {
              stopReason = event.delta.stop_reason;
            }
          }
        }
        
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        
        // Check if we need another round (tool_use stop reason)
        const toolUseBlocks = contentBlocks.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
        
        if (toolUseBlocks.length === 0 || stopReason === 'end_turn') break;
        
        // Build tool results and continue
        const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = 
          toolUseBlocks.map(block => ({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: 'File written successfully',
          }));
        
        messages = [
          ...messages,
          { role: 'assistant', content: contentBlocks },
          { role: 'user', content: toolResults },
        ];
      }
      
      yield { type: 'done', usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };
    } catch (error) {
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  private buildUserContent(
    text: string, 
    images: ImageAttachment[]
  ): Array<Anthropic.ImageBlockParam | Anthropic.TextBlockParam> | string {
    if (!images || images.length === 0) {
      return text;
    }
    
    const content: Array<Anthropic.ImageBlockParam | Anthropic.TextBlockParam> = [];
    
    for (const image of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data,
        },
      });
    }
    
    const visionPrompt = images.length > 0 
      ? `I've attached ${images.length} image${images.length > 1 ? 's' : ''} for reference. Please analyze ${images.length > 1 ? 'them' : 'it'} and:\n\n${text}`
      : text;
    
    content.push({
      type: 'text',
      text: visionPrompt,
    });
    
    return content;
  }
  
  private formatHistory(history: ConversationMessage[]): Anthropic.MessageParam[] {
    return history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }
}
