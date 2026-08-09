'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all duration-300 hover:shadow-soft active:scale-90',
        className
      )}
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          'absolute h-5 w-5 text-brand transition-all duration-500',
          theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        )}
        strokeWidth={2}
      />
      <Moon
        className={cn(
          'absolute h-5 w-5 text-brand transition-all duration-500',
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
        strokeWidth={2}
      />
    </button>
  );
}
