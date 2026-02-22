import { bundleProject } from '@/lib/bundler';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// GET /api/projects/[id]/bundle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '');
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('token') || undefined;
    const accessToken = headerToken || queryToken;

    // Bundle the project directly using our custom esbuild + virtual-fs logic
    const html = await bundleProject({ 
      projectId, 
      accessToken: accessToken || undefined 
    });

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Bundle] Error:', error);

    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Bundle Error</title></head>
      <body style="padding: 2rem; font-family: monospace; color: #f87171; background: #450a0a;">
        <h2>❌ Bundle Error</h2>
        <pre style="white-space: pre-wrap; font-size: 12px;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}
