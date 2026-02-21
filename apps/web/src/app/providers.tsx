'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { createClient } from '@/lib/supabase/client';

function AuthStateListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Reload on sign in or sign out to ensure server components pick up the new state
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthStateListener />
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
}
