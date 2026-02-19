'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, MoreVertical, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  created_at: string;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 6) return new Date(date).toLocaleDateString();
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// Deterministic gradient from project id
function projectGradient(id: string) {
  const gradients = [
    'from-blue-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-600',
    'from-violet-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-orange-600',
  ];
  const idx = id.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setShowMenu(false);
    }
  };

  const gradient = projectGradient(project.id);

  return (
    <>
      <div className="group relative bg-card border border-border rounded-xl hover:border-border/60 transition-all duration-150 overflow-hidden">
        <Link href={`/editor/${project.id}`} className="block p-5">
          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 text-white text-sm font-bold select-none`}>
            {project.name.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-sm text-foreground mb-1 truncate leading-snug">
            {project.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[32px] leading-relaxed">
            {project.description || 'No description'}
          </p>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(project.updated_at)}</span>
          </div>
        </Link>

        {/* Menu trigger */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Dropdown */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute top-10 right-3 z-20 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[140px] overflow-hidden animate-fade-in">
              <Link
                href={`/editor/${project.id}`}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open editor
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); setShowMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-slide-up">
            <h3 className="font-semibold mb-1">Delete project?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              &ldquo;{project.name}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
