import { NextResponse } from 'next/server';
import { GeminiProvider, ClaudeProvider } from '@rork/ai-engine';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt, currentFiles, conversationHistory, images } = await req.json();

    // Validare flexibilă: Trebuie să existe MĂCAR o cheie configurată
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasClaude = !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY;

    if (!hasGemini && !hasClaude) {
      return NextResponse.json(
        { error: 'No AI API key configured. Please set GEMINI_API_KEY or CLAUDE_API_KEY in environment.' },
        { status: 500 }
      );
    }

    // Determinăm providerul bazat pe variabila de mediu AI_PROVIDER
    const providerType = process.env.AI_PROVIDER || 'gemini';
    
    let provider;
    if (providerType === 'claude') {
      provider = new ClaudeProvider(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '');
    } else {
      provider = new GeminiProvider(process.env.GEMINI_API_KEY || '');
    }

    const stream = provider.streamCode({
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory,
      images,
      // @ts-ignore - trecem modelul din ENV către provider
      model: process.env.AI_MODEL
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.close();
        } catch (error: any) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
