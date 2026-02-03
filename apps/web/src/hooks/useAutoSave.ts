import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useDebounce } from './useDebounce';

interface UseAutoSaveOptions {
  projectId: string;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({ projectId, delay = 2000, enabled = true }: UseAutoSaveOptions) {
  const { files } = useProjectStore();
  const lastSavedRef = useRef<Record<string, string>>({});
  const isSavingRef = useRef(false);

  // Debounce file changes
  const debouncedFiles = useDebounce(files, delay);

  const saveFiles = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    // Find changed files
    const changedFiles: Record<string, string> = {};
    for (const [path, file] of Object.entries(debouncedFiles)) {
      if (lastSavedRef.current[path] !== file.content) {
        changedFiles[path] = file.content;
      }
    }

    if (Object.keys(changedFiles).length === 0) return;

    isSavingRef.current = true;

    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: changedFiles }),
      });

      if (response.ok) {
        // Update last saved state
        for (const [path, content] of Object.entries(changedFiles)) {
          lastSavedRef.current[path] = content;
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [debouncedFiles, projectId, enabled]);

  useEffect(() => {
    saveFiles();
  }, [saveFiles]);

  // Initialize last saved state
  useEffect(() => {
    const initialState: Record<string, string> = {};
    for (const [path, file] of Object.entries(files)) {
      initialState[path] = file.content;
    }
    lastSavedRef.current = initialState;
  }, [projectId]); // Only on project change

  return { saveFiles };
}
