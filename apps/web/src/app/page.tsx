import Link from 'next/link';
import { ArrowRight, Sparkles, Smartphone, Zap, Github, Code2, Play, GitBranch } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">Rork</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 text-sm font-medium bg-white text-black rounded-md hover:bg-white/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted text-xs text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Powered by Claude &amp; Gemini
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Build mobile apps
            <br />
            <span className="text-white/40">with a single prompt</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Describe your app idea. Rork&apos;s AI agent writes the code,
            previews it live, and deploys to iOS &amp; Android.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
            >
              Start building free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Try demo
            </Link>
          </div>
        </section>

        {/* ── Preview mockup ──────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-24">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/60">
            {/* Editor chrome */}
            <div className="h-10 border-b border-border bg-background flex items-center px-4 gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="h-6 w-48 rounded-md bg-muted border border-border" />
              </div>
            </div>
            {/* Editor body */}
            <div className="grid grid-cols-[260px_1fr_280px] h-[340px]">
              {/* Chat */}
              <div className="border-r border-border p-4 flex flex-col gap-3">
                <div className="flex justify-end">
                  <div className="bg-secondary rounded-xl rounded-tr-sm px-3 py-2 text-xs text-muted-foreground max-w-[180px]">
                    Build me a habit tracker with streaks
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-white flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-black" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="h-2 w-32 rounded bg-border" />
                    <div className="h-2 w-24 rounded bg-border" />
                    <div className="h-2 w-28 rounded bg-border" />
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-9 rounded-lg bg-muted border border-border" />
                </div>
              </div>
              {/* Code */}
              <div className="border-r border-border p-4 font-mono text-[11px] text-muted-foreground overflow-hidden">
                <div className="flex gap-3 mb-3">
                  {['_layout.tsx', 'index.tsx', 'habits.tsx'].map((f, i) => (
                    <span key={f} className={`text-xs pb-1 ${i === 0 ? 'text-foreground border-b border-white' : ''}`}>{f}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 opacity-60">
                  {['import { Tabs } from \'expo-router\';', 'import { HabitCard } from \'@/components\';', '', 'export default function Layout() {', '  return (', '    <Tabs screenOptions={{', '      tabBarStyle: styles.tab,', '    }}>'].map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-border w-4 text-right flex-shrink-0">{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Preview phone */}
              <div className="flex items-center justify-center bg-muted p-4">
                <div className="w-[120px] h-[220px] rounded-[20px] border-2 border-border bg-background overflow-hidden shadow-xl relative">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-border" />
                  <div className="mt-8 px-2 flex flex-col gap-2">
                    {['Run', 'Read', 'Exercise', 'Meditate'].map((h, i) => (
                      <div key={h} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-card border border-border">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${i < 2 ? 'bg-green-500/30 border border-green-500/50' : 'border border-border'}`} />
                        <span className="text-[9px] text-foreground">{h}</span>
                        {i < 2 && <span className="ml-auto text-[8px] text-green-400">🔥 {7 - i}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 mb-24">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <Code2 className="w-5 h-5" />,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10 border-blue-500/20',
                title: 'AI code generation',
                desc: 'Full Expo SDK 54 apps written by Claude or Gemini. Screens, navigation, state — all of it.',
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'Instant live preview',
                desc: 'See your app in the browser. Scan a QR code to run it on your real device via Expo Go.',
              },
              {
                icon: <GitBranch className="w-5 h-5" />,
                color: 'text-violet-400',
                bg: 'bg-violet-500/10 border-violet-500/20',
                title: 'Deploy anywhere',
                desc: 'Push to GitHub automatically. Trigger EAS builds for iOS & Android with one click.',
              },
            ].map(({ icon, color, bg, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${bg} ${color}`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-[15px] mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 mb-24">
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto mb-5">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Ready to build?</h2>
            <p className="text-muted-foreground mb-7 max-w-md mx-auto">
              Join developers shipping mobile apps in minutes, not months.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-black" />
            </div>
            <span>Rork</span>
          </div>
          <a
            href="https://github.com/ungden/rork-ai-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}
