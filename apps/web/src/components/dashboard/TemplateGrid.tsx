'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  CloudSun,
  Dumbbell,
  ChefHat,
  Wallet,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { APP_TEMPLATES, TEMPLATE_CATEGORIES, type AppTemplate } from '@/lib/templates';

const ICON_MAP: Record<string, React.ElementType> = {
  CheckSquare,
  CloudSun,
  Dumbbell,
  ChefHat,
  Wallet,
  FileText,
};

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; hover: string }> = {
  emerald: {
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    hover: 'hover:border-emerald-400/50',
  },
  sky: {
    border: 'border-sky-400/30',
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
    hover: 'hover:border-sky-400/50',
  },
  orange: {
    border: 'border-orange-400/30',
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
    hover: 'hover:border-orange-400/50',
  },
  amber: {
    border: 'border-amber-400/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    hover: 'hover:border-amber-400/50',
  },
  violet: {
    border: 'border-violet-400/30',
    bg: 'bg-violet-500/10',
    text: 'text-violet-300',
    hover: 'hover:border-violet-400/50',
  },
  blue: {
    border: 'border-blue-400/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    hover: 'hover:border-blue-400/50',
  },
};

export function TemplateGrid() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered =
    activeCategory === 'all'
      ? APP_TEMPLATES
      : APP_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleSelectTemplate = async (template: AppTemplate) => {
    if (loadingId) return;
    setLoadingId(template.id);

    try {
      // Create project
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
        }),
      });

      if (!res.ok) {
        setLoadingId(null);
        return;
      }

      const { project } = await res.json();

      // Save prompt and agent mode for auto-send in editor
      sessionStorage.setItem('rork_pending_prompt', template.prompt);
      sessionStorage.setItem('rork_agent_mode', 'build');

      router.push(`/editor/${project.id}`);
    } catch {
      setLoadingId(null);
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Start from a template</h2>
        <div className="flex gap-1 rounded-full bg-secondary p-1">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((template) => {
          const Icon = ICON_MAP[template.icon] || FileText;
          const colors = COLOR_MAP[template.color] || COLOR_MAP.blue;
          const isLoading = loadingId === template.id;

          return (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              disabled={!!loadingId}
              className={`group relative rounded-2xl border ${colors.border} ${colors.hover} bg-card p-5 text-left transition-all disabled:opacity-60 ${
                isLoading ? '' : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${colors.border} ${colors.bg} ${colors.text}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold">{template.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
              <span
                className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors.bg} ${colors.text}`}
              >
                {template.category}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
