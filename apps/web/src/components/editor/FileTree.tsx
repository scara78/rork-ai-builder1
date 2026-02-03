'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  Plus, 
  Trash2, 
  FolderPlus,
  FilePlus,
  X,
  Check
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  
  for (const path of paths) {
    const parts = path.split('/');
    let currentLevel = root;
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      
      let existing = currentLevel.find(n => n.name === part);
      
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }
      
      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }
  
  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined,
    }));
  };
  
  return sortNodes(root);
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return 'text-blue-400';
    case 'jsx':
    case 'js':
      return 'text-yellow-400';
    case 'json':
      return 'text-green-400';
    case 'css':
      return 'text-pink-400';
    case 'md':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

interface NewFileInputProps {
  type: 'file' | 'folder';
  parentPath: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  depth: number;
}

function NewFileInput({ type, parentPath, onSubmit, onCancel, depth }: NewFileInputProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    } else {
      onCancel();
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 py-1 px-2 bg-[#27272a]"
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {type === 'folder' ? (
        <Folder size={14} className="text-yellow-500/70" />
      ) : (
        <>
          <span className="w-[14px]" />
          <File size={14} className="text-gray-400" />
        </>
      )}
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={handleSubmit}
        placeholder={type === 'folder' ? 'folder name' : 'filename.tsx'}
        className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-500"
      />
    </div>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  node: TreeNode | null;
  onClose: () => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onDelete: (path: string, isFolder: boolean) => void;
}

function ContextMenu({ x, y, node, onClose, onNewFile, onNewFolder, onDelete }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const parentPath = node?.type === 'folder' ? node.path : 
    node?.path.split('/').slice(0, -1).join('/') || '';

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#1a1a1a] border border-[#27272a] rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => { onNewFile(parentPath); onClose(); }}
        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-[#27272a] flex items-center gap-2"
      >
        <FilePlus size={14} />
        New File
      </button>
      <button
        onClick={() => { onNewFolder(parentPath); onClose(); }}
        className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-[#27272a] flex items-center gap-2"
      >
        <FolderPlus size={14} />
        New Folder
      </button>
      {node && (
        <>
          <div className="h-px bg-[#27272a] my-1" />
          <button
            onClick={() => { onDelete(node.path, node.type === 'folder'); onClose(); }}
            className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-[#27272a] flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete {node.type === 'folder' ? 'Folder' : 'File'}
          </button>
        </>
      )}
    </div>
  );
}

export function FileTree() {
  const { files, activeFile, setActiveFile, createFile, deleteFile, projectId } = useProjectStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['app', 'components', 'app/(tabs)']));
  const [newItemState, setNewItemState] = useState<{
    type: 'file' | 'folder';
    parentPath: string;
    depth: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNode | null;
  } | null>(null);
  
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);
  
  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode | null) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleNewFile = (parentPath: string) => {
    const depth = parentPath ? parentPath.split('/').length : 0;
    setNewItemState({ type: 'file', parentPath, depth });
    if (parentPath) {
      setExpanded(prev => new Set([...Array.from(prev), parentPath]));
    }
  };

  const handleNewFolder = (parentPath: string) => {
    const depth = parentPath ? parentPath.split('/').length : 0;
    setNewItemState({ type: 'folder', parentPath, depth });
    if (parentPath) {
      setExpanded(prev => new Set([...Array.from(prev), parentPath]));
    }
  };

  const handleCreateItem = async (name: string) => {
    if (!newItemState) return;
    
    const path = newItemState.parentPath 
      ? `${newItemState.parentPath}/${name}` 
      : name;
    
    if (newItemState.type === 'file') {
      // Create file in store
      createFile(path, getDefaultContent(name));
      setActiveFile(path);
      
      // Save to backend
      if (projectId) {
        try {
          await fetch(`/api/projects/${projectId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content: getDefaultContent(name) }),
          });
        } catch (error) {
          console.error('Failed to create file:', error);
        }
      }
    } else {
      // For folders, create a placeholder file to show the folder
      const placeholderPath = `${path}/.gitkeep`;
      createFile(placeholderPath, '');
      setExpanded(prev => new Set([...Array.from(prev), path]));
    }
    
    setNewItemState(null);
  };

  const handleDeleteItem = async (path: string, isFolder: boolean) => {
    if (isFolder) {
      // Delete all files in the folder
      const filesToDelete = Object.keys(files).filter(f => f.startsWith(path + '/'));
      for (const file of filesToDelete) {
        deleteFile(file);
        if (projectId) {
          await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(file)}`, {
            method: 'DELETE',
          });
        }
      }
    } else {
      deleteFile(path);
      if (projectId) {
        await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
          method: 'DELETE',
        });
      }
    }
  };
  
  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expanded.has(node.path);
    const isActive = activeFile === node.path;
    
    return (
      <div key={node.path}>
        <div
          onClick={() => {
            if (node.type === 'folder') toggleExpand(node.path);
            else setActiveFile(node.path);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors ${
            isActive 
              ? 'bg-[#27272a] text-white' 
              : 'text-gray-400 hover:bg-[#27272a]/50 hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-500" />
              ) : (
                <ChevronRight size={14} className="text-gray-500" />
              )}
              <Folder size={14} className="text-yellow-500/70" />
            </>
          ) : (
            <>
              <span className="w-[14px]" />
              <File size={14} className={getFileIcon(node.name)} />
            </>
          )}
          <span className="text-[13px] truncate flex-1">{node.name}</span>
          
          {/* Hover actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            {node.type === 'folder' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNewFile(node.path); }}
                  className="p-0.5 hover:bg-[#3f3f46] rounded"
                  title="New File"
                >
                  <FilePlus size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNewFolder(node.path); }}
                  className="p-0.5 hover:bg-[#3f3f46] rounded"
                  title="New Folder"
                >
                  <FolderPlus size={12} />
                </button>
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteItem(node.path, node.type === 'folder'); }}
              className="p-0.5 hover:bg-red-500/20 rounded text-red-400"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && (
          <>
            {/* Show new item input if adding to this folder */}
            {newItemState && newItemState.parentPath === node.path && (
              <NewFileInput
                type={newItemState.type}
                parentPath={newItemState.parentPath}
                depth={depth + 1}
                onSubmit={handleCreateItem}
                onCancel={() => setNewItemState(null)}
              />
            )}
            {node.children?.map(child => renderNode(child, depth + 1))}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div 
      className="h-full flex flex-col bg-[#0a0a0a]"
      onContextMenu={(e) => {
        // Only show context menu if clicking on empty space
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.custom-scrollbar')) {
          handleContextMenu(e, null);
        }
      }}
    >
      <div className="h-10 border-b border-[#27272a] flex items-center justify-between px-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleNewFile('')}
            className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-gray-200"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button 
            onClick={() => handleNewFolder('')}
            className="p-1 hover:bg-[#27272a] rounded text-gray-400 hover:text-gray-200"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {/* Show new item input at root level */}
        {newItemState && newItemState.parentPath === '' && (
          <NewFileInput
            type={newItemState.type}
            parentPath=""
            depth={0}
            onSubmit={handleCreateItem}
            onCancel={() => setNewItemState(null)}
          />
        )}
        {tree.map(node => renderNode(node))}
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
}

function getDefaultContent(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'tsx':
      return `export default function Component() {
  return (
    <div>
      
    </div>
  );
}
`;
    case 'ts':
      return `export {};
`;
    case 'json':
      return `{
  
}
`;
    case 'css':
      return ``;
    default:
      return '';
  }
}
