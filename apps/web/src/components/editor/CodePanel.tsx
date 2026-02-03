'use client';

import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { X, Circle } from 'lucide-react';

// Dynamic import Monaco to avoid SSR issues
const Editor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a] text-gray-500">
        Loading editor...
      </div>
    ),
  }
);

interface CodePanelProps {
  projectId: string;
}

export function CodePanel({ projectId }: CodePanelProps) {
  const { activeFile, files, updateFile, setActiveFile } = useProjectStore();
  
  const file = activeFile ? files[activeFile] : null;
  
  // Get all open files (for tabs)
  const openFiles = Object.values(files).slice(0, 5); // Limit to 5 tabs
  
  if (!file) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        <div className="h-10 border-b border-[#27272a]" />
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="mb-2">No file selected</p>
            <p className="text-sm">Select a file from the explorer to edit</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Tabs */}
      <div className="h-10 border-b border-[#27272a] flex items-center overflow-x-auto custom-scrollbar">
        {openFiles.map((f) => {
          const isActive = f.path === activeFile;
          const fileName = f.path.split('/').pop();
          
          return (
            <div
              key={f.path}
              onClick={() => setActiveFile(f.path)}
              className={`h-full flex items-center gap-2 px-3 border-r border-[#27272a] cursor-pointer group ${
                isActive 
                  ? 'bg-[#0a0a0a] text-white' 
                  : 'bg-[#18181b] text-gray-400 hover:text-gray-200'
              }`}
            >
              {f.isDirty && (
                <Circle size={8} className="fill-current text-blue-400" />
              )}
              <span className="text-[13px] whitespace-nowrap">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Could implement close tab logic here
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#27272a] rounded"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          language={file.language}
          value={file.content}
          onChange={(value) => {
            if (value !== undefined && activeFile) {
              updateFile(activeFile, value);
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 8 },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
