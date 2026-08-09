'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: React.ReactNode;
  to?: string;
  href?: string;
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** Toggle to show Home as the first crumb. */
  showHome?: boolean;
  /** Optional; only a configured with an image header when set. */
  separator?: React.ReactNode;
  /**
   * When provided, renders the crumbs over a full-width background image.
   * When omitted, renders the plain inline trail without an image.
   */
  backgroundImage?: string;
  /** Optional hero title shown above the crumbs when backgroundImage is set. */
  heading?: React.ReactNode;
}

export function Breadcrumbs({
  items,
  showHome = true,
  separator = <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />,
  backgroundImage,
  heading,
  className,
  ...props
}: BreadcrumbsProps) {
  const crumbs = showHome ? [{ label: 'Home', to: '/' }, ...items] : items;

  const trail = (dark: boolean) => (
    <nav
      aria-label="Breadcrumb"
      className={cn('inline-flex flex-wrap items-center gap-1.5 text-sm', className)}
      {...props}
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const base = cn(
          'flex items-center gap-1.5',
          dark ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-brand'
        );

        const node = isLast ? (
          <span
            aria-current="page"
            className={cn(
              'flex items-center gap-1.5 font-semibold',
              dark ? 'text-white' : 'text-foreground'
            )}
          >
            {i === 0 && showHome && <Home className="h-3.5 w-3.5" />}
            {crumb.label}
          </span>
        ) : crumb.to ? (
          <Link href={crumb.to} className={base}>
            {i === 0 && showHome && <Home className="h-3.5 w-3.5" />}
            {crumb.label}
          </Link>
        ) : (
          <a href={crumb.href} className={base}>
            {i === 0 && showHome && <Home className="h-3.5 w-3.5" />}
            {crumb.label}
          </a>
        );

        return (
          <React.Fragment key={i}>
            {i > 0 && separator}
            {node}
          </React.Fragment>
        );
      })}
    </nav>
  );

  if (backgroundImage) {
    return (
      <div className="relative overflow-hidden bg-ink-950">
        <img
          src={backgroundImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-ink-950/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/40" />
        <div className="container-lux relative pt-8 pb-20 lg:pb-24">
          {heading && (
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              {heading}
            </h1>
          )}
          {trail(true)}
        </div>
      </div>
    );
  }

  return trail(false);
}