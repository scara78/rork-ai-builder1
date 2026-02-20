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
  const openFiles = Object.values(files);

  const handleCloseTab = (closedPath: string) => {
    // Activate the nearest other open file
    const others = openFiles.filter(f => f.path !== closedPath);
    if (closedPath === activeFile) {
      if (others.length > 0) {
        setActiveFile(others[0].path);
      } else {
        setActiveFile(null);
      }
    }
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
    });
    
    // Disable semantic validation since we don't have node_modules loaded
    // This stops it from complaining about missing imports like 'react-native'
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Tabs */}
      <div className="h-10 border-b border-[#27272a] flex items-center overflow-x-auto custom-scrollbar flex-shrink-0">
        {openFiles.map((f) => {
          const isActive = f.path === activeFile;
          const fileName = f.path.split('/').pop();
          
          return (
            <div
              key={f.path}
              onClick={() => setActiveFile(f.path)}
              className={`h-full flex items-center gap-2 px-3 border-r border-[#27272a] cursor-pointer group flex-shrink-0 transition-colors ${
                isActive 
                  ? 'bg-[#1e1e21] text-white border-b-2 border-b-blue-500' 
                  : 'bg-[#18181b] text-gray-400 hover:bg-[#27272a] hover:text-gray-200'
              }`}
            >
              {f.isDirty && (
                <Circle size={8} className="fill-current text-blue-400" />
              )}
              <span className="text-[13px] whitespace-nowrap">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(f.path);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#3f3f46] rounded text-gray-400 hover:text-white transition-all"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Editor Container */}
      <div className="flex-1 relative">
        {/* Empty State */}
        {!file && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a] text-gray-500">
            <div className="text-center">
              <p className="mb-2">No file selected</p>
              <p className="text-sm">Select a file from the explorer to edit</p>
            </div>
          </div>
        )}
        
        {/* Editor (Always mounted, just hidden when no file) */}
        <div className="h-full w-full" style={{ display: file ? 'block' : 'none' }}>
          <Editor
            height="100%"
            theme="vs-dark"
            language={file?.language || 'typescript'}
            value={file?.content || ''}
            path={file?.path} // Important for Monaco to maintain state per file
            beforeMount={handleEditorWillMount}
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
    </div>
  );
}
