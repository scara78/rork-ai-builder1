import { GoogleGenAI, type Content, type Part, Type } from '@google/genai';
import type { 
  AIProvider, 
  GenerateParams, 
  GenerateResult, 
  StreamChunk,
  ConversationMessage 
} from '../types';
import { getLanguageFromPath, runChecks } from '../tools';
import { FULL_SYSTEM_PROMPT } from '../prompts';

const GEMINI_MODEL = 'gemini-3.1-pro-preview';

// Maximum number of API calls to prevent infinite loops / runaway costs
const MAX_API_CALLS = 100;

// After this many written files, compress the chat history to avoid context bloat
const COMPRESS_AFTER_FILES = 6;

// Max consecutive empty responses before resetting the session
const MAX_CONSECUTIVE_EMPTY = 2;

// Total empty responses across all session resets before giving up
const MAX_TOTAL_EMPTY = 8;

// Max retries for transient API errors (timeout, 503, rate limit)
const MAX_API_RETRIES = 2;

// Delay between API retries in ms
const API_RETRY_DELAY_MS = 3000;

// ── Tool Declarations ──────────────────────────────────────────────────────

const CREATE_PLAN_DECLARATION = {
  name: 'create_plan',
  description:
    'Create a structured plan for the app. You MUST call this tool FIRST before writing any files. Define every file the app needs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      app_name: {
        type: Type.STRING,
        description: 'Short name for the app (e.g., "FitTracker", "RecipeApp")',
      },
      app_type: {
        type: Type.STRING,
        description: 'Category of the app (e.g., "fitness", "social", "productivity")',
      },
      features: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of features the app will have',
      },
      screens: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of screens / pages in the app',
      },
      file_tree: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'Complete list of file paths to create (e.g., "app/_layout.tsx", "components/Button.tsx"). Include EVERY file the app needs.',
      },
      dependencies: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'npm packages required (only Expo Snack SDK 54 compatible)',
      },
      plan_steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Step-by-step implementation plan',
      },
    },
    required: ['app_name', 'app_type', 'features', 'screens', 'file_tree', 'plan_steps'],
  },
};

const WRITE_FILE_DECLARATION = {
  name: 'write_file',
  description:
    'Write or create a file in the project. Always provide COMPLETE file content with all imports and exports. Call this tool for EVERY file in the plan.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description:
          'File path relative to project root (e.g., app/_layout.tsx, components/Button.tsx)',
      },
      content: {
        type: Type.STRING,
        description: 'Complete file content including all imports and exports',
      },
    },
    required: ['path', 'content'],
  },
};

const COMPLETE_DECLARATION = {
  name: 'complete',
  description:
    'Signal that you have finished writing ALL files in the plan. Call this ONLY after every file in the plan has been written.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: 'Brief summary of what was built',
      },
      files_created: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of all file paths that were created/updated',
      },
      next_steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Optional suggestions for what the user could do next',
      },
    },
    required: ['summary', 'files_created'],
  },
};

const ALL_TOOLS = [
  { functionDeclarations: [CREATE_PLAN_DECLARATION, WRITE_FILE_DECLARATION, COMPLETE_DECLARATION] },
];

// ── Helper: build a continuation prompt when the model stops early ──────

function buildContinuationPrompt(remainingFiles: string[]): string {
  return [
    `CRITICAL: You have NOT finished writing all files yet. The following ${remainingFiles.length} file(s) from the plan have NOT been written:`,
    '',
    ...remainingFiles.map((f) => `- ${f}`),
    '',
    'You MUST call write_file for 3-5 of these files RIGHT NOW.',
    'Do NOT output any text. Do NOT explain. Do NOT apologize. ONLY call write_file.',
    'If you do not call write_file, the build will fail and the user will see an incomplete app.',
  ].join('\n');
}

/**
 * Build a compressed summary for context compression.
 * Includes the original user request + plan + what's been written + what remains,
 * so the fresh chat session has enough context to continue generating files.
 */
