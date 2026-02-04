'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Folder, Clock, MoreVertical, Trash2, ExternalLink, Loader2 } from 'lucide-react';

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
      <div className="group relative bg-[#18181b] border border-[#27272a] rounded-2xl hover:border-[#3f3f46] hover:shadow-lg hover:shadow-black/20 transition-all duration-200 overflow-hidden">
        <Link href={`/editor/${project.id}`} className="block p-5">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Folder className="w-6 h-6 text-white" />
          </div>
          
          {/* Title */}
          <h3 className="font-bold text-[15px] text-white mb-1.5 truncate">{project.name}</h3>
          
          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
            {project.description || 'No description'}
          </p>
          
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5" />
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
          className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#27272a] rounded-lg transition-all"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute top-12 right-4 z-20 bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl py-1 min-w-[150px] overflow-hidden">
              <Link
                href={`/editor/${project.id}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#18181b] transition-colors"
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
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-[#0a0a0a] border border-[#27272a] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Delete Project</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-[#27272a] text-gray-300 rounded-xl font-medium hover:bg-[#18181b] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
