import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Rork — AI Mobile App Builder',
  description: 'Build mobile apps with AI. Describe your app in natural language, get production-ready React Native code instantly.',
  keywords: ['mobile app builder', 'AI', 'react native', 'expo', 'no-code', 'low-code'],
  authors: [{ name: 'Rork' }],
  openGraph: {
    title: 'Rork — AI Mobile App Builder',
    description: 'Build mobile apps with AI. Describe your app in natural language, get production-ready React Native code instantly.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
