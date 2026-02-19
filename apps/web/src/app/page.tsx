import Link from 'next/link';
import { ArrowRight, Sparkles, Smartphone, Github, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl">Rork</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>AI-Powered Mobile App Builder</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Build mobile apps with
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> AI </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your app in natural language and watch it come to life. 
            Generate React Native code, preview instantly, and deploy to app stores.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <div className="p-6 bg-muted rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">AI Code Generation</h3>
            <p className="text-sm text-muted-foreground">
              Describe features in plain English. Our AI generates production-ready React Native code.
            </p>
          </div>
          
          <div className="p-6 bg-muted rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Live Preview</h3>
            <p className="text-sm text-muted-foreground">
              See changes instantly in the browser or scan QR code to test on your real device.
            </p>
          </div>
          
          <div className="p-6 bg-muted rounded-xl border border-border">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">One-Click Deploy</h3>
            <p className="text-sm text-muted-foreground">
              Export code to GitHub and build for iOS & Android with EAS Build integration.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>Built with Claude & Gemini</span>
          <Link 
            href="https://github.com" 
            target="_blank"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
