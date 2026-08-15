'use client';

import * as React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/admin/ui';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Optional async action run by the confirm button — the dialog shows a spinner until it resolves. */
  action?: () => Promise<void>;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
  reject: (error: unknown) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextValue | undefined>(undefined);

function ConfirmDialog({
  open,
  options,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  options: PendingConfirm | null;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const danger = options?.danger ?? true;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={options?.title ?? 'Are you sure?'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:bg-[var(--a-hover)] disabled:opacity-50"
          >
            {options?.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              danger
                ? 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-5 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
                : 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:cursor-not-allowed disabled:opacity-60'
            }
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Working…' : (options?.confirmLabel ?? (danger ? 'Delete' : 'Confirm'))}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-red-500/10 text-red-600' : 'bg-[#E8510A]/10 text-[#E8510A]'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="pt-1.5 text-sm leading-relaxed text-[var(--a-text)]">{options?.message}</p>
      </div>
    </Modal>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PendingConfirm | null>(null);
  const [busy, setBusy] = React.useState(false);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve, reject) => {
      setState({ ...options, resolve, reject });
    });
  }, []);

  const close = React.useCallback((result: boolean) => {
    setState((prev) => {
      prev?.resolve(result);
      return null;
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    const current = state;
    if (!current) return;
    if (current.action) {
      setBusy(true);
      try {
        await current.action();
        setBusy(false);
        close(true);
      } catch (error) {
        setBusy(false);
        close(false);
        current.reject(error);
      }
      return;
    }
    close(true);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog open={state !== null} options={state} busy={busy} onConfirm={() => void handleConfirm()} onClose={() => close(false)} />
    </ConfirmContext.Provider>
  );
}

/** Returns an `await`-able confirm that renders a branded modal. */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
