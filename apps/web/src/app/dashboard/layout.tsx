import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const initials = (user.user_metadata?.full_name as string | undefined)
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || user.email?.[0].toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: '52px' }}>
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">Rork</span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard/settings"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* Avatar + email */}
            <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-foreground select-none">
                {initials}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block max-w-[160px] truncate">
                {user.email}
              </span>
            </div>

            <form action="/auth/signout" method="post" className="ml-1">
              <button
                type="submit"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
