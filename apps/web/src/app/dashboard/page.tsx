import Link from 'next/link';
import { Sparkles, Zap, Folder, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CreateProjectButton } from '@/components/dashboard/CreateProjectButton';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  const hasProjects = projects && projects.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasProjects ? `${projects.length} project${projects.length === 1 ? '' : 's'}` : 'Build your first mobile app'}
          </p>
        </div>
        <CreateProjectButton />
      </div>

      {/* Quick start cards — only when empty */}
      {!hasProjects && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/demo"
            className="group p-5 rounded-xl border border-border bg-card hover:border-foreground/10 hover:bg-secondary transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="font-medium text-sm mb-1">Try demo</div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              See AI app generation in action without an account
            </p>
            <span className="text-xs text-violet-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
              Open demo <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-medium text-sm mb-1">Quick start</div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Describe your app idea — AI generates it in seconds
            </p>
            <CreateProjectButton variant="secondary" />
          </div>

          <div className="p-5 rounded-xl border border-dashed border-border bg-secondary opacity-60">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mb-3">
              <Folder className="w-4 h-4 text-blue-400" />
            </div>
            <div className="font-medium text-sm mb-1">Templates</div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Start from a pre-built app template
            </p>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {hasProjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <Folder className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-semibold mb-1">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first app to get started
          </p>
          <CreateProjectButton />
        </div>
      )}
    </div>
  );
}
