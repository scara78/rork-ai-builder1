import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07080a',
        foreground: '#f3f4f6',
        border: '#20232b',
        muted: {
          DEFAULT: '#0f1116',
          foreground: '#9ca3af',
        },
        primary: {
          DEFAULT: '#f3f4f6',
          foreground: '#080a0e',
        },
        secondary: {
          DEFAULT: '#141824',
          foreground: '#f3f4f6',
        },
        accent: {
          DEFAULT: '#1a2030',
          foreground: '#f3f4f6',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#0d1017',
          foreground: '#f3f4f6',
        },
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'IBM Plex Mono'", "'JetBrains Mono'", 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
