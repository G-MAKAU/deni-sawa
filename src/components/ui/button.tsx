'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-[15px] font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary — solid brand orange, white text
        default:
          'bg-brand text-white shadow-brand hover:bg-brand-600 active:bg-brand-700',
        // Secondary — green outline, green text, fill on hover
        secondary:
          'border-2 border-growth bg-transparent text-growth hover:bg-growth hover:text-white',
        // Ghost — transparent with white border/text, for dark sections
        ghost:
          'border border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10',
        // Outline — subtle neutral border
        outline:
          'border border-foreground/15 bg-transparent text-foreground hover:border-brand hover:text-brand',
        ghostLight: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-10 px-5 text-sm',
        lg: 'h-[52px] px-8 text-base',
        xl: 'h-[60px] px-10 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
