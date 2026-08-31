'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, ArrowRight, ArrowUpRight, Mail, Phone, Clock } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { navItems, site } from '@/data/site';
import { business } from '@/data/content';
import { socialLinks } from '@/components/SocialLinks';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function isActive(href: string | undefined, pathname: string): boolean {
  if (!href) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useScrollDirection(pathname?: string) {
  const [compact, setCompact] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    setCompact(false);
    lastY.current = window.scrollY;
  }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;

        // Near the top: always full navbar (no compact).
        if (y <= 60) {
          setCompact(false);
        } else {
          const delta = y - lastY.current;
          // Compact on meaningful downward scroll past 80px.
          if (delta > 6 && y > 80) setCompact(true);
          // Expand on any upward scroll.
          else if (delta < -6) setCompact(false);
        }

        lastY.current = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return compact;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[90] h-[2px] origin-left bg-gradient-to-r from-brand via-brand to-growth"
      style={{ scaleX }}
    />
  );
}

export function Navbar() {
  const pathname = usePathname();
  const compact = useScrollDirection(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const [lmsTip, setLmsTip] = useState(false);
  const lmsTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenDropdown(null);
    setMobileOpen(null);
    setLmsTip(false);
    if (lmsTipTimer.current) clearTimeout(lmsTipTimer.current);
  }, [pathname]);

  const showLmsTip = useCallback(() => {
    setLmsTip(true);
    if (lmsTipTimer.current) clearTimeout(lmsTipTimer.current);
    lmsTipTimer.current = setTimeout(() => setLmsTip(false), 2500);
  }, []);

  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 120);
  }, []);

  return (
    <>
      <ScrollProgress />

      <motion.header
        className={cn(
          'sticky top-0 z-[80] w-full transition-all duration-300 ease-out',
          compact
          ? 'border-b border-card-border bg-nav shadow-[0_1px_40px_rgba(0,0,0,0.06)]'
          : 'border-b border-transparent bg-nav/0'
        )}
        animate={{
          y: 0,
        }}
      >
        {/* Top contact bar — collapses on scroll */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            compact ? 'max-h-0 -translate-y-full opacity-0' : 'max-h-14 translate-y-0 opacity-100'
          )}
        >
          <div className="border-b border-card-border bg-background/95">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-2.5 text-sm text-muted-foreground">
                <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                  <a
                    href={`tel:${site.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 whitespace-nowrap transition-colors hover:text-brand"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="sm:inline">{site.phone}</span>
                  </a>
                  <span className="hidden h-4 w-px flex-shrink-0 bg-card-border sm:block" />
                  <a
                    href={`mailto:${business.email}`}
                    className="hidden min-w-0 items-center gap-2 transition-colors hover:text-brand sm:flex"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{business.email}</span>
                  </a>
                  <span className="hidden h-4 w-px flex-shrink-0 bg-card-border md:block" />
                  <span className="hidden items-center gap-2 whitespace-nowrap md:flex">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    Mon–Fri 8am–5pm
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3 sm:gap-4">
                  {socialLinks.map(({ name, href, icon: Icon, ariaLabel, hoverTextClass }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={ariaLabel}
                      className={cn('text-muted-foreground transition-colors', hoverTextClass)}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex h-20 items-center justify-between gap-6 lg:h-[76px]">
            <Logo size="lg" center fill={compact} tagline="Partners" showTagline={!compact} className="shrink-0" />

            <div className="hidden items-center gap-0.5 lg:flex">
              {navItems.map((item) => {
                if (item.children) {
                  const active = isActive(item.href, pathname);
                  const open = openDropdown === item.label;
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => handleDropdownEnter(item.label)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(open ? null : item.label)}
                        aria-expanded={open}
                        className={cn(
                          'group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium tracking-[-0.01em] transition-all duration-300',
                          active || open
                            ? 'text-brand'
                            : 'text-foreground/70 hover:text-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute inset-0 rounded-none transition-all duration-300',
                            active || open
                              ? 'bg-brand/[0.08] scale-100'
                              : 'bg-foreground/[0.04] scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                          )}
                        />
                        <span className="relative">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'relative h-3.5 w-3.5 transition-transform duration-300',
                            open && 'rotate-180'
                          )}
                          strokeWidth={2.2}
                        />
                      </button>

                      <AnimatePresence>
                        {open && (
                          <motion.div
                            className="absolute left-1/2 top-full -translate-x-1/2 pt-4"
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            onMouseEnter={() => handleDropdownEnter(item.label)}
                            onMouseLeave={handleDropdownLeave}
                          >
                            <div className="relative w-[420px] overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_32px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.02)]">
                              <div className="h-[2px] w-full bg-gradient-to-r from-brand via-brand/80 to-growth" />
                              <div className="p-2">
                                <Link
                                  href="/services"
                                  onClick={() => setOpenDropdown(null)}
                                  className="group mb-1 flex items-center justify-between gap-4 rounded-xl bg-brand/[0.06] px-4 py-3 transition-all duration-200 hover:bg-brand/10"
                                >
                                  <span className="flex flex-col gap-0.5">
                                    <span className="text-[14px] font-bold text-brand">All Services</span>
                                    <span className="text-[12px] leading-relaxed text-muted-foreground">
                                      Explore every pathway in one place
                                    </span>
                                  </span>
                                  <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-all duration-300 group-hover:scale-105">
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                  </span>
                                </Link>
                                {item.children.map((child, i) => {
                                  const childActive = isActive(child.href, pathname);
                                  return (
                                    <motion.div
                                      key={child.href}
                                      initial={{ opacity: 0, x: -6 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.04, duration: 0.2 }}
                                    >
                                      <Link
                                        href={child.href}
                                        onClick={() => setOpenDropdown(null)}
                                        className={cn(
                                          'group flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-all duration-200',
                                          childActive ? 'bg-brand/[0.08]' : 'hover:bg-bgalt'
                                        )}
                                      >
                                        <span className="flex flex-col gap-0.5">
                                          <span
                                            className={cn(
                                              'text-[14px] font-semibold transition-colors duration-200',
                                              childActive ? 'text-brand' : 'text-foreground group-hover:text-brand'
                                            )}
                                          >
                                            {child.label}
                                          </span>
                                          {child.description && (
                                            <span className="text-[12px] leading-relaxed text-muted-foreground">
                                              {child.description}
                                            </span>
                                          )}
                                        </span>
                                        <span className={cn(
                                          'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300',
                                          childActive
                                            ? 'bg-brand text-white'
                                            : 'border border-card-border text-muted-foreground group-hover:border-brand/40 group-hover:bg-brand group-hover:text-white'
                                        )}>
                                          <ArrowUpRight className="h-3.5 w-3.5" />
                                        </span>
                                      </Link>
                                    </motion.div>
                                  );
                                })}
                              </div>
                              <div className="border-t border-card-border bg-bgalt px-4 py-3.5">
                                <Link
                                  href="/contact"
                                  onClick={() => setOpenDropdown(null)}
                                  className="group inline-flex items-center gap-2 text-[13px] font-semibold text-brand transition-all hover:gap-3"
                                >
                                  Talk to an advisor
                                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.label}
                    href={item.href ?? '/'}
                    className={cn(
                      'group relative rounded-full px-4 py-2 text-[14px] font-medium tracking-[-0.01em] transition-all duration-300',
                      active ? 'text-brand' : 'text-foreground/70 hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-0 rounded-none transition-all duration-300',
                        active
                          ? 'bg-brand/[0.08] scale-100'
                          : 'bg-foreground/[0.04] scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                      )}
                    />
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {/* LMS Login — Phase 2 placeholder with "Coming Soon" tooltip */}
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={showLmsTip}
                  className="group inline-flex items-center gap-2 rounded-none border border-growth px-5 py-3 text-[12px] font-semibold text-growth transition-all duration-300 hover:bg-growth/10 active:scale-[0.97]"
                >
                  LMS Login
                </button>
                <span
                  className={cn(
                    'pointer-events-none absolute right-0 top-full mt-2 z-50 whitespace-nowrap rounded-md bg-[#2C2C2C] px-3.5 py-2 text-xs font-medium text-white shadow-soft-xl transition-all duration-200',
                    lmsTip ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                  )}
                >
                  Coming Soon — Learning Centre launching soon
                </span>
              </div>

              <Link
href="/business-health-checks#choose-your-assessment"
                className="group relative hidden overflow-hidden rounded-none bg-brand px-6 py-3 text-[12px] font-semibold text-white shadow-[0_2px_20px_rgba(232,81,10,0.3)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(232,81,10,0.45)] hover:brightness-110 active:scale-[0.97] md:inline-flex md:items-center md:gap-2"
              >
                <span className="relative z-10">Start Your Assessment</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-card-border bg-card text-foreground transition-all duration-200 hover:border-brand/50 hover:text-brand active:scale-95 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[100] lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex w-full max-w-[380px] flex-col bg-charcoal text-white transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <Logo color size="md" center tagline="Partners" />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 active:scale-95"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="flex flex-col gap-1">
              {navItems.map((item, i) => {
                const active = isActive(item.href, pathname);
                if (item.children) {
                  const expanded = mobileOpen === item.label;
                  return (
                    <div key={item.label} className="mb-1" style={{ transitionDelay: `${i * 40}ms` }}>
                      <button
                        type="button"
                        onClick={() => setMobileOpen(expanded ? null : item.label)}
                        aria-expanded={expanded}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-4 py-3 text-[14px] font-medium transition-colors',
                          active ? 'text-brand' : 'text-white/90 hover:bg-white/5'
                        )}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-white/40 transition-transform duration-200',
                            expanded && 'rotate-180'
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          'ml-4 flex flex-col gap-0.5 overflow-hidden border-l border-white/10 transition-all duration-300',
                          expanded ? 'max-h-[400px] pb-2 opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <Link
                          href="/services"
                          onClick={() => setDrawerOpen(false)}
                          className="mb-1 flex items-center justify-between rounded-md bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/25"
                        >
                          All Services
                          <ArrowRight className="h-3.5 w-3.5 text-brand" />
                        </Link>
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setDrawerOpen(false)}
                            className={cn(
                              'flex items-center justify-between rounded-md px-4 py-2.5 text-sm transition-colors hover:bg-white/5',
                              isActive(child.href, pathname) ? 'text-brand' : 'text-white/65'
                            )}
                          >
                            {child.label}
                            <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href ?? '/'}
                    onClick={() => setDrawerOpen(false)}
                    style={{ transitionDelay: `${i * 40}ms` }}
                    className={cn(
                      'rounded-md px-4 py-3 text-[14px] font-medium transition-colors',
                      active ? 'bg-brand/15 text-brand' : 'text-white/90 hover:bg-white/5'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="mb-4 space-y-2.5">
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-brand" />
                {site.email}
              </a>
              <a
                href={`tel:${site.phone}`}
                className="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-brand" />
                {site.phone}
              </a>
            </div>
            <Button asChild size="lg" className="w-full rounded-none">
              <Link href="/business-health-checks#choose-your-assessment" onClick={() => setDrawerOpen(false)}>
                Start Your Assessment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
