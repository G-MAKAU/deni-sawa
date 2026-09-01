'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, Plus, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { AdminCard, AsyncButton, EmptyState, ErrorBanner, Loading, Modal, PageHeader, StatusPill, Td, Th, Toggle } from '@/components/admin/ui';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'support';
  is_active: boolean;
  created_at: string;
  lastLogin?: string | null;
}

const ROLE_TONE: Record<TeamMember['role'], 'orange' | 'green' | 'blue' | 'grey'> = {
  super_admin: 'orange',
  admin: 'green',
  manager: 'blue',
  support: 'grey',
};

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

export function TeamClient() {
  const confirm = useConfirm();

  const [me, setMe] = React.useState<{ id?: string; role: string } | null>(null);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newRole, setNewRole] = React.useState<TeamMember['role']>('support');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [{ admin }, { team }] = await Promise.all([
        adminFetch<{ admin: { role: string } }>('/api/admin/me'),
        adminFetch<{ team: TeamMember[] }>('/api/admin/team'),
      ]);
      setMe(admin);
      setMembers(team);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load team.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading team…" />;

  if (me && me.role !== 'super_admin') {
    return (
      <>
        <PageHeader title="Team" subtitle="Manage admin users." />
        <AdminCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <p className="font-semibold text-[var(--a-ink2)]">Super admin access required</p>
            <p className="max-w-sm text-sm text-[var(--a-muted)]">Only super admins can view and manage the team.</p>
          </div>
        </AdminCard>
      </>
    );
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const { member } = await adminPost<{ member: TeamMember }>('/api/admin/team', {
        full_name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setMembers((prev) => [...prev, member]);
      setAddOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      toast.success('Team member added');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to add team member.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (member: TeamMember, patch: Partial<TeamMember>) => {
    try {
      const { member: updated } = await adminPut<{ member: TeamMember }>(`/api/admin/team/${member.id}`, patch);
      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
      toast.success('Team member updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update team member.');
    }
  };

  const handleDelete = async (member: TeamMember) => {
    try {
      const ok = await confirm({
        message: `Remove ${member.full_name} from the team?`,
        action: async () => {
          await adminDelete(`/api/admin/team/${member.id}`);
        },
      });
      if (!ok) return;
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success('Team member removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove team member.');
    }
  };

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Manage who can sign in to the Deni Sawa admin console."
        crumbs={[{ label: 'Team' }]}
        actions={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 text-[13px] font-bold text-white hover:bg-[#c94508]"
          >
            <Plus className="h-4 w-4" /> Add member
          </button>
        }
      />

      <AdminCard bodyClassName="p-0">
        {members.length === 0 ? (
          <EmptyState title="No team members" description="Add your first admin user." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                <tr>
                  <Th>Member</Th>
                  <Th>Role</Th>
                  <Th align="center">Active</Th>
                  <Th>Added</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border-soft)]">
                {members.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8510A]/10 text-[13px] font-bold text-[#c94508]">
                          {member.full_name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--a-ink2)]">{member.full_name}</p>
                          <p className="text-[11px] text-[var(--a-muted)]">{member.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <select
                        value={member.role}
                        disabled={member.id === me?.id}
                        onChange={(e) => handleUpdate(member, { role: e.target.value as TeamMember['role'] })}
                        title={member.id === me?.id ? 'You cannot change your own role' : undefined}
                        className="h-9 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-2 text-[13px] font-semibold text-[var(--a-text)] focus:border-[#E8510A] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <option value="super_admin">super_admin</option>
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="support">support</option>
                      </select>
                      <div className="mt-1">
                        <StatusPill tone={ROLE_TONE[member.role]}>{member.role.replace('_', ' ')}</StatusPill>
                      </div>
                    </Td>
                    <Td align="center">
                      <Toggle checked={member.is_active} onChange={(next) => handleUpdate(member, { is_active: next })} label="Active" />
                    </Td>
                    <Td className="text-[var(--a-muted)]">{format(new Date(member.created_at), 'd MMM yyyy')}</Td>
                    <Td align="right">
                      <button
                        type="button"
                        onClick={() => handleDelete(member)}
                        disabled={member.id === me?.id || members.length <= 1}
                        title={
                          member.id === me?.id
                            ? 'You cannot delete your own account'
                            : members.length <= 1
                              ? 'The last team member cannot be removed'
                              : 'Remove'
                        }
                        aria-label="Remove"
                        className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--a-muted)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add team member"
        footer={
          <>
            <button type="button" onClick={() => setAddOpen(false)} className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]">
              Cancel
            </button>
            <AsyncButton
              onClick={handleAdd}
              loading={saving}
              loadingLabel="Adding…"
              label="Add member"
              icon={<UserPlus className="h-4 w-4" />}
            />
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Full name</label>
            <input className={INPUT_CLASS} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Jane Wanjiku" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Email</label>
            <input className={INPUT_CLASS} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@denisawa.co.ke" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Password</label>
            <input className={INPUT_CLASS} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as TeamMember['role'])}
              className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3 text-sm focus:border-[#E8510A] focus:outline-none"
            >
              <option value="support">support</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
            <p className="mt-1 text-xs text-[var(--a-muted)]">
              Creates both a Supabase Auth account and an admin profile.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
