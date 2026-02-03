'use client';

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load ExpoSnackPreview for better initial load
const ExpoSnackPreview = lazy(() => import('./ExpoSnackPreview'));

interface PreviewPanelProps {
  projectId: string;
}

export function PreviewPanel({ projectId }: PreviewPanelProps) {
  return (
    <div className="h-full w-full">
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-[#050505]">
          <div className="text-center text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p className="text-sm font-medium">Loading Expo preview...</p>
          </div>
        </div>
      }>
        <ExpoSnackPreview />
      </Suspense>
    </div>
  );
}