function buildCompressedContext(
  writtenFiles: Set<string>,
  planData: { appName: string; appType?: string; features?: string[]; fileTree: string[]; dependencies?: string[] } | null,
  remainingFiles: string[],
  originalPrompt: string,
): string {
  const written = Array.from(writtenFiles);
  return [
    `=== CONTINUATION SESSION ===`,
    `You are continuing to build an app. The plan was already created and some files have been written.`,
    '',
    `## Original User Request`,
    originalPrompt.length > 500 ? originalPrompt.slice(0, 500) + '...' : originalPrompt,
    '',
    planData ? `## Plan` : '',
    planData ? `App: ${planData.appName} (${planData.appType || 'general'})` : '',
    planData?.features?.length ? `Features: ${planData.features.join(', ')}` : '',
    planData?.dependencies?.length ? `Dependencies: ${planData.dependencies.join(', ')}` : '',
    planData ? `Total files in plan: ${planData.fileTree.length}` : '',
    '',
    `## Already Written (${written.length} files — do NOT rewrite these)`,
    ...written.map((f) => `- ${f}`),
    '',
    `## Remaining Files (${remainingFiles.length} — you MUST write these)`,
    ...remainingFiles.map((f) => `- ${f}`),
    '',
    `=== END CONTEXT ===`,
    '',
    `IMPORTANT: Call write_file immediately for 3-5 of the remaining files. Do NOT output text — only call write_file.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Check if an error is transient and should be retried */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('internal error') ||
    msg.includes('deadline exceeded')
  );
}

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildErrorFixPrompt(errors: string[]): string {
  return [
    `VERIFICATION FAILED. The code you generated has the following ${errors.length} errors:`,
    '',
    ...errors.slice(0, 10).map((e) => `- ${e}`),
    errors.length > 10 ? `- ...and ${errors.length - 10} more errors.` : '',
    '',
    'You MUST fix these errors before calling complete.',
    'Call write_file to overwrite the files containing these errors with the correct code.',
    'Do NOT stop or explain — just call write_file immediately to fix the issues.',
  ].join('\n');
}

// ── GeminiProvider ──────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  displayName = 'Gemini 3 Pro';

  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateCode(params: GenerateParams): Promise<GenerateResult> {
    // Delegate to streamCode and collect results
    const files: Array<{ path: string; content: string; language: string }> = [];
    let fullText = '';
    let usage = { inputTokens: 0, outputTokens: 0 };

    for await (const chunk of this.streamCode(params)) {
      if (chunk.type === 'text' && chunk.content) fullText += chunk.content;
      if (chunk.type === 'file' && chunk.file) files.push(chunk.file);
      if (chunk.type === 'done' && chunk.usage) usage = chunk.usage;
    }

    return { text: fullText, files, usage };
  }

  /**
   * Agentic streaming code generation with Plan → Write → Complete loop.
   *
   * Key resilience features:
   * - Context compression: after COMPRESS_AFTER_FILES writes, creates a fresh chat
   *   session with compressed history to prevent context bloat
   * - Empty response tracking: resets session after MAX_CONSECUTIVE_EMPTY empty
   *   responses; gives up gracefully after MAX_TOTAL_EMPTY total
   * - Retryable API errors: retries transient errors (timeout, 503, rate limit)
   *   up to MAX_API_RETRIES times with API_RETRY_DELAY_MS between
   * - Safety cap at MAX_API_CALLS to avoid runaway costs
   */
  async *streamCode(params: GenerateParams): AsyncGenerator<StreamChunk> {
    const {
      prompt,
      systemPrompt,
      currentFiles,
      conversationHistory = [],
      maxTokens = 65536,
      agentMode = 'build',
    } = params;

    let fullSystemPrompt = systemPrompt || FULL_SYSTEM_PROMPT;

    if (agentMode === 'plan') {
      fullSystemPrompt += '\n\nIMPORTANT: You are currently in PLAN MODE. You MUST ONLY use the `create_plan` tool to define the app structure and then immediately use the `complete` tool. Do NOT use the `write_file` tool to write any code in this mode. Your job is ONLY to plan.';
    }

    let userContent = prompt;
    if (currentFiles && Object.keys(currentFiles).length > 0) {
      const fileContext = Object.entries(currentFiles)
        .map(
          ([path, content]) =>
            `<current_file path="${path}">\n${content}\n</current_file>`,
        )
        .join('\n\n');
      userContent = `Current project files:\n${fileContext}\n\nUser request: ${prompt}`;
    }

    // Shared config for creating chat sessions
    const chatConfig = {
      model: GEMINI_MODEL,
      config: {
        tools: ALL_TOOLS,
        systemInstruction: fullSystemPrompt,
        maxOutputTokens: maxTokens,
        temperature: 1.0,
      },
    };

    // Create initial chat session
    let chat = this.ai.chats.create({
      ...chatConfig,
      history: this.formatHistory(conversationHistory),
    });

    let fullText = '';
    const writtenFiles = new Set<string>();
    const generatedCodeContext: Record<string, string> = { ...currentFiles };
    let planFileTree: string[] = [];
    let planData: StreamChunk['plan'] | null = null;
    let isComplete = false;
    let apiCallCount = 0;
    let lastCompressedAt = 0; // writtenFiles.size when we last compressed
    let consecutiveEmptyResponses = 0;
    let totalEmptyResponses = 0;

    /**
     * Send a message with retry logic for transient errors.
     * Returns { response, retried } so the caller can yield status messages if needed.
     */
    const sendWithRetry = async (message: Parameters<typeof chat.sendMessage>[0]): Promise<Awaited<ReturnType<typeof chat.sendMessage>>> => {
      let lastError: unknown;
      for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
        try {
          const resp = await chat.sendMessage(message);
          return resp;
        } catch (err) {
          lastError = err;
          if (attempt < MAX_API_RETRIES && isRetryableError(err)) {
            console.log(`[gemini] Retryable error on attempt ${attempt + 1}/${MAX_API_RETRIES + 1}: ${err instanceof Error ? err.message : err}`);
            await sleep(API_RETRY_DELAY_MS);
          } else {
            throw err;
          }
        }
      }
      throw lastError;
    };

    /**
     * Create a fresh chat session with compressed context.
     * Replaces the accumulated history with a rich summary so the model
     * knows what app it's building and what files remain.
     */
    const compressAndResetChat = (): void => {
      const remainingFiles = planFileTree.filter((f) => !writtenFiles.has(f));
      const summary = buildCompressedContext(
        writtenFiles,
        planData ? {
          appName: planData.appName || 'App',
          appType: planData.appType || 'general',
          features: planData.features || [],
          fileTree: planFileTree,
          dependencies: planData.dependencies || [],
        } : null,
        remainingFiles,
        userContent,
      );

      console.log(`[gemini] Compressing context: ${writtenFiles.size} written, ${remainingFiles.length} remaining. Creating fresh chat session.`);

      chat = this.ai.chats.create({
        ...chatConfig,
        history: [
          { role: 'user', parts: [{ text: summary }] },
        ],
      });
      lastCompressedAt = writtenFiles.size;
    };

    try {
      // ── Phase: initial send ──
      yield { type: 'phase', phase: 'planning' };
      console.log(`[gemini] Starting streamCode. agentMode=${agentMode}`);

      let response = await sendWithRetry({ message: userContent });
      apiCallCount++;

      // ── Main agentic loop ──
      while (!isComplete && apiCallCount < MAX_API_CALLS) {
        console.log(`[gemini] Loop iteration: apiCalls=${apiCallCount}, written=${writtenFiles.size}/${planFileTree.length}, functionCalls=${response.functionCalls?.length ?? 0}`);

        // Stream text incrementally (not buffered until loop end)
        if (response.text) {
          fullText += response.text;
          yield { type: 'text', content: response.text };
        }

        // Process function calls
        const functionCalls = response.functionCalls;
        if (!functionCalls || functionCalls.length === 0) {
          // ── Empty response handling (Fix 2C) ──
          consecutiveEmptyResponses++;
          totalEmptyResponses++;
          console.log(`[gemini] Empty response #${consecutiveEmptyResponses} (total: ${totalEmptyResponses})`);

          if (agentMode === 'build') {
            const remainingFiles = planFileTree.filter((f) => !writtenFiles.has(f));

            if (remainingFiles.length > 0) {
              // Check if we should give up entirely
              if (totalEmptyResponses >= MAX_TOTAL_EMPTY) {
                console.log(`[gemini] Giving up after ${totalEmptyResponses} total empty responses. ${writtenFiles.size}/${planFileTree.length} files written.`);
                yield { type: 'text', content: `\n[Warning: AI stopped responding after writing ${writtenFiles.size}/${planFileTree.length} files. Completing with files written so far.]\n` };
                break;
              }

              // Reset session after consecutive empties
              if (consecutiveEmptyResponses >= MAX_CONSECUTIVE_EMPTY) {
                console.log(`[gemini] ${consecutiveEmptyResponses} consecutive empties. Resetting session.`);
                yield { type: 'text', content: `\n[Session reset: ${remainingFiles.length} files remaining...]\n` };
                compressAndResetChat();
                consecutiveEmptyResponses = 0;
                const continuationMsg = buildContinuationPrompt(remainingFiles);
                response = await sendWithRetry({ message: continuationMsg });
                apiCallCount++;
                continue;
              }

              // Regular continuation
              const continuationMsg = buildContinuationPrompt(remainingFiles);
              yield { type: 'text', content: `\n[Continuing: ${remainingFiles.length} files remaining...]\n` };
              response = await sendWithRetry({ message: continuationMsg });
              apiCallCount++;
              continue;
            }
          }

          // No plan or all files written but complete not called — auto-complete
          break;
        }

        // Got function calls — reset consecutive empty counter
        consecutiveEmptyResponses = 0;

        // Build function responses
        const functionResponseParts: Part[] = [];

        for (const fc of functionCalls) {
          if (fc.name === 'create_plan' && fc.args) {
            const args = fc.args as {
              app_name: string;
              app_type: string;
              features: string[];
              screens: string[];
              file_tree: string[];
              dependencies?: string[];
              plan_steps?: string[];
            };

            planFileTree = (args.file_tree || []).map((f) => f.trim().replace(/^\/+/, ''));
            planData = {
              appName: args.app_name || 'App',
              appType: args.app_type || 'general',
              features: args.features || [],
              screens: args.screens || [],
              fileTree: planFileTree,
              dependencies: args.dependencies || [],
              planSteps: args.plan_steps || [],
            };

            console.log(`[gemini] Plan created: ${planData.appName}, ${planFileTree.length} files`);
            yield { type: 'plan', plan: planData };
            
            if (agentMode === 'plan') {
              functionResponseParts.push({
                functionResponse: {
                  name: 'create_plan',
                  response: {
                    success: true,
                    message: `Plan created successfully. Now call the complete tool with a summary.`,
                  },
                },
              });
            } else {
              yield { type: 'phase', phase: 'coding' };

              functionResponseParts.push({
                functionResponse: {
                  name: 'create_plan',
                  response: {
                    success: true,
                    message: `Plan created for ${args.app_name} with ${planFileTree.length} files. Now call write_file for EACH file in the plan, then call complete when done.`,
                  },
                },
              });
            }
          } else if (fc.name === 'write_file') {
            const args = fc.args as { path?: string; content?: string } | null;
            if (args?.path && args?.content) {
              const filePath = args.path.trim().replace(/^\/+/, '');
              writtenFiles.add(filePath);
              generatedCodeContext[filePath] = args.content;

              yield {
                type: 'file',
                file: {
                  path: filePath,
                  content: args.content,
                  language: getLanguageFromPath(filePath),
                },
              };

              yield {
                type: 'progress',
                progress: {
                  currentFile: filePath,
                  completedFiles: writtenFiles.size,
                  totalFiles: Math.max(planFileTree.length, writtenFiles.size),
                },
              };

              console.log(`[gemini] Wrote file: ${filePath} (${writtenFiles.size}/${planFileTree.length})`);

              functionResponseParts.push({
                functionResponse: {
                  name: 'write_file',
                  response: { success: true, message: `File written: ${filePath}` },
                },
              });
            } else {
              // Model called write_file with empty/missing path or content — this is a degenerate response.
              // We still need to send a function response so the loop doesn't break.
              console.log(`[gemini] write_file called with empty args: path=${args?.path}, content length=${args?.content?.length ?? 0}`);
              const remaining = planFileTree.filter((f) => !writtenFiles.has(f));
              functionResponseParts.push({
                functionResponse: {
                  name: 'write_file',
                  response: {
                    success: false,
                    error: `write_file was called with empty path or content. You still have ${remaining.length} files to write: ${remaining.join(', ')}. Call write_file again with the correct path and COMPLETE file content.`,
                  },
                },
              });
            }
          } else if (fc.name === 'complete' && fc.args) {
            const remainingFiles = planFileTree.filter((f) => !writtenFiles.has(f));
            
            if (agentMode === 'build' && remainingFiles.length > 0) {
              functionResponseParts.push({
                functionResponse: {
                  name: 'complete',
                  response: { 
                    success: false, 
                    error: `You cannot call complete yet. You have ${remainingFiles.length} files left to write from your plan: ${remainingFiles.join(', ')}. Call write_file for these remaining files immediately.` 
                  },
                },
              });
            } else {
              isComplete = true;
              yield { type: 'phase', phase: 'complete' };

              functionResponseParts.push({
                functionResponse: {
                  name: 'complete',
                  response: { success: true },
                },
              });
              break;
            }
          }
        }

        if (isComplete) break;

        // ── Context compression (Fix 2B) ──
        // If we've written enough new files since last compression, create a fresh session
        if (
          agentMode === 'build' &&
          writtenFiles.size - lastCompressedAt >= COMPRESS_AFTER_FILES &&
          planFileTree.filter((f) => !writtenFiles.has(f)).length > 0
        ) {
          compressAndResetChat();
          const remainingFiles = planFileTree.filter((f) => !writtenFiles.has(f));
          const continuationMsg = buildContinuationPrompt(remainingFiles);
          response = await sendWithRetry({ message: continuationMsg });
          apiCallCount++;
          continue;
        }

        // After processing all calls in this batch, check if plan is fulfilled
        if (agentMode === 'build' && planFileTree.length > 0) {
          const remainingFiles = planFileTree.filter((f) => !writtenFiles.has(f));
          if (remainingFiles.length === 0 && !isComplete) {
            const checkResult = runChecks(generatedCodeContext, ['typecheck', 'lint', 'build']);
            
            if (!checkResult.success && checkResult.error) {
              const errors = checkResult.error.split('\n');
              const errorPrompt = buildErrorFixPrompt(errors);
              
              yield { type: 'text', content: `\n[Verification failed. Auto-fixing ${errors.length} errors...]\n` };
              response = await sendWithRetry({ message: errorPrompt });
              apiCallCount++;
              continue;
            } else {
              isComplete = true;
              yield { type: 'phase', phase: 'complete' };
              break;
            }
          }
        } else if (agentMode === 'plan' && planFileTree.length > 0 && !isComplete) {
           isComplete = true;
           yield { type: 'phase', phase: 'complete' };
           break;
        }

        // Send function responses and continue loop
        if (functionResponseParts.length > 0) {
          response = await sendWithRetry({ message: functionResponseParts });
          apiCallCount++;
        } else {
          break;
        }
      }

      console.log(`[gemini] Finished. apiCalls=${apiCallCount}, written=${writtenFiles.size}/${planFileTree.length}, complete=${isComplete}`);

      // Usage from last response
      const inputTokens =
        response.usageMetadata?.promptTokenCount ||
        Math.ceil(userContent.length / 4);
      const outputTokens =
        response.usageMetadata?.candidatesTokenCount ||
        Math.ceil(fullText.length / 4);

      yield { type: 'done', usage: { inputTokens, outputTokens } };
    } catch (error) {
      console.error(`[gemini] Fatal error after ${apiCallCount} API calls, ${writtenFiles.size} files written:`, error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatHistory(history: ConversationMessage[]): Content[] {
    return history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }
}
