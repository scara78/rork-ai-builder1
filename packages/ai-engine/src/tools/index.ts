/**
 * Agent Tools - Functions that the AI Agent can call
 * These tools enable the agent to autonomously build, test, and debug apps
 */

import type { ParsedFile } from '../types';

// Tool definitions for Claude tool_use
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      items?: { type: string };
      enum?: string[];
    }>;
    required: string[];
  };
}

// Tool execution result
export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: unknown;
}

// Available tools for the agent
export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'create_plan',
    description: 'Create a development plan for the app including file structure, features, and tech stack. Call this FIRST before writing any code.',
    input_schema: {
      type: 'object',
      properties: {
        app_name: {
          type: 'string',
          description: 'Name of the app',
        },
        app_type: {
          type: 'string',
          description: 'Type of app (todo, fitness, shop, chat, dashboard, social, media, etc.)',
        },
        features: {
          type: 'array',
          description: 'List of features to implement',
          items: { type: 'string' },
        },
        screens: {
          type: 'array',
          description: 'List of screens/routes to create',
          items: { type: 'string' },
        },
        file_tree: {
          type: 'array',
          description: 'Complete file tree to generate (e.g., app/_layout.tsx, components/Card.tsx)',
          items: { type: 'string' },
        },
        dependencies: {
          type: 'array',
          description: 'Additional npm packages needed beyond Expo defaults',
          items: { type: 'string' },
        },
        plan_steps: {
          type: 'array',
          description: 'Ordered implementation steps with short descriptions',
          items: { type: 'string' },
        },
      },
      required: ['app_name', 'app_type', 'features', 'screens', 'file_tree'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or update a file in the project. Always provide COMPLETE file content, never partial.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to project root (e.g., app/_layout.tsx, components/Button.tsx)',
        },
        content: {
          type: 'string',
          description: 'Complete file content. Must include all imports and exports.',
        },
        description: {
          type: 'string',
          description: 'Brief description of what this file does',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'patch_file',
    description: 'Patch part of an existing file by replacing one snippet with another snippet.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to patch',
        },
        find: {
          type: 'string',
          description: 'Exact snippet to find in the file',
        },
        replace: {
          type: 'string',
          description: 'Replacement snippet',
        },
        description: {
          type: 'string',
          description: 'Brief reason for this patch',
        },
      },
      required: ['path', 'find', 'replace'],
    },
  },
  {
    name: 'search_files',
    description: 'Search project files for text to locate relevant code sections before editing.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for',
        },
        path_prefix: {
          type: 'string',
          description: 'Optional path prefix filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'verify_project',
    description: 'Run verification checks (typecheck/lint/build) and return diagnostics.',
    input_schema: {
      type: 'object',
      properties: {
        checks: {
          type: 'array',
          description: 'Checks to run in order',
          items: { type: 'string' },
        },
      },
      required: ['checks'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to delete',
        },
        reason: {
          type: 'string',
          description: 'Reason for deletion',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the current content of a file to understand existing code before modifying',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to read',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files in the project to understand current structure',
    input_schema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory to list (optional, defaults to root)',
        },
      },
      required: [],
    },
  },
  {
    name: 'run_test',
    description: 'Run the app in test mode and check for errors. Returns build/runtime errors if any.',
    input_schema: {
      type: 'object',
      properties: {
        check_type: {
          type: 'string',
          description: 'Type of check to run',
          enum: ['typescript', 'lint', 'build', 'runtime'],
        },
      },
      required: ['check_type'],
    },
  },
  {
    name: 'fix_error',
    description: 'Attempt to fix a specific error by editing relevant files',
    input_schema: {
      type: 'object',
      properties: {
        error_message: {
          type: 'string',
          description: 'The error message to fix',
        },
        file_path: {
          type: 'string',
          description: 'File where the error occurs',
        },
        fix_description: {
          type: 'string',
          description: 'Description of the fix to apply',
        },
      },
      required: ['error_message', 'file_path', 'fix_description'],
    },
  },
  {
    name: 'complete',
    description: 'Mark the task as complete. Call this when the app is fully built and working.',
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Summary of what was built',
        },
        files_created: {
          type: 'array',
          description: 'List of files that were created/modified',
          items: { type: 'string' },
        },
        next_steps: {
          type: 'array',
          description: 'Suggested next steps for the user',
          items: { type: 'string' },
        },
      },
      required: ['summary', 'files_created'],
    },
  },
];

