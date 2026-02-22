'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.sync.trigger();
    } catch {
      // ignore
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <div />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
          Sync
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg border border-input bg-background p-2 hover:bg-accent"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
