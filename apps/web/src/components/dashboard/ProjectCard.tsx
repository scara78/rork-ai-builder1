'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Folder, Clock, MoreVertical, Trash2, Pencil, ExternalLink, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setShowMenu(false);
    }
  };
  
  return (
    <>
      <div className="group relative p-4 bg-muted border border-border rounded-xl hover:border-accent transition-colors">
        <Link href={`/editor/${project.id}`} className="block">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Folder className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h3 className="font-semibold mb-1">{project.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {project.description || 'No description'}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
        
        {/* Menu Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-4 right-4 p-1 opacity-0 group-hover:opacity-100 hover:bg-accent rounded transition-all"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-12 right-4 z-10 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            <Link
              href={`/editor/${project.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-background border border-border rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
