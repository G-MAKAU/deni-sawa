'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2, Save, UserRound } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/browser';
import { adminPut } from '@/lib/admin-client';
import { Modal } from '@/components/admin/ui';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  admin: { id?: string; email: string; full_name: string; role: string } | null;
  onNameUpdated?: (fullName: string) => void;
}

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20 disabled:opacity-60';

export function AccountModal({ open, onClose, admin, onNameUpdated }: AccountModalProps) {
  const [fullName, setFullName] = React.useState('');
  const [savingName, setSavingName] = React.useState(false);

  const [newPassword, setNewPassword] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [changingPassword, setChangingPassword] = React.useState(false);

  React.useEffect(() => {
    if (open && admin) setFullName(admin.full_name);
  }, [open, admin]);

  const saveName = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    setSavingName(true);
    try {
      await adminPut('/api/admin/me', { full_name: fullName.trim() });
      onNameUpdated?.(fullName.trim());
      toast.success('Details updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update your details.');
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createBrowserClient();
      // Verify the current password first — signing in with it also refreshes
      // the session, then update the password on the authenticated user.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: admin?.email ?? '',
        password: currentPassword,
      });
      if (verifyError) throw new Error('Your current password is incorrect.');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="My account"
      wide
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
        >
          Close
        </button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] p-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--a-muted)]">
            <UserRound className="h-3.5 w-3.5" /> Your details
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Full name</label>
              <input className={INPUT_CLASS} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Email</label>
              <input className={INPUT_CLASS} value={admin?.email ?? ''} disabled readOnly />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Role</label>
              <input className={INPUT_CLASS} value={(admin?.role ?? '').replace('_', ' ')} disabled readOnly />
            </div>
            <button
              type="button"
              onClick={() => void saveName()}
              disabled={savingName}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#E8510A] px-4 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:opacity-60"
            >
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save details
            </button>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] p-4">
          <p className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--a-muted)]">
            <KeyRound className="h-3.5 w-3.5" /> Change password
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Current password</label>
              <input
                className={INPUT_CLASS}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">New password</label>
              <input
                className={INPUT_CLASS}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Confirm new password</label>
              <input
                className={INPUT_CLASS}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <button
              type="button"
              onClick={() => void changePassword()}
              disabled={changingPassword}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-bold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 hover:text-[#E8510A] disabled:opacity-60"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
