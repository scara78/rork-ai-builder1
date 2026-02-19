# Rork AI Mobile App Builder

An AI-powered platform for building React Native mobile apps from natural language descriptions. Describe your app idea, and the AI agent autonomously generates a complete Expo project with live preview.

## How It Works

1. **Describe** your app on the landing page
2. **Sign up** (email + password)
3. **Watch** the AI agent build your app in real-time
4. **Preview** on a phone simulator in the browser or scan a QR code for Expo Go
5. **Edit** code directly in the built-in Monaco editor
6. **Export** as ZIP, sync to GitHub, or build for app stores via EAS

## Features

- **AI Agent**: Autonomous app builder using Gemini 2.0 Flash (default) or Claude with multi-turn tool loop
- **Live Preview**: Expo Snack SDK renders your app in a phone-sized iframe — updates in real-time as files are generated
- **Code Editor**: Monaco-based editor with syntax highlighting and file tree
- **Command Palette**: Quick access to all features (`Cmd+K`)
- **GitHub Sync**: Push your project to GitHub with one click
- **ZIP Export**: Download your complete Expo project
- **EAS Build**: Generate build config for App Store / Play Store submission
- **Auth**: Email/password via Supabase (OAuth Google/GitHub ready but not yet configured)

## Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v3
- **Backend**: Next.js API Routes (SSE streaming for agent)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (SSR with proxy.ts)
- **AI**: Gemini 2.0 Flash (default), Claude (optional)
- **Preview**: Expo Snack SDK (in-browser, no separate server needed)
- **State**: Zustand + Immer (projectStore, agentStore)
- **Build System**: Turborepo, pnpm workspaces

## Project Structure

```
rork-ai-builder/
├── apps/
│   └── web/                       # Next.js web application
│       └── src/
│           ├── app/               # App Router pages & API routes
│           │   ├── api/agent/     # AI agent SSE endpoint
│           │   ├── api/projects/  # Project CRUD + files + export
│           │   ├── (auth)/        # Login, signup
│           │   ├── dashboard/     # Projects list, settings
│           │   └── editor/        # Main editor page
│           ├── components/
│           │   ├── editor/        # ChatPanel, PreviewPanel, CodePanel, FileTree, etc.
│           │   ├── landing/       # HeroPromptBox
│           │   └── dashboard/     # ProjectCard, PendingPromptHandler
│           ├── stores/            # Zustand stores (projectStore, agentStore)
│           ├── hooks/             # useAutoSave
│           └── lib/               # Supabase client/server, language utils
├── packages/
│   └── ai-engine/                 # AI providers, agent, system prompts
│       └── src/
│           ├── providers/         # GeminiProvider, ClaudeProvider
│           ├── prompts/           # System prompts (5 modules for Expo SDK 54)
│           ├── agent.ts           # RorkAgent (11-tool agentic loop)
│           └── tools/             # Tool definitions
├── supabase/
│   └── schema.sql                 # Full Postgres schema
├── vercel.json                    # Vercel monorepo config
├── turbo.json                     # Turborepo config
└── CLAUDE.md                      # Full project context for AI sessions
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account
- Gemini API key (free tier works) and/or Claude API key

### Installation

```bash
git clone https://github.com/ungden/rork-ai-builder.git
cd rork-ai-builder
pnpm install
```

### Environment Variables

Create `apps/web/.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI — at least one required
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-claude-key   # optional
```

### Database Setup

1. Go to your Supabase dashboard → SQL Editor
2. Run the schema from `supabase/schema.sql`

### Run

```bash
pnpm dev        # Start dev server (http://localhost:3000)
pnpm build:web  # Production build
```

## Deployment (Vercel)

The repo is configured for Vercel monorepo deployment:

- **Build Command**: `pnpm build:web`
- **Output Directory**: `apps/web/.next`
- **Max Duration**: 300s (for agent API route)
- **Environment Variables**: Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` in Vercel dashboard

See `vercel.json` for full config.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/agent/run` | POST | AI agent SSE endpoint (Gemini/Claude) |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Project CRUD |
| `/api/projects/[id]/files` | GET, PUT | File operations |
| `/api/projects/[id]/export` | GET | Download as ZIP |
| `/api/settings` | GET, PUT | User settings |
| `/api/github/sync` | POST | Push to GitHub |
| `/api/eas/build` | POST | Generate EAS build config |
| `/api/demo/generate` | POST | Demo mode generation |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Command palette |
| `Cmd+S` | Save all files |

## Acknowledgments

- Inspired by [Rork](https://rork.com)
- Built with [Expo](https://expo.dev) and [Snack SDK](https://github.com/expo/snack)
- AI powered by [Gemini](https://ai.google.dev) and [Claude](https://anthropic.com)

## License

MIT
