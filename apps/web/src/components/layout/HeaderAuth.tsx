import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogOut } from 'lucide-react';

export async function HeaderAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const initials =
      (user.user_metadata?.full_name as string | undefined)
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || user.email?.[0].toUpperCase() || '?';

    return (
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
            {initials}
          </div>
          <span className="max-w-[120px] truncate text-xs text-muted-foreground hidden sm:inline-block">
            {user.email}
          </span>
        </div>
        <form action="/auth/signout" method="post">
          <button 
            type="submit" 
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" 
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-accent hover:text-white">
        Sign in
      </Link>
      <Link href="/signup" className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200">
        Start
      </Link>
    </div>
  );
}
