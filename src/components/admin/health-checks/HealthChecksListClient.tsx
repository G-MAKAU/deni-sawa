'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Clock, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch, adminPost, adminDelete } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { AdminCard, AsyncButton, EmptyState, ErrorBanner, Loading, PageHeader, StatusPill, Td, Th, Toggle } from '@/components/admin/ui';

interface CheckRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  estimated_minutes: number | null;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  section_count: number;
}

export function HealthChecksListClient() {
  const confirm = useConfirm();
  const router = useRouter();
  const [checks, setChecks] = React.useState<CheckRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const { checks: rows } = await adminFetch<{ checks: CheckRow[] }>('/api/admin/health-checks');
      setChecks(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load health checks.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { check } = await adminPost<{ check: { id: string } }>('/api/admin/health-checks', { name: newName.trim() });
      toast.success('Health check created');
      router.push(`/admin/health-checks/${check.id}/sections`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create health check.');
      setCreating(false);
    }
  };

  const handleToggle = async (check: CheckRow) => {
    try {
      await adminFetch(`/api/admin/health-checks/${check.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !check.is_active }),
      });
      setChecks((prev) => prev.map((c) => (c.id === check.id ? { ...c, is_active: !c.is_active } : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update health check.');
    }
  };

  const handleDelete = async (check: CheckRow) => {
    try {
      const ok = await confirm({
        message: `Delete "${check.name}"? This removes its sections, questions and all session data.`,
        action: async () => {
          await adminDelete(`/api/admin/health-checks/${check.id}`);
        },
      });
      if (!ok) return;
      setChecks((prev) => prev.filter((c) => c.id !== check.id));
      toast.success('Health check deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete health check.');
    }
  };

  return (
    <>
      <PageHeader
        title="Health Checks"
        subtitle="Create and manage the assessments visitors complete on the site."
        crumbs={[{ label: 'Health Checks' }]}
        actions={
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="New check name…"
              className="h-9 w-52 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
            />
            <AsyncButton
              onClick={handleCreate}
              loading={creating}
              loadingLabel="Creating…"
              label="New check"
              icon={<Plus className="h-4 w-4" />}
              size="sm"
              disabled={!newName.trim()}
            />
          </div>
        }
      />

      {error && <ErrorBanner message={error} className="mb-6" />}

      <AdminCard bodyClassName="p-0">
        {loading ? (
          <Loading label="Loading health checks…" />
        ) : checks.length === 0 ? (
          <EmptyState title="No health checks yet" description="Create your first health check to start collecting assessments." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                <tr>
                  <Th>Health Check</Th>
                  <Th>Tags</Th>
                  <Th align="center">Est. time</Th>
                  <Th align="center">Sections</Th>
                  <Th align="center">Active</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border-soft)]">
                {checks.map((check) => (
                  <tr key={check.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div>
                          <Link href={`/admin/health-checks/${check.id}`} className="font-semibold text-[var(--a-ink2)] hover:text-[#E8510A]">
                            {check.name}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--a-muted)]">/{check.slug}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {check.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-[#E8510A]/10 px-2 py-0.5 text-[11px] font-medium text-[#c94508]">
                            {tag}
                          </span>
                        ))}
                        {check.tags.length === 0 && <span className="text-xs text-[var(--a-placeholder)]">—</span>}
                      </div>
                    </Td>
                    <Td align="center">
                      <span className="inline-flex items-center gap-1 text-sm text-[var(--a-text2)]">
                        <Clock className="h-3.5 w-3.5" />
                        {check.estimated_minutes ?? '—'} min
                      </span>
                    </Td>
                    <Td align="center">
                      <span className="inline-flex items-center gap-1 text-sm text-[var(--a-text2)]">
                        <Layers className="h-3.5 w-3.5" />
                        {check.section_count}
                      </span>
                    </Td>
                    <Td align="center">
                      <Toggle checked={check.is_active} onChange={() => handleToggle(check)} label={`${check.name} active`} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/health-checks/${check.id}/sections`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-semibold text-[#E8510A] hover:bg-[#E8510A]/10"
                        >
                          Manage <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/admin/health-checks/${check.id}`}
                          aria-label="Edit details"
                          className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(check)}
                          aria-label="Delete"
                          className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}
