'use client';

import * as React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type StatusTone = 'orange' | 'green' | 'blue' | 'grey' | 'amber' | 'red' | 'sky';

const TONE_CLASSES: Record<StatusTone, string> = {
  orange: 'bg-[#E8510A]/10 text-[#E8510A] border-[#E8510A]/25',
  green: 'bg-[#5A9E28]/10 text-[#3f7a1a] border-[#5A9E28]/25',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/25',
  grey: 'bg-[#6B7280]/10 text-[var(--a-text)] border-[#6B7280]/25',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
  red: 'bg-red-500/10 text-red-600 border-red-500/25',
  sky: 'bg-sky-500/10 text-sky-600 border-sky-500/25',
};

export function StatusPill({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function AdminCard({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--a-border-soft)] px-5 py-4">
          <div>
            {title && <h2 className="font-heading text-base font-semibold text-[var(--a-ink2)]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[var(--a-muted)]">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--a-ink2)]">
        {label}
        {required && <span className="text-[#E8510A]">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--a-muted)]">{hint}</span>}
    </label>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  crumbs,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1 text-xs text-[var(--a-muted)]" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <React.Fragment key={crumb.label}>
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-[#E8510A]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--a-text)]">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--a-ink)]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-[var(--a-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-sm text-[var(--a-muted)]', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-[#E8510A]" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--a-border)] bg-[var(--a-card)] px-6 py-14 text-center', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8510A]/10 text-[#E8510A]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2a4 4 0 01-4-4 4 4 0 00-4 4H6" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[var(--a-ink2)]">{title}</p>
      {description && <p className="max-w-sm text-xs text-[var(--a-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600', className)}>
      {message}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#111111]/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div
        className={cn('my-8 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-2xl', wide ? 'max-w-4xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--a-border-soft)] px-5 py-4">
          <h3 className="font-heading text-base font-semibold text-[var(--a-ink2)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--a-muted)] transition-colors hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="px-5 py-5">{children}</div>
        {footer && <footer className="flex items-center justify-end gap-2 border-t border-[var(--a-border-soft)] px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

export function Th({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--a-muted)]',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'whitespace-nowrap px-4 py-3 text-sm text-[var(--a-ink2)]',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
    >
      {children}
    </td>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-[#E8510A]' : 'bg-[var(--a-track)]',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  );
}

const ASYNC_BUTTON_VARIANTS: Record<AsyncButtonVariant, string> = {
  primary: 'bg-[#E8510A] text-white hover:bg-[#c94508]',
  growth: 'bg-[#5A9E28] text-white hover:bg-[#4d8820]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-[var(--a-border)] bg-[var(--a-card)] text-[var(--a-text)] hover:bg-[var(--a-hover)]',
  ghost: 'text-[var(--a-text)] hover:bg-[var(--a-hover)] hover:text-[#E8510A]',
};

export type AsyncButtonVariant = 'primary' | 'growth' | 'danger' | 'outline' | 'ghost';

export interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
  label: string;
  icon?: React.ReactNode;
  variant?: AsyncButtonVariant;
  size?: 'sm' | 'md';
}

/**
 * Button with built-in loading state: shows a spinner and swaps the label to
 * `loadingLabel` while `loading` is true, and disables itself. Used for every
 * save / add / confirm / delete action so all CRUD buttons behave consistently.
 */
export function AsyncButton({
  loading = false,
  loadingLabel = 'Saving…',
  label,
  icon,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: AsyncButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-10 px-5 text-[13px]',
        ASYNC_BUTTON_VARIANTS[variant],
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {loading ? loadingLabel : label}
    </button>
  );
}
