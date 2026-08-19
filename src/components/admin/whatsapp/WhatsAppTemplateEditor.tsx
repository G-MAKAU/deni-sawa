'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Bold, CheckCheck, ChevronDown, Italic, Loader2, MessageCircle, Save, Send, Strikethrough } from 'lucide-react';
import { adminFetch, adminPut, adminPost } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { AdminCard, AsyncButton, ErrorBanner, Field, Loading, Modal, PageHeader, StatusPill, Toggle } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface WhatsAppTemplateDetail {
  id: string;
  template_key: string;
  name: string;
  body_text: string;
  available_variables: string[];
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  wa_template_id: string | null;
  category: string | null;
  language: string;
  is_active: boolean;
  updated_by_name: string | null;
  updated_at: string;
}

const META_CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

const META_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh_CN', label: 'Chinese (Simplified)' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'tr', label: 'Turkish' },
];

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

const SAMPLE_VALUES: Record<string, string> = {
  recipient_name: 'Jane Wanjiku',
  check_name: 'Business Health Check',
  report_type: 'summary',
  report_url: 'https://denisawa.co.ke/business-health-checks/report/example',
  resume_url: 'https://denisawa.co.ke/business-health-checks/assessment/business-health-check',
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHighlighted(text: string): string {
  return escapeHtml(text).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '<span class="wa-var">$&</span>');
}

/** Replace variables with test values for the phone preview. */
function renderPreviewText(text: string, values: Record<string, string>): string {
  return escapeHtml(text).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) =>
    values[key] !== undefined ? `<span class="wa-var">${escapeHtml(String(values[key]))}</span>` : `<span class="wa-var">${match}</span>`
  );
}

