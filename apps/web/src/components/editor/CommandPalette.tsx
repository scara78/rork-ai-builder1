'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  File, 
  Settings, 
  Download, 
  Github, 
  Play, 
  Save,
  FolderOpen,
  MessageSquare,
  Code,
  Moon,
  Sun,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface Command {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  category: 'file' | 'action' | 'navigation' | 'settings';
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  onSave?: () => void;
  onExport?: () => void;
  onGithubSync?: () => void;
  onPreview?: () => void;
}

export function CommandPalette({ 
  isOpen, 
  onClose, 
  projectId,
  onSave,
  onExport,
  onGithubSync,
  onPreview
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { files, setActiveFile, activeFile } = useProjectStore();

  // Build commands list
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];
    
    // File commands - search through project files
    Object.keys(files).forEach(path => {
      cmds.push({
        id: `file-${path}`,
        name: path.split('/').pop() || path,
        description: path,
        icon: <File size={16} className="text-blue-400" />,
        category: 'file',
        action: () => {
          setActiveFile(path);
          onClose();
        },
      });
    });
    
    // Action commands
    if (onSave) {
      cmds.push({
        id: 'save',
        name: 'Save All Files',
        description: 'Save all modified files to the server',
        icon: <Save size={16} className="text-green-400" />,
        category: 'action',
        shortcut: 'Cmd+S',
        action: () => { onSave(); onClose(); },
      });
    }
    
    if (onExport) {
      cmds.push({
        id: 'export',
        name: 'Export as ZIP',
        description: 'Download project as a ZIP file',
        icon: <Download size={16} className="text-purple-400" />,
        category: 'action',
        action: () => { onExport(); onClose(); },
      });
    }
    
    if (onGithubSync) {
      cmds.push({
        id: 'github-sync',
        name: 'Sync to GitHub',
        description: 'Push changes to GitHub repository',
        icon: <Github size={16} />,
        category: 'action',
        action: () => { onGithubSync(); onClose(); },
      });
    }
    
    if (onPreview) {
      cmds.push({
        id: 'preview',
        name: 'Open Preview',
        description: 'Preview app in Expo Go',
        icon: <Play size={16} className="text-green-400" />,
        category: 'action',
        action: () => { onPreview(); onClose(); },
      });
    }
    
    // Navigation commands
    cmds.push({
      id: 'goto-settings',
      name: 'Go to Settings',
      description: 'Open settings page',
      icon: <Settings size={16} className="text-gray-400" />,
      category: 'navigation',
      action: () => {
        window.location.href = '/settings';
      },
    });
    
    cmds.push({
      id: 'goto-dashboard',
      name: 'Go to Dashboard',
      description: 'View all projects',
      icon: <FolderOpen size={16} className="text-yellow-400" />,
      category: 'navigation',
      action: () => {
        window.location.href = '/';
      },
    });
    
    // Refresh command
    cmds.push({
      id: 'refresh',
      name: 'Refresh Preview',
      description: 'Reload the preview window',
      icon: <RefreshCw size={16} className="text-blue-400" />,
      category: 'action',
      action: () => {
        // Trigger preview refresh
        window.dispatchEvent(new CustomEvent('refresh-preview'));
        onClose();
      },
    });
    
    return cmds;
  }, [files, setActiveFile, onClose, onSave, onExport, onGithubSync, onPreview]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent/common commands first when no query
      return commands.slice(0, 10);
    }
    
    const q = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.name.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [commands, query]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryLabels: Record<string, string> = {
    file: 'Files',
    action: 'Actions',
    navigation: 'Navigation',
    settings: 'Settings',
  };

  let flatIndex = 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#27272a]">
          <Search size={18} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, commands..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
          <kbd className="px-2 py-0.5 text-[10px] text-gray-500 bg-[#27272a] rounded">ESC</kbd>
        </div>
        
        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-2 text-[11px] font-medium text-gray-500 uppercase tracking-wider bg-[#0a0a0a] sticky top-0">
                  {categoryLabels[category] || category}
                </div>
                {cmds.map((cmd) => {
                  const index = flatIndex++;
                  return (
                    <button
                      key={cmd.id}
                      data-index={index}
                      onClick={cmd.action}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === index
                          ? 'bg-[#27272a] text-white'
                          : 'text-gray-300 hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <span className="flex-shrink-0">{cmd.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{cmd.name}</div>
                        {cmd.description && (
                          <div className="text-xs text-gray-500 truncate">{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-0.5 text-[10px] text-gray-500 bg-[#1a1a1a] rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[#27272a] flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#27272a] rounded">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
