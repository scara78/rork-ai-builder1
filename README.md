# Rork AI Mobile App Builder Clone

An AI-powered no-code platform for building React Native mobile apps from natural language descriptions.

## Features

- **AI Code Generation**: Generate complete React Native/Expo code using Claude or Gemini
- **Live Preview**: See changes instantly in the browser or on your device via Expo Go
- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **File Management**: Create, edit, delete files with VS Code-like file tree
- **Command Palette**: Quick access to all features with Cmd+K
- **GitHub Sync**: Push your project to GitHub with one click
- **Code Export**: Download your project as a ZIP file
- **Settings Page**: Manage preferences, theme, and integrations
- **Authentication**: Email/password and OAuth (Google, GitHub) via Supabase

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Claude (Anthropic), Gemini (Google)
- **Preview**: Expo, WebSocket, Docker
- **State Management**: Zustand with Immer
- **Build System**: Turborepo, pnpm

## Project Structure

```
rork-ai-builder/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages & API routes
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── lib/           # Utility libraries
│   │   │   └── stores/        # Zustand state management
│   │   └── ...
├── packages/
│   ├── ai-engine/              # AI providers and prompts
│   ├── expo-template/          # Base Expo project template
│   └── shared/                 # Shared types and utilities
├── supabase/                   # Database schema
└── turbo.json                  # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account
- Claude API key and/or Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ungden/rork-ai-builder.git
   cd rork-ai-builder
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # AI APIs
   ANTHROPIC_API_KEY=your-claude-api-key
   GEMINI_API_KEY=your-gemini-api-key

   # Preview Server (optional)
   NEXT_PUBLIC_PREVIEW_SERVER_URL=http://localhost:3001
   ```

4. Set up the database:
   - Go to your Supabase dashboard
   - Open the SQL Editor
   - Run the schema from `supabase/schema.sql`

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

Preview runs in-browser via `snack-sdk`; no standalone preview server package is required.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Cmd+S` / `Ctrl+S` | Save all files |
| `Cmd+P` / `Ctrl+P` | Quick file open |

## Available Scripts

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:web          # Start only the web app
pnpm dev:preview      # Print preview migration note

# Build
pnpm build            # Build all packages
pnpm build:web        # Build only the web app

# Type checking
pnpm typecheck        # Type check all packages

# Linting
pnpm lint             # Lint all packages
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes* |
| `GEMINI_API_KEY` | Gemini API key | Yes* |
| `GOOGLE_AI_API_KEY` | Gemini API key (legacy alias) | Optional |
| `NEXT_PUBLIC_PREVIEW_SERVER_URL` | Preview server URL | No |

*At least one AI provider key is required.

## Deployment

### Vercel (Web App)

1. Push to GitHub
2. Import to Vercel
3. Set root directory to `apps/web`
4. Add environment variables
5. Deploy

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Project CRUD |
| `/api/projects/[id]/files` | PUT, POST, DELETE | File operations |
| `/api/projects/[id]/export` | GET | Download as ZIP |
| `/api/generate` | POST | AI code generation |
| `/api/generate/stream` | POST | Streaming AI generation |
| `/api/settings` | GET, PUT, DELETE | User settings |

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT

## Acknowledgments

- Inspired by [Rork](https://rork.com)
- Built with [Expo](https://expo.dev)
- AI powered by [Claude](https://anthropic.com) and [Gemini](https://ai.google.dev)
