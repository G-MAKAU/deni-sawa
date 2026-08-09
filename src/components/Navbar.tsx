'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Mail, Clock, ArrowRight, Calendar, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useScrollProgress } from '@/lib/hooks';
import { navLinks, business } from '@/data/content';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { scrolled } = useScrollProgress();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isNavActive = (link: { href: string }) =>
    link.href.startsWith('/') && pathname === link.href;

  return (
    <header className="fixed top-0 left-0 right-0 z-[80]">
      {/* Top utility bar */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          scrolled ? 'max-h-0 opacity-0 -translate-y-2' : 'max-h-14 opacity-100 translate-y-0'
        )}
      >
        <div className="border-b border-border bg-background/95">
          <div className="container-lux">
            <div className="flex items-center justify-between py-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 whitespace-nowrap transition-colors hover:text-brand">
                  <Phone className="h-4 w-4 flex-shrink-0" /><span className=" xs:inline sm:inline">{business.phone}</span>
                </a>
                <span className="hidden sm:block h-4 w-px bg-border flex-shrink-0" />
                <a href={`mailto:${business.email}`} className="hidden min-w-0 items-center gap-2 transition-colors hover:text-brand sm:flex">
                  <Mail className="h-4 w-4 flex-shrink-0" /><span className="truncate">{business.email}</span>
                </a>
                <span className="hidden md:block h-4 w-px bg-border flex-shrink-0" />
                <span className="hidden whitespace-nowrap md:flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />Mon–Fri 8am–5pm
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-brand"><Facebook className="h-5 w-5" /></a>
                <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-green"><Instagram className="h-5 w-5" /></a>
                <a href={business.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-brand"><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav bar */}
      <div
        className={cn(
          'border-b transition-all duration-300 ease-out',
          scrolled
            ? 'border-border bg-accent/95 dark:bg-background/95 shadow-soft-md'
            : 'border-transparent bg-background/95 dark:bg-background/95'
        )}
      >
        <div className="container-lux">
          <nav className={cn('relative flex items-center justify-between gap-2 transition-[padding,height] duration-300 ease-out', scrolled ? 'h-16 py-0' : 'py-4')}>
            {/* Logo — enlarged, elegant, fixed size never shrinks */}
            <Link href="/" className={cn('flex flex-col items-center group flex-shrink-0', scrolled ? 'self-stretch gap-0' : 'gap-1')}><div
              className={cn(
                'flex flex-shrink-0 items-center justify-center bg-gradient-to-br bg-brand shadow-brand-sm ring-1 ring-inset ring-white/20 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-brand-glow',
                scrolled
                  ? 'px-11 h-full'
                  : 'sm:px-7 py-2.5 md:px-12 sm:py-3'
              )}
            >
              <img src={business.logo} alt="Deni Sawa" className={cn('w-auto object-contain brightness-0 invert transition-all duration-300 ease-out', scrolled ? 'h-11' : 'h-17 sm:h-16')} decoding="async" />
            </div>
              <span className={cn('hidden overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-brand transition-all duration-300 ease-out sm:block', scrolled ? 'max-h-0 opacity-0 scale-90' : 'max-h-5 opacity-100')}>Debt Management</span>
            </Link>

            {/* Desktop nav — absolutely centered so logo width never shifts it */}
            <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
              <div className="flex items-center gap-0.5 pointer-events-auto">
                {navLinks.map((link) => {
                  const isActive = link.active && isNavActive(link);
                  const linkClasses = cn(
                    'relative rounded-full px-3.5 py-2 text-base font-medium font-bold transition-all duration-300',
                    link.active
                      ? isActive
                        ? 'text-white bg-brand shadow-brand-sm'
                        : 'text-foreground/80 hover:text-brand hover:bg-brand/10'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  );
                  const linkInner = (
                    <span className="flex items-center gap-1.5">
                      {link.label}
                      {!link.active && <Badge variant="soon" className="px-1.5 py-0 text-[8px]">Soon</Badge>}
                    </span>
                  );
                  return link.href.startsWith('/') ? (
                    <Link key={link.label} href={link.href} className={linkClasses}>
                      {linkInner}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.active ? link.href : undefined}
                      className={linkClasses}
                    >
                      {linkInner}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Right side  */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <ThemeToggle className="h-9 w-9" />
              <a href="#contact" className="btn-brand text-sm whitespace-nowrap !px-5 !py-2.5">
                <Calendar className="h-4 w-4" />
                <span className="hidden xl:inline">Schedule Consultation</span>
                <span className="xl:hidden">Schedule Now</span>
              </a>
            </div>

            {/* Mobile toggle */}
            <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
              <ThemeToggle className="h-9 w-9" />
              <button
                onClick={() => setOpen(!open)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all duration-300 active:scale-90"
                aria-label="Toggle menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 top-0 z-[60] transition-all duration-500',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-background/85" onClick={() => setOpen(false)} />
        <div
          className={cn(
            'absolute top-20 left-4 right-4 rounded-4xl border border-border bg-card shadow-soft-xl transition-all duration-500',
            open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          )}
        >
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-foreground transition-all duration-300 hover:bg-brand hover:text-white active:scale-90"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {navLinks.map((link, i) => {
                const isActive = link.active && isNavActive(link);
                const linkClasses = cn(
                  'flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300',
                  link.active
                    ? isActive
                      ? 'text-white bg-brand shadow-brand-sm'
                      : 'text-foreground bg-muted/50 hover:bg-brand/10 hover:text-brand'
                    : 'text-muted-foreground cursor-not-allowed'
                );
                const linkInner = (
                  <>
                    <span className="flex items-center gap-2.5">
                      <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', isActive ? 'bg-white/25 text-white' : link.active ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground')}>
                        {i + 1}
                      </span>
                      {link.label}
                      {!link.active && <Badge variant="soon" className="px-1.5 py-0 text-[8px]">Soon</Badge>}
                    </span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                    {link.active && !isActive && <ArrowRight className="h-4 w-4 text-brand" />}
                  </>
                );
                return link.href.startsWith('/') ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => link.active && setOpen(false)}
                    className={linkClasses}
                    style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
                  >
                    {linkInner}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.active ? link.href : undefined}
                    onClick={() => link.active && setOpen(false)}
                    className={linkClasses}
                    style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
                  >
                    {linkInner}
                  </a>
                );
              })}
            </div>
            <div className="my-4 h-px bg-border" />
            <div className="flex flex-col gap-3">
              <a href="#contact" onClick={() => setOpen(false)} className="btn btn-brand rounded-none w-full">
                <Calendar className="h-4 w-4" />Schedule Consultation
              </a>
              <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="btn-ghost-light w-full">
                <Phone className="h-4 w-4" />{business.phone}
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <a href={`mailto:${business.email}`} className="text-xs text-muted-foreground hover:text-brand transition-colors">{business.email}</a>
              <div className="flex items-center gap-3">
                <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand transition-colors"><Facebook className="h-4 w-4" /></a>
                <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green transition-colors"><Instagram className="h-4 w-4" /></a>
                <a href={business.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand transition-colors"><Linkedin className="h-4 w-4" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