export function WhatsAppTemplateEditor() {
  const confirm = useConfirm();
  const params = useParams<{ key: string }>();
  const templateKey = params.key;

  const [template, setTemplate] = React.useState<WhatsAppTemplateDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [bodyText, setBodyText] = React.useState('');
  const [charCount, setCharCount] = React.useState(0);
  const [waTemplateId, setWaTemplateId] = React.useState('');
  const [category, setCategory] = React.useState<string>('');
  const [language, setLanguage] = React.useState('en');
  const [isActive, setIsActive] = React.useState(false);
  const [testVariables, setTestVariables] = React.useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = React.useState<'editor' | 'preview'>('editor');
  const [varDropdownOpen, setVarDropdownOpen] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [bodyHtml, setBodyHtml] = React.useState('');

  const [testOpen, setTestOpen] = React.useState(false);
  const [testTo, setTestTo] = React.useState('');
  const [sendingTest, setSendingTest] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { template: t } = await adminFetch<{ template: WhatsAppTemplateDetail }>(`/api/admin/whatsapp-templates/${templateKey}`);
        if (cancelled) return;
        setTemplate(t);
        setBodyText(t.body_text);
        setCharCount(t.body_text.length);
        setBodyHtml(renderHighlighted(t.body_text));
        setWaTemplateId(t.wa_template_id ?? '');
        setCategory(t.category ?? '');
        setLanguage(t.language || 'en');
        setIsActive(t.is_active);
        setTestVariables(Object.fromEntries(t.available_variables.map((v) => [v, SAMPLE_VALUES[v] ?? `[${v}]`])));
        setTestTo('');
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

  const status = template?.approval_status ?? 'draft';
  const canEdit = status === 'draft' || status === 'rejected';

  const handleBodyInput = React.useCallback(() => {
    const text = bodyRef.current?.textContent ?? '';
    setBodyText(text);
    setCharCount(text.length);
  }, []);

  const insertVariableAtCursor = (name: string) => {
    const el = bodyRef.current;
    if (!el) return;
    el.focus();
    const token = `{{${name}}}`;
    const sel = window.getSelection();
    const span = document.createElement('span');
    span.className = 'wa-var';
    span.textContent = token;
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    }
    handleBodyInput();
    setVarDropdownOpen(false);
  };

  const wrapSelection = (marker: string) => {
    const el = bodyRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;
    const replacement = `${marker}${selectedText}${marker}`;
    range.deleteContents();
    const textNode = document.createTextNode(replacement);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    handleBodyInput();
  };

  const handleSave = async () => {
    if (!bodyText.trim()) {
      toast.error('The message body is required.');
      return;
    }
    setSaving(true);
    try {
      await adminPut(`/api/admin/whatsapp-templates/${templateKey}`, {
        body_text: bodyText,
        category: category || null,
        language,
        action: 'save',
      });
      toast.success('Template saved');
      const { template: t } = await adminFetch<{ template: WhatsAppTemplateDetail }>(`/api/admin/whatsapp-templates/${templateKey}`);
      setTemplate(t);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!bodyText.trim()) {
      toast.error('The message body is required before submission.');
      return;
    }
    try {
      const ok = await confirm({
        message: 'Submit this template for WhatsApp approval? Editing will be locked until approved or rejected.',
        danger: false,
        confirmLabel: 'Submit',
        action: async () => {
          await adminPut(`/api/admin/whatsapp-templates/${templateKey}`, { action: 'submit' });
          const { template: t } = await adminFetch<{ template: WhatsAppTemplateDetail }>(`/api/admin/whatsapp-templates/${templateKey}`);
          setTemplate(t);
        },
      });
      if (!ok) return;
      toast.success('Submitted for approval');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit.');
    }
  };

  const handleToggleActive = async (next: boolean) => {
    try {
      await adminPut(`/api/admin/whatsapp-templates/${templateKey}`, { is_active: next, action: 'toggle_active' });
      setIsActive(next);
      toast.success(next ? 'Template activated' : 'Template deactivated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update activation.');
    }
  };

  const handleSaveWaId = async () => {
    try {
      await adminPut(`/api/admin/whatsapp-templates/${templateKey}`, { wa_template_id: waTemplateId.trim() || null, action: 'set_wa_id' });
      toast.success('WhatsApp template ID saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save template ID.');
    }
  };

  const handleSendTest = async () => {
    if (!testTo.trim()) {
      toast.error('Enter a WhatsApp number in E.164 format.');
      return;
    }
    setSendingTest(true);
    try {
      await adminPost('/api/admin/whatsapp-templates/test', {
        template_key: templateKey,
        send_to: testTo.trim(),
        variables: testVariables,
      });
      toast.success('Test message sent');
      setTestOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send test message.');
    } finally {
      setSendingTest(false);
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading template…" />;
  if (!template) return null;

  const previewHtml = renderPreviewText(bodyText, testVariables);

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
          <Field label="Approval status">
            <div className="flex h-11 items-center">
              <StatusPill
                tone={status === 'approved' ? 'green' : status === 'submitted' ? 'amber' : status === 'rejected' ? 'red' : 'grey'}
              >
                {status}
              </StatusPill>
            </div>
          </Field>
          {status === 'approved' && (
            <Field label="WhatsApp template ID">
              <div className="flex gap-2">
                <input className={cn(INPUT_CLASS, 'font-mono')} value={waTemplateId} onChange={(e) => setWaTemplateId(e.target.value)} placeholder="wamid.xxxxxxxx" />
                <button type="button" onClick={handleSaveWaId} className="h-11 shrink-0 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-[13px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40">
                  Save
                </button>
              </div>
            </Field>
          )}
          <Field label="Template category" hint="Meta requires a category for approval.">
            <select
              className={cn(INPUT_CLASS, 'disabled:cursor-not-allowed disabled:opacity-60')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!canEdit}
            >
              <option value="">Select category…</option>
              {META_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Template language" hint="Language code sent to Meta at delivery time.">
            <select
              className={cn(INPUT_CLASS, 'disabled:cursor-not-allowed disabled:opacity-60')}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!canEdit}
            >
              {META_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Variables" bodyClassName="p-4">
        <div className="flex flex-wrap gap-1.5">
          {template.available_variables.map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => insertVariableAtCursor(variable)}
              disabled={!canEdit}
              className="rounded-full border border-[#E8510A]/30 bg-[#E8510A]/10 px-2.5 py-1 font-mono text-[11px] font-medium text-[#c94508] transition-colors hover:bg-[#E8510A]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {`{{${variable}}}`}
            </button>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Message body"
        subtitle="Plain text only — WhatsApp does not support rich formatting. Use *bold*, _italic_, ~strikethrough~."
      >
        <div className="mb-2 flex items-center gap-1 rounded-t-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-2 py-1.5">
          <button
            type="button"
            onClick={() => wrapSelection('*')}
            disabled={!canEdit}
            title="Bold (*text*)"
            className="rounded p-1.5 text-[var(--a-text2)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)] disabled:opacity-40"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('_')}
            disabled={!canEdit}
            title="Italic (_text_)"
            className="rounded p-1.5 text-[var(--a-text2)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)] disabled:opacity-40"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('~')}
            disabled={!canEdit}
            title="Strikethrough (~text~)"
            className="rounded p-1.5 text-[var(--a-text2)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)] disabled:opacity-40"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-[var(--a-border)]" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setVarDropdownOpen((o) => !o)}
              disabled={!canEdit}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-semibold text-[#E8510A] hover:bg-[var(--a-hover)] disabled:opacity-40"
            >
              <span className="font-mono">&#123;&#123;var&#125;&#125;</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {varDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setVarDropdownOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-52 overflow-y-auto rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] py-1 shadow-lg">
                  {template.available_variables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariableAtCursor(variable)}
                      className="block w-full px-3 py-2 text-left font-mono text-[12px] text-[var(--a-text)] hover:bg-[#E8510A]/10 hover:text-[#E8510A]"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="ml-auto pr-1 font-mono text-[11px] text-[var(--a-muted)]">
            {charCount} / 1024 characters
          </span>
        </div>
        <div
          ref={bodyRef}
          contentEditable={canEdit}
          suppressContentEditableWarning
          onInput={handleBodyInput}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
          data-placeholder={canEdit ? 'Write your WhatsApp message…' : ''}
          className="wa-body min-h-[200px] rounded-b-lg rounded-t-none border border-t-0 border-[var(--a-border)] bg-[var(--a-card)] px-4 py-3 text-[14px] leading-relaxed text-[var(--a-ink2)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/10"
        />
        {!canEdit && status === 'submitted' && (
          <p className="mt-3 text-xs text-[var(--a-muted)]">Editing is locked while this template is under WhatsApp review.</p>
        )}
      </AdminCard>
    </div>
  );

  const approvalPane = (
    <div className="space-y-6">
      {status === 'draft' && (
        <AdminCard title="Approval workflow">
          <div className="space-y-4">
            <p className="text-sm text-[var(--a-text2)]">
              Submit this template to WhatsApp for approval. Once approved it can be activated for live delivery.
            </p>
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#5A9E28] px-4 py-2.5 text-[13px] font-bold text-[#3f7a1a] hover:bg-[#5A9E28]/10 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for WhatsApp approval
            </button>
          </div>
        </AdminCard>
      )}

      {status === 'rejected' && (
        <AdminCard title="Approval workflow">
          <div className="space-y-4">
            <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              <p className="font-semibold">Rejected by WhatsApp</p>
              {template.rejection_reason && <p className="mt-1 text-xs">{template.rejection_reason}</p>}
            </div>
            <p className="text-sm text-[var(--a-text2)]">Edit the message and re-submit for approval.</p>
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#5A9E28] px-4 py-2.5 text-[13px] font-bold text-[#3f7a1a] hover:bg-[#5A9E28]/10 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Edit and resubmit
            </button>
          </div>
        </AdminCard>
      )}

      {status === 'approved' && (
        <AdminCard title="Approval workflow">
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-[#5A9E28]/25 bg-[#5A9E28]/5 px-4 py-3 text-sm font-semibold text-[#3f7a1a]">
              <CheckCheck className="h-4 w-4" /> Template approved — ready for delivery
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">Active for delivery</p>
                <p className="text-xs text-[var(--a-muted)]">Send report messages using this template</p>
              </div>
              <Toggle checked={isActive} onChange={handleToggleActive} label="Active" />
            </div>
          </div>
        </AdminCard>
      )}

      {status === 'submitted' && (
        <AdminCard title="Approval workflow">
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Submitted — awaiting WhatsApp approval
          </div>
        </AdminCard>
      )}

      {/* Phone preview */}
      <AdminCard title="Phone preview" subtitle="Variables fill from the test values below." bodyClassName="p-4">
        <div className="mx-auto max-w-[330px] overflow-hidden rounded-[28px] border border-[#2A363B] bg-[#0B141A] shadow-lg">
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#128C7E] text-[13px] font-bold text-white">
              DS
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-white">Deni Sawa Partners</p>
              <p className="text-[11px] text-[#8FD6CB]">online</p>
            </div>
            <MessageCircle className="h-5 w-5 text-[#8FD6CB]" />
          </div>
          <div className="bg-[#ECE5DD] px-3 py-5">
            <div className="relative max-w-[85%] rounded-lg rounded-tl-none bg-[var(--a-card)] px-3 py-2 shadow-sm">
              <div className="wa-preview-text whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--a-ink)]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--a-muted)]">
                {format(new Date(), 'HH:mm')}
                <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Test values" subtitle="Used for the live preview and test messages." bodyClassName="p-4">
        <div className="space-y-3">
          {template.available_variables.map((variable) => (
            <div key={variable}>
              <label className="mb-1 block font-mono text-[11px] font-medium text-[var(--a-muted)]">{`{{${variable}}}`}</label>
              <input
                className={INPUT_CLASS}
                value={testVariables[variable] ?? ''}
                onChange={(e) => setTestVariables((prev) => ({ ...prev, [variable]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );

  return (
    <>
      <PageHeader
        title={template.name}
        subtitle={`Updated ${template.updated_by_name ?? '—'}${template.updated_at ? ` · ${format(new Date(template.updated_at), 'd MMM yyyy, HH:mm')}` : ''}`}
        crumbs={[{ label: 'WhatsApp Templates', href: '/admin/whatsapp' }, { label: template.name }]}
      />

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
        <div className={cn('lg:col-span-2', previewMode === 'editor' && 'hidden lg:block')}>{approvalPane}</div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-[var(--a-border)] bg-[var(--a-card)] px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setTestOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-[#5A9E28] px-4 text-[13px] font-bold text-[#3f7a1a] hover:bg-[#5A9E28]/10"
          >
            <Send className="h-4 w-4" /> Send test message
          </button>
          <AsyncButton
            onClick={handleSave}
            loading={saving}
            loadingLabel="Saving…"
            label="Save template"
            icon={<Save className="h-4 w-4" />}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Send test modal */}
      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Send test WhatsApp message"
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
          <Field label="Send to" hint="E.164 format, e.g. +254700000000" required>
            <input className={INPUT_CLASS} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="+254700000000" />
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
