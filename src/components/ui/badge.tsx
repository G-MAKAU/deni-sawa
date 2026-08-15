'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-badge border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        // Solid brand orange
        brand: 'border-brand bg-brand text-white',
        // Solid green
        growth: 'border-growth bg-growth text-white',
        // Tinted orange
        default: 'border-brand/25 bg-brand/10 text-brand',
        // Tinted green
        success: 'border-growth/25 bg-growth/10 text-growth',
        outline: 'border-card-border text-foreground',
        muted: 'border-card-border bg-bgalt text-muted-foreground',
        soon: 'border-card-border bg-bgalt text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
