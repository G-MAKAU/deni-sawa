'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Mail, Moon, Save, Send, Sun } from 'lucide-react';
import { adminFetch, adminPut, adminPost } from '@/lib/admin-client';
import { SimpleHtmlEditor } from '@/features/lexical/SimpleHtmlEditor';
import { SimpleHtmlRenderer } from '@/features/lexical/SimpleHtmlRenderer';
import { AdminCard, AsyncButton, ErrorBanner, Field, Loading, Modal, PageHeader, Toggle } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface EmailTemplateDetail {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  preview_text: string | null;
  body_html: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  is_active: boolean;
  available_variables: string[];
  updated_by_name: string | null;
  updated_at: string;
}

interface AdminIdentity {
  email: string;
  full_name: string;
  role: string;
}

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

const SAMPLE_VALUES: Record<string, string> = {
  recipient_name: 'Jane Wanjiku',
  check_name: 'Business Health Check',
  report_type: 'summary',
  report_url: 'https://denisawa.co.ke/health-checks/report/example',
  resume_url: 'https://denisawa.co.ke/health-checks/assessment/business-health-check',
};

function substituteInState(state: Record<string, unknown>, values: Record<string, string>): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node.map(walk).filter((n) => n !== null);
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;

      // Variable pills become plain text so the preview shows the test value.
      if (obj.type === 'variable') {
        const name = String(obj.name ?? '');
        const value = values[name];
        return {
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: value !== undefined ? String(value) : `{{${name}}}`,
          type: 'text',
          version: 1,
        };
      }

      if (typeof obj.text === 'string') {
        obj.text = obj.text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) =>
          values[key] !== undefined ? values[key] : match
        );
      }
      if (Array.isArray(obj.children)) obj.children = obj.children.map(walk).filter((n) => n !== null);
    }
    return node;
  };

  return walk(clone) as Record<string, unknown>;
}

function substituteInHtml(html: string, values: Record<string, string>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) =>
    values[key] !== undefined ? values[key] : match
  );
}

