import Anthropic from '@anthropic-ai/sdk';
import type { 
  AIProvider, 
  GenerateParams, 
  GenerateResult, 
  StreamChunk,
  ConversationMessage,
  ImageAttachment,
} from '../types';
import { parseGeneratedFiles } from '../parser';
import { FULL_SYSTEM_PROMPT } from '../prompts';

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
    
    // Build the full system prompt with Expo SDK 54+ knowledge
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    // Build context from current files
    let textContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      textContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }
    
    // Build user content with images
    const userContent = this.buildUserContent(textContent, images);
    
    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...this.formatHistory(conversationHistory),
      { role: 'user', content: userContent },
    ];
    
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: fullSystemPrompt,
      messages,
    });
    
    // Extract text content
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');
    
    // Parse generated files
    const files = parseGeneratedFiles(text);
    
    return {
      text,
      files,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
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
    
    // Build the full system prompt with Expo SDK 54+ knowledge
    const fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;
    
    let textContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(([path, content]) => `<current_file path="${path}">\n${content}\n</current_file>`)
        .join('\n\n');
      textContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }
    
    // Build user content with images
    const userContent = this.buildUserContent(textContent, images);
    
    const messages: Anthropic.MessageParam[] = [
      ...this.formatHistory(conversationHistory),
      { role: 'user', content: userContent },
    ];
    
    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;
    
    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: fullSystemPrompt,
      messages,
    });
    
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          fullText += delta.text;
          yield { type: 'text', content: delta.text };
        }
      } else if (event.type === 'message_delta') {
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      } else if (event.type === 'message_start') {
        if (event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
        }
      }
    }
    
    // Parse files after streaming is complete
    const files = parseGeneratedFiles(fullText);
    for (const file of files) {
      yield { type: 'file', file };
    }
    
    yield { 
      type: 'done', 
      usage: { inputTokens, outputTokens } 
    };
  }
  
  /**
   * Build user content array with optional images for vision
   */
  private buildUserContent(
    text: string, 
    images: ImageAttachment[]
  ): Array<Anthropic.ImageBlockParam | Anthropic.TextBlockParam> | string {
    // If no images, return simple string
    if (!images || images.length === 0) {
      return text;
    }
    
    // Build content array with images first, then text
    const content: Array<Anthropic.ImageBlockParam | Anthropic.TextBlockParam> = [];
    
    // Add images
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
    
    // Add instruction text for vision requests
    const visionPrompt = images.length > 0 
      ? `I've attached ${images.length} image${images.length > 1 ? 's' : ''} for reference. Please analyze ${images.length > 1 ? 'them' : 'it'} and:\n\n${text}`
      : text;
    
    // Add text content
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
