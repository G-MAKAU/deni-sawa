import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CTASectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** 'light' = white section; 'dark' = navy section */
  variant?: 'light' | 'dark';
  className?: string;
}

export function CTASection({
  title = 'Ready to Start?',
  subtitle = 'Take the first step. One conversation can change the direction of your business.',
  primary = { label: 'Start Your Assessment', href: '/business-health-checks#choose-your-assessment' },
  secondary = { label: 'Book a Clarity Call', href: '/contact' },
  variant = 'light',
  className,
}: CTASectionProps) {
  return (
    <section className={cn('section-pad', variant === 'light' ? 'bg-background' : 'bg-navy hero-pattern', className)}>
      <div className="container-lux">
        <Reveal className="flex flex-col items-center gap-6 text-center">
          <h2 className={cn('text-h2 font-semibold', variant === 'dark' ? 'text-white' : 'text-foreground')}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn('max-w-xl text-lg leading-relaxed', variant === 'dark' ? 'text-white/65' : 'text-muted-foreground')}>
              {subtitle}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
