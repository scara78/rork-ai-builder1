import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rork - AI Mobile App Builder',
  description: 'Build mobile apps with AI using natural language',
  keywords: ['mobile app', 'AI', 'react native', 'expo', 'no-code'],
  authors: [{ name: 'Rork' }],
  openGraph: {
    title: 'Rork - AI Mobile App Builder',
    description: 'Build mobile apps with AI using natural language',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