export function EmailTemplateEditor() {
  const params = useParams<{ key: string }>();
  const templateKey = params.key;

  const [template, setTemplate] = React.useState<EmailTemplateDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [adminEmail, setAdminEmail] = React.useState('');

  const [subject, setSubject] = React.useState('');
  const [previewText, setPreviewText] = React.useState('');
  const [fromName, setFromName] = React.useState('Deni Sawa Partners');
  const [fromEmail, setFromEmail] = React.useState('noreply@denisawa.co.ke');
  const [replyTo, setReplyTo] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [bodyHtml, setBodyHtml] = React.useState<string | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState<'editor' | 'preview'>('editor');
  const [previewDark, setPreviewDark] = React.useState(false);

  const [testOpen, setTestOpen] = React.useState(false);
  const [testTo, setTestTo] = React.useState('');
  const [testVariables, setTestVariables] = React.useState<Record<string, string>>({});
  const [sendingTest, setSendingTest] = React.useState(false);
  const [previewKey, setPreviewKey] = React.useState(0);
  const [isPreviewSticky, setIsPreviewSticky] = React.useState(false);

  const handleUploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await adminPost<{ url: string }>('/api/admin/upload-image', formData);
      return res.url;
    } catch (e) {
      toast.error('Image upload failed');
      return '';
    }
  };

  const handleBrowseImage = async (): Promise<string | null> => {
    try {
      const res = await adminFetch<{ url: string }>('/api/admin/media/browse');
      return res.url ?? null;
    } catch {
      return null;
    }
  };

  const handleInsertImage = async (url: string) => {
    const imgHtml = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:0.5rem;">`;
    setBodyHtml(prev => prev + imgHtml);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    try {
      const url = await handleUploadImage(file);
      if (url) {
        const imgHtml = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:0.5rem;">`;
        setBodyHtml(prev => prev + imgHtml);
      }
    } catch (e) {
      toast.error('Image upload failed');
    }
  };

  const previewHtml = bodyHtml ? substituteInHtml(bodyHtml, testVariables) : '';
  const previewKeyString = JSON.stringify(previewHtml);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBodyHtml(null);
    (async () => {
      try {
        const [templateResult, meResult] = await Promise.all([
          adminFetch<{ template: EmailTemplateDetail }>(`/api/admin/email-templates/${templateKey}`),
          adminFetch<{ admin: AdminIdentity }>('/api/admin/me').catch(() => null),
        ]);
        if (cancelled) return;
        const t = templateResult.template;
        setTemplate(t);
        setSubject(t.subject);
        setPreviewText(t.preview_text ?? '');
        setFromName(t.from_name);
        setFromEmail(t.from_email);
        setReplyTo(t.reply_to ?? '');
        setIsActive(t.is_active);
        setBodyHtml(t.body_html ?? '');
        setAdminEmail(meResult?.admin.email ?? '');
        setTestTo(meResult?.admin.email ?? '');
        setTestVariables(Object.fromEntries(t.available_variables.map((v) => [v, SAMPLE_VALUES[v] ?? `[${v}]`])));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load template.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateKey]);

  const referencedVariables = React.useMemo(() => {
    const bodyText = bodyHtml ?? '';
    const used = new Set<string>();
    bodyText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k: string) => {
      used.add(k);
      return '';
    });
    return used;
  }, [bodyHtml]);

  const fieldSetters: Record<string, (value: string) => void> = React.useMemo(
    () => ({
      subject: setSubject,
      preview: setPreviewText,
      fromName: setFromName,
      fromEmail: setFromEmail,
      replyTo: setReplyTo,
    }),
    []
  );

  const insertVariable = (name: string) => {
    const token = `{{${name}}}`;
    const el = document.activeElement as HTMLInputElement | null;
    if (el && el.tagName === 'INPUT' && typeof el.selectionStart === 'number' && fieldSetters[el.id]) {
      const start = el.selectionStart;
      const end = el.selectionEnd ?? start;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeSetter?.call(el, next);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    } else {
      setSubject((s) => s + token);
    }
  };

  const handleSave = async () => {
    if (!bodyHtml) return;
    setSaving(true);
    try {
      await adminPut(`/api/admin/email-templates/${templateKey}`, {
        name: template?.name ?? '',
        subject,
        preview_text: previewText || null,
        body_html: bodyHtml,
        from_name: fromName,
        from_email: fromEmail,
        reply_to: replyTo || null,
        is_active: isActive,
      });
      toast.success('Template saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testTo.trim()) {
      toast.error('Enter a recipient email.');
      return;
    }
    setSendingTest(true);
    try {
      await adminPost('/api/admin/email-templates/test', {
        template_key: templateKey,
        send_to: testTo.trim(),
        variables: testVariables,
      });
      toast.success('Test email sent');
      setTestOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send test email.');
    } finally {
      setSendingTest(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading template…" />;
  if (!template) return null;

  const editorPane = (
    <div className="space-y-6">
      <AdminCard title="Metadata">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Template name" hint="Display only">
            <input className={cn(INPUT_CLASS, 'bg-[var(--a-hover)] text-[var(--a-muted)]')} value={template.name} readOnly />
          </Field>
          <Field label="Template key" hint="Used by the system">
            <input className={cn(INPUT_CLASS, 'bg-[var(--a-hover)] font-mono text-[var(--a-muted)]')} value={template.template_key} readOnly />
          </Field>
          <Field label="Subject" hint="Supports {{variables}}" className="sm:col-span-2">
            <input id="subject" className={INPUT_CLASS} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Preview text" className="sm:col-span-2">
            <input id="preview" className={INPUT_CLASS} value={previewText} onChange={(e) => setPreviewText(e.target.value)} />
          </Field>
          <Field label="From name">
            <input id="fromName" className={INPUT_CLASS} value={fromName} onChange={(e) => setFromName(e.target.value)} />
          </Field>
          <Field label="From email">
            <input id="fromEmail" className={INPUT_CLASS} value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
          </Field>
          <Field label="Reply-to" hint="Optional">
            <input id="replyTo" className={INPUT_CLASS} value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
          </Field>
          <div className="flex items-end pb-1">
            <div className="flex w-full items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">Active</p>
                <p className="text-xs text-[var(--a-muted)]">Used for delivery</p>
              </div>
              <Toggle checked={isActive} onChange={setIsActive} label="Active" />
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Variables" subtitle="Click a chip to insert it at your cursor, or use the editor toolbar." bodyClassName="p-4">
        <div className="flex flex-wrap gap-1.5">
          {template.available_variables.map((variable) => {
            const used = referencedVariables.has(variable);
            return (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className={cn(
                  'rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors',
                  used
                    ? 'border-[#5A9E28]/30 bg-[#5A9E28]/10 text-[#3f7a1a] hover:bg-[#5A9E28]/20'
                    : 'border-[#E8510A]/30 bg-[#E8510A]/10 text-[#c94508] hover:bg-[#E8510A]/20'
                )}
                title={used ? 'Referenced in body' : 'Not yet referenced in body'}
              >
                {`{{${variable}}}`}
                {!used && <span className="ml-1 text-[9px] font-bold uppercase">warn</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-[var(--a-muted)]">
          Green = referenced in the body · Orange = not referenced yet
        </p>
      </AdminCard>

      <AdminCard title="Body" subtitle="Edit HTML — variables render as orange pills.">
        <SimpleHtmlEditor
          html={bodyHtml ?? ''}
          onChange={setBodyHtml}
          placeholder="Write your email body…"
          variables={template.available_variables}
          onInsertVariable={insertVariable}
          onUploadImage={handleUploadImage}
          onBrowseImage={handleBrowseImage}
          className="min-h-[440px]"
        />
      </AdminCard>
    </div>
  );

  const previewPane = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-[var(--a-ink2)]">Live preview</h2>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-0.5">
          <button
            type="button"
            onClick={() => setPreviewDark(false)}
            className={cn('rounded-md px-2.5 py-1.5 text-[12px] font-semibold', !previewDark ? 'bg-[#E8510A] text-white' : 'text-[var(--a-text2)]')}
            title="Light email client"
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDark(true)}
            className={cn('rounded-md px-2.5 py-1.5 text-[12px] font-semibold', previewDark ? 'bg-[#111111] text-white' : 'text-[var(--a-text2)]')}
            title="Dark email client"
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Email client mockup */}
      <div className={cn('mx-auto max-w-[600px] overflow-hidden rounded-lg border border-[var(--a-border)] shadow-sm', previewDark ? 'bg-[#111111]' : 'bg-[var(--a-card)]')}>
        <div className={cn('px-4 py-3 text-[11px] text-[var(--a-muted)]', previewDark ? 'border-b border-white/10' : 'border-b border-[var(--a-border-soft)]')}>
          <p>
            <span className="font-semibold text-[var(--a-ink2)]">{fromName}</span> &lt;{fromEmail}&gt;
            {replyTo ? ` · reply-to: ${replyTo}` : ''}
          </p>
          <p className="mt-0.5 truncate font-medium text-[var(--a-text)]">
            Subject: <span className="text-[var(--a-ink2)]">{subject}</span>
          </p>
          {previewText && <p className="mt-0.5 truncate">{previewText}</p>}
        </div>

        <div className={cn(previewDark ? 'bg-[#1A1A1A]' : 'bg-[var(--a-bg)]', 'px-4 py-6')}>
          <div className="overflow-hidden rounded-md border border-[var(--a-border)]">
            {/* Branded header — navy in dark mode */}
            <div className="h-1.5 bg-[#E8510A]" />
            <div className={cn('border-b px-6 py-5 text-center', previewDark ? 'border-[#0f2438] bg-[#193d5b]' : 'border-[var(--a-border-soft)] bg-white')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Deni-sawa-main-logo.webp"
                alt="Deni Sawa Partners"
                className="mx-auto h-auto w-[200px] max-w-full"
              />
              <p className={cn('mt-1 text-[9px] uppercase tracking-[0.3em]', previewDark ? 'text-[#9CA3AF]' : 'text-[var(--a-muted)]')}>
                Partners
              </p>
            </div>
            <div className={cn('px-6 py-6 text-[14px] leading-relaxed', previewDark ? 'bg-[#111111] text-[#E5E7EB]' : 'bg-[var(--a-card)] text-[var(--a-ink2)]')}>
              {previewHtml ? (
                <SimpleHtmlRenderer key={previewKeyString} html={previewHtml} />
              ) : (
                <p className="text-[var(--a-muted)]">Start writing the email body…</p>
              )}
            </div>
            {/* Branded footer */}
            <div className="bg-[var(--a-bg)] px-6 py-5 text-center text-[11px] text-[var(--a-muted)]">
              <p>Deni Sawa Partners · Financial coaching, advisory &amp; debt solutions · Nairobi, Kenya</p>
              <p className="mt-1">denisawa.co.ke</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title={template.name}
        subtitle={`Edited by ${template.updated_by_name ?? '—'}${template.updated_at ? ` on ${format(new Date(template.updated_at), 'd MMM yyyy, HH:mm')}` : ''}`}
        crumbs={[{ label: 'Email Templates', href: '/admin/email' }, { label: template.name }]}
      />

      {/* Mobile tabs */}
      <div className="mb-6 inline-flex rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-1 lg:hidden">
        {(['editor', 'preview'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setPreviewMode(mode)}
            className={cn(
              'rounded-md px-5 py-2 text-[13px] font-semibold capitalize transition-colors',
              previewMode === mode ? 'bg-[#E8510A] text-white' : 'text-[var(--a-text2)]'
            )}
          >
            {mode === 'editor' ? 'Editor' : 'Preview'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={cn('lg:col-span-3', previewMode === 'preview' && 'hidden lg:block')}>{editorPane}</div>
        <div className={cn('lg:col-span-2', previewMode === 'editor' && 'hidden lg:block')}>{previewPane}</div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-[var(--a-border)] bg-[var(--a-card)] px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setTestOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-[#5A9E28] px-4 text-[13px] font-bold text-[#3f7a1a] transition-colors hover:bg-[#5A9E28]/10"
          >
            <Send className="h-4 w-4" /> Send test email
          </button>
          <AsyncButton
            onClick={handleSave}
            loading={saving}
            loadingLabel="Saving…"
            label="Save template"
            icon={<Save className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Send test modal */}
      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Send test email"
        footer={
          <>
            <button type="button" onClick={() => setTestOpen(false)} className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={sendingTest}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#5A9E28] px-4 text-[13px] font-bold text-white hover:bg-[#4d8820] disabled:opacity-60"
            >
              {sendingTest && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" /> Send test
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Send to" required>
            <input className={INPUT_CLASS} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@denisawa.co.ke" />
          </Field>
          <div className="h-px bg-[var(--a-border-soft)]" />
          {template.available_variables.map((variable) => (
            <Field key={variable} label={variable}>
              <input
                className={cn(INPUT_CLASS, 'font-mono')}
                value={testVariables[variable] ?? ''}
                onChange={(e) => setTestVariables((prev) => ({ ...prev, [variable]: e.target.value }))}
                placeholder={`Value for {{${variable}}}`}
              />
            </Field>
          ))}
        </div>
      </Modal>
    </>
  );
}
