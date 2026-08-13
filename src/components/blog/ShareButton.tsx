'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';

export function ClientShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or sharing unavailable — fall through to copy.
      }
    }
    handleCopy();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-300 hover:border-brand/40 hover:text-brand active:scale-90"
        title="Share article"
        aria-label="Share article"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-brand/40 hover:text-brand active:scale-95"
        title="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-green" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