// Tool type for runtime
export type ToolName = 
  | 'create_plan' 
  | 'write_file' 
  | 'patch_file'
  | 'search_files'
  | 'verify_project'
  | 'delete_file' 
  | 'read_file' 
  | 'list_files'
  | 'run_test' 
  | 'fix_error' 
  | 'complete';

// Input types for each tool
export interface CreatePlanInput {
  app_name: string;
  app_type: string;
  features: string[];
  screens: string[];
  file_tree: string[];
  dependencies?: string[];
  plan_steps?: string[];
}

export interface WriteFileInput {
  path: string;
  content: string;
  description?: string;
}

export interface PatchFileInput {
  path: string;
  find: string;
  replace: string;
  description?: string;
}

export interface SearchFilesInput {
  query: string;
  path_prefix?: string;
}

export interface VerifyProjectInput {
  checks: Array<'typecheck' | 'lint' | 'build'>;
}

export interface DeleteFileInput {
  path: string;
  reason?: string;
}

export interface ReadFileInput {
  path: string;
}

export interface ListFilesInput {
  directory?: string;
}

export interface RunTestInput {
  check_type: 'typescript' | 'lint' | 'build' | 'runtime';
}

export interface FixErrorInput {
  error_message: string;
  file_path: string;
  fix_description: string;
}

export interface CompleteInput {
  summary: string;
  files_created: string[];
  next_steps?: string[];
}

export type ToolInput = 
  | CreatePlanInput 
  | WriteFileInput 
  | PatchFileInput
  | SearchFilesInput
  | VerifyProjectInput
  | DeleteFileInput 
  | ReadFileInput 
  | ListFilesInput
  | RunTestInput 
  | FixErrorInput 
  | CompleteInput;

/**
 * Tool executor interface - implemented by the API layer
 * This allows the agent to execute tools against the actual project
 */
export interface ToolExecutor {
  createPlan(input: CreatePlanInput): Promise<ToolResult>;
  writeFile(input: WriteFileInput): Promise<ToolResult>;
  patchFile(input: PatchFileInput): Promise<ToolResult>;
  searchFiles(input: SearchFilesInput): Promise<ToolResult>;
  verifyProject(input: VerifyProjectInput): Promise<ToolResult>;
  deleteFile(input: DeleteFileInput): Promise<ToolResult>;
  readFile(input: ReadFileInput): Promise<ToolResult>;
  listFiles(input: ListFilesInput): Promise<ToolResult>;
  runTest(input: RunTestInput): Promise<ToolResult>;
  fixError(input: FixErrorInput): Promise<ToolResult>;
  complete(input: CompleteInput): Promise<ToolResult>;
}

/**
 * Execute a tool call from the agent
 */
export async function executeTool(
  executor: ToolExecutor,
  toolName: ToolName,
  input: ToolInput
): Promise<ToolResult> {
  switch (toolName) {
    case 'create_plan':
      return executor.createPlan(input as CreatePlanInput);
    case 'write_file':
      return executor.writeFile(input as WriteFileInput);
    case 'patch_file':
      return executor.patchFile(input as PatchFileInput);
    case 'search_files':
      return executor.searchFiles(input as SearchFilesInput);
    case 'verify_project':
      return executor.verifyProject(input as VerifyProjectInput);
    case 'delete_file':
      return executor.deleteFile(input as DeleteFileInput);
    case 'read_file':
      return executor.readFile(input as ReadFileInput);
    case 'list_files':
      return executor.listFiles(input as ListFilesInput);
    case 'run_test':
      return executor.runTest(input as RunTestInput);
    case 'fix_error':
      return executor.fixError(input as FixErrorInput);
    case 'complete':
      return executor.complete(input as CompleteInput);
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
  }
}

/**
 * Get language from file path
 */
export function getLanguageFromPath(path: string): string {
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
