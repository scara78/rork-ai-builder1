import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles, LogOut, Settings, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#27272a] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg text-white">Rork</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400 mr-1">
              <User className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            
            <Link 
              href="/dashboard/settings"
              className="p-2 text-gray-500 hover:text-white hover:bg-[#18181b] rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
            
            <form action="/auth/signout" method="post">
              <button 
                type="submit"
                className="p-2 text-gray-500 hover:text-white hover:bg-[#18181b] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
