'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MessageCircle, Pencil } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { AdminCard, EmptyState, ErrorBanner, Loading, PageHeader, StatusPill, Td, Th } from '@/components/admin/ui';

interface WhatsAppTemplateRow {
  id: string;
  template_key: string;
  name: string;
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  is_active: boolean;
  available_variables: string[];
  updated_at: string;
}

const APPROVAL_TONE: Record<WhatsAppTemplateRow['approval_status'], 'grey' | 'amber' | 'green' | 'red'> = {
  draft: 'grey',
  submitted: 'amber',
  approved: 'green',
  rejected: 'red',
};

export function WhatsAppTemplatesListClient() {
  const [templates, setTemplates] = React.useState<WhatsAppTemplateRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { templates: rows } = await adminFetch<{ templates: WhatsAppTemplateRow[] }>('/api/admin/whatsapp-templates');
        if (!cancelled) setTemplates(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load WhatsApp templates.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="WhatsApp Templates"
        subtitle="Pre-approved message templates for WhatsApp Business delivery."
        crumbs={[{ label: 'WhatsApp Templates' }]}
        actions={
          <Link
            href="/admin/whatsapp/config"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 text-[13px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]"
          >
            Provider config →
          </Link>
        }
      />

      {error && <ErrorBanner message={error} className="mb-6" />}

      <AdminCard bodyClassName="p-0">
        {loading ? (
          <Loading label="Loading WhatsApp templates…" />
        ) : templates.length === 0 ? (
          <EmptyState title="No WhatsApp templates" description="Templates are used to deliver reports via WhatsApp." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                <tr>
                  <Th>Template</Th>
                  <Th>Variables</Th>
                  <Th align="center">Approval</Th>
                  <Th align="center">Active</Th>
                  <Th>Updated</Th>
                  <Th align="right">Edit</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border-soft)]">
                {templates.map((template) => (
                  <tr key={template.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5A9E28]/10 text-[#5A9E28]">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--a-ink2)]">{template.name}</p>
                          <p className="font-mono text-[11px] text-[var(--a-muted)]">{template.template_key}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {template.available_variables.map((v) => (
                          <span key={v} className="rounded-full bg-[#E8510A]/10 px-1.5 py-0.5 font-mono text-[10px] text-[#c94508]">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td align="center">
                      <StatusPill tone={APPROVAL_TONE[template.approval_status]}>{template.approval_status}</StatusPill>
                    </Td>
                    <Td align="center">
                      <StatusPill tone={template.is_active ? 'green' : 'grey'}>{template.is_active ? 'Active' : 'Inactive'}</StatusPill>
                    </Td>
                    <Td className="text-[var(--a-muted)]">{format(new Date(template.updated_at), 'd MMM yyyy')}</Td>
                    <Td align="right">
                      <Link
                        href={`/admin/whatsapp/${template.template_key}`}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-[#E8510A] hover:bg-[#E8510A]/10"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
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
