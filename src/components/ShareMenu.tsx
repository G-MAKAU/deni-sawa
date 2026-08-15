'use client';

import { useState } from 'react';
import { Share2, Link2, Check, Mail, Send, MessageCircle } from 'lucide-react';
import { Facebook, Linkedin, Twitter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ShareMenuProps {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: 'icon' | 'pill';
}

/**
 * Elegant share menu for the most-used social platforms plus copy-link.
 * Used on blog articles and health check report pages.
 */
export function ShareMenu({
  url,
  title = '',
  text = '',
  className,
  variant = 'icon',
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const currentUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const encUrl = encodeURIComponent(currentUrl);
  const encTitle = encodeURIComponent(title);
  const encText = encodeURIComponent(text || title || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  const platforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    },
    {
      name: 'X',
      icon: Twitter,
      color: '#000000',
      href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      href: `https://wa.me/?text=${encText}%20${encUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: '#229ED9',
      href: `https://t.me/share/url?url=${encUrl}&text=${encText}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: '#64748B',
      href: `mailto:?subject=${encTitle}&body=${encText}%0A${encUrl}`,
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Share this page"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-border bg-card font-semibold text-muted-foreground transition-all duration-300 hover:border-brand/40 hover:text-brand active:scale-95',
            variant === 'pill' ? 'px-4 py-2.5 text-sm' : 'h-10 w-10 justify-center',
            className
          )}
        >
          <Share2 className="h-4 w-4" />
          {variant === 'pill' && 'Share'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Share this
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${platform.name}`}
              className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${platform.color}14`, color: platform.color }}
              >
                <platform.icon className="h-4 w-4" />
              </span>
              {platform.name}
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy link"
            className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors">
              {copied ? <Check className="h-4 w-4 text-green" /> : <Link2 className="h-4 w-4" />}
            </span>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
