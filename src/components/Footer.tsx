import Link from 'next/link';
import { ArrowUpRight, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { site } from '@/data/site';
import { socialLinks } from '@/components/SocialLinks';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { CookieSettingsButton } from '@/components/CookieSettingsButton';

const columns = [
  {
    title: 'Services',
    links: [
      { label: 'Professionals & Individuals', href: '/services/professionals' },
      { label: 'Entrepreneurs & Founders', href: '/services/entrepreneurs' },
      { label: 'Investors', href: '/services/investors' },
      { label: 'Business Health Checks', href: '/health-checks' },
      { label: 'Learning & Programs', href: '/services/learning' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Learning & Leadership', href: '/learning' },
      { label: 'Investors', href: '/investors' },
      { label: 'SpecialSit Network', href: '/about/specialsit-network' },
      { label: 'The Deni Sawa Method™', href: '/deni-sawa-method' },
      { label: 'Blog & Insights', href: '/about/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Leadership', href: '/about/leadership' },
      { label: 'Philosophy', href: '/about/philosophy' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-charcoal text-white">
      {/* Gradient accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-brand via-brand/60 to-growth" />

      {/* CTA Section */}
      <div className="relative border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.03] via-transparent to-growth/[0.02]" />
        <div className="container-lux relative">
          <div className="flex flex-col items-center justify-between gap-6 py-16 md:flex-row md:py-20">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Ready to transform your business?
              </h3>
              <p className="mt-3 text-base text-white/50">
                Start with a confidential assessment and discover your path to Best-in-Class.
              </p>
            </div>
            <Link
              href="/business-health-checks#choose-your-assessment"
              className="group inline-flex items-center gap-2.5 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_30px_rgba(232,81,10,0.35)] transition-all duration-300 hover:shadow-[0_6px_40px_rgba(232,81,10,0.5)] hover:brightness-110 active:scale-[0.97]"
            >
              Start Your Assessment
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container-lux">
        <div className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8 lg:py-20">
          {/* Brand column */}
          <div className="lg:col-span-2 lg:pr-12">
            <Logo color />
            <p className="mt-1 text-sm ml-8 font-semibold uppercase tracking-widest text-brand">
              Partners
            </p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/80">
              Senior-level advisory and fractional business support helping organisations move from
              Special Situations to Best-in-Class performance.
            </p>

            {/* Contact info */}
            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${site.email}`}
                className="group flex items-center gap-3 text-sm text-white/50 transition-colors hover:text-white"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] transition-all group-hover:border-brand/40 group-hover:bg-brand/10">
                  <Mail className="h-4 w-4 text-brand" />
                </div>
                {site.email}
              </a>
              <a
                href={`tel:${site.phone}`}
                className="group flex items-center gap-3 text-sm text-white/50 transition-colors hover:text-white"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] transition-all group-hover:border-brand/40 group-hover:bg-brand/10">
                  <Phone className="h-4 w-4 text-brand" />
                </div>
                {site.phone}
              </a>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
                  <MapPin className="h-4 w-4 text-brand" />
                </div>
                {site.address}
              </div>
            </div>

            {/* Social icons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {socialLinks.map(({ name, href, icon: Icon, ariaLabel, hoverClass }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className={cn(
                    'group flex h-11 w-11 items-center justify-center rounded-none border border-white/[0.08] bg-white/[0.02] text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                    hoverClass
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
              <a
                href={`mailto:${site.email}`}
                aria-label="Email"
                className="group flex h-11 w-11 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02] text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-growth/40 hover:bg-growth/10 hover:text-growth hover:shadow-md"
              >
                <Mail className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {col.title}
              </h4>
              <ul className="mt-6 space-y-4">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-[14px] text-white/55 transition-all duration-200 hover:text-white"
                    >
                      <span className="h-px w-0 bg-brand transition-all duration-300 group-hover:w-4" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container-lux flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-[13px] text-white">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <Link href="/privacy" className="text-[13px] text-white/40 transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[13px] text-white/40 transition-colors hover:text-white">
              Terms of Use
            </Link>
            <CookieSettingsButton className="text-[13px] text-white/40 transition-colors hover:text-white" />
            <Link
              href="/contact"
              className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand transition-all hover:text-brand-400"
            >
              Investor & Partner Enquiries
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
        <div className="border-t border-white/[0.06]">
          <div className="container-lux py-5 text-center">
            <p className="text-[12px] leading-relaxed text-white/35">
              {site.name} provides professional advisory services. Our services do not constitute regulated financial advice.
              All rights reserved. Governed by the laws of Kenya.
            </p>
            <p className="mt-2 text-[12px] text-white/30">
              Designed &amp; developed by{' '}
              <a
                href="https://www.gibson-makau.tech/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline transition-colors hover:text-brand"
              >
                Gibson Makau
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
