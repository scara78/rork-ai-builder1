import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { 
  RorkAgent, 
  type ToolExecutor, 
  type ToolResult,
  type CreatePlanInput,
  type WriteFileInput,
  type DeleteFileInput,
  type ReadFileInput,
  type ListFilesInput,
  type RunTestInput,
  type FixErrorInput,
  type CompleteInput,
  type AgentEvent,
} from '@ai-engine/core';

export const maxDuration = 300; // 5 minutes for agent runs

/**
 * Agent API endpoint
 * Runs the autonomous agent to build a complete app
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient();
        
        // Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Unauthorized' })}\n\n`
          ));
          controller.close();
          return;
        }
        
        const body = await request.json();
        const { 
          projectId, 
          prompt,
          existingFiles = {},
        } = body;
        
        if (!projectId || !prompt) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Missing required fields' })}\n\n`
          ));
          controller.close();
          return;
        }
        
        // Verify project ownership
        const { data: project } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();
        
        if (!project) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Project not found' })}\n\n`
          ));
          controller.close();
          return;
        }
        
        // Get API key
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: 'Claude API key not configured' })}\n\n`
          ));
          controller.close();
          return;
        }
        
        // Track all files created/updated
        const projectFiles: Record<string, { path: string; content: string; language: string }> = {};
        
        // Create tool executor that operates on project files
        const executor: ToolExecutor = {
          async createPlan(input: CreatePlanInput): Promise<ToolResult> {
            // Send plan event
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'plan_created', 
                plan: {
                  appName: input.app_name,
                  appType: input.app_type,
                  features: input.features,
                  screens: input.screens,
                  fileTree: input.file_tree,
                  dependencies: input.dependencies || [],
                }
              })}\n\n`
            ));
            
            return {
              success: true,
              output: `Plan created for ${input.app_name} (${input.app_type}) with ${input.file_tree.length} files`,
            };
          },
          
          async writeFile(input: WriteFileInput): Promise<ToolResult> {
            const language = getLanguageFromPath(input.path);
            projectFiles[input.path] = {
              path: input.path,
              content: input.content,
              language,
            };
            
            return {
              success: true,
              output: `File written: ${input.path}`,
            };
          },
          
          async deleteFile(input: DeleteFileInput): Promise<ToolResult> {
            delete projectFiles[input.path];
            
            return {
              success: true,
              output: `File deleted: ${input.path}`,
            };
          },
          
          async readFile(input: ReadFileInput): Promise<ToolResult> {
            const file = projectFiles[input.path] || existingFiles[input.path];
            
            if (file) {
              return {
                success: true,
                output: typeof file === 'string' ? file : file.content,
              };
            }
            
            return {
              success: false,
              error: `File not found: ${input.path}`,
            };
          },
          
          async listFiles(input: ListFilesInput): Promise<ToolResult> {
            const allFiles = [
              ...Object.keys(projectFiles),
              ...Object.keys(existingFiles),
            ];
            const uniqueFiles = [...new Set(allFiles)];
            
            if (input.directory) {
              const filtered = uniqueFiles.filter(f => f.startsWith(input.directory!));
              return {
                success: true,
                output: filtered.join('\n'),
              };
            }
            
            return {
              success: true,
              output: uniqueFiles.join('\n'),
            };
          },
          
          async runTest(input: RunTestInput): Promise<ToolResult> {
            // Basic validation - in production this would run actual tests
            const errors: string[] = [];
            
            if (input.check_type === 'typescript') {
              // Check for basic TypeScript issues
              for (const [path, file] of Object.entries(projectFiles)) {
                const content = file.content;
                
                // Check for missing imports
                if (content.includes('useState') && !content.includes("from 'react'")) {
                  errors.push(`${path}: Missing React import for useState`);
                }
                
                // Check for web elements
                const webElements = ['<div', '<span', '<button>'];
                for (const el of webElements) {
                  if (content.includes(el)) {
                    errors.push(`${path}: Using web element ${el} instead of React Native component`);
                  }
                }
                
                // Check for missing export
                if (path.endsWith('.tsx') && !content.includes('export')) {
                  errors.push(`${path}: Missing export statement`);
                }
              }
            }
            
            if (errors.length > 0) {
              return {
                success: false,
                error: errors.join('\n'),
                data: { errors },
              };
            }
            
            return {
              success: true,
              output: `${input.check_type} check passed`,
            };
          },
          
          async fixError(input: FixErrorInput): Promise<ToolResult> {
            // This tool is informational - the actual fix happens via write_file
            return {
              success: true,
              output: `Will fix: ${input.fix_description}`,
            };
          },
          
          async complete(input: CompleteInput): Promise<ToolResult> {
            return {
              success: true,
              output: input.summary,
              data: {
                summary: input.summary,
                filesCreated: input.files_created,
                nextSteps: input.next_steps,
              },
            };
          },
        };
        
        // Save user message
        await supabase.from('messages').insert({
          project_id: projectId,
          role: 'user',
          content: `[Agent Mode] ${prompt}`,
          model: 'claude',
        });
        
        // Create and run agent
        const agent = new RorkAgent({
          apiKey,
          maxIterations: 15,
          maxTokens: 16384,
          onEvent: (event: AgentEvent) => {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify(event)}\n\n`
            ));
          },
        });
        
        const result = await agent.run(prompt, executor, existingFiles);
        
        // Save all generated files to database
        if (Object.keys(projectFiles).length > 0) {
          for (const file of Object.values(projectFiles)) {
            await supabase
              .from('project_files')
              .upsert({
                project_id: projectId,
                path: file.path,
                content: file.content,
                language: file.language,
              }, {
                onConflict: 'project_id,path',
              });
          }
          
          await supabase
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);
        }
        
        // Save assistant summary message
        const summaryContent = result.success
          ? `Built ${result.files.length} files in ${result.iterations} iterations.\n\n${result.summary || ''}`
          : `Agent failed: ${result.error}`;
          
        await supabase.from('messages').insert({
          project_id: projectId,
          role: 'assistant',
          content: summaryContent,
          model: 'claude',
          files_changed: Object.keys(projectFiles),
          tokens_used: result.usage.inputTokens + result.usage.outputTokens,
        });
        
        // Send final result
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ 
            type: 'agent_complete',
            success: result.success,
            files: Object.values(projectFiles),
            summary: result.summary,
            usage: result.usage,
            iterations: result.iterations,
            error: result.error,
          })}\n\n`
        ));
        
        controller.close();
        
      } catch (error) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })}\n\n`
        ));
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return 'typescript';
    case 'jsx':
    case 'js':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}
