'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { adminFetch, adminPost, adminPut } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { LexicalEditor } from '@/features/lexical/LexicalEditor';
import { AdminCard, AsyncButton, ErrorBanner, Field, Loading, PageHeader } from '@/components/admin/ui';
import { StorageImagePicker } from '@/components/admin/StorageImagePicker';
import { cn } from '@/lib/utils';

interface PromptRow {
  report_type: 'summary' | 'detailed';
  system_prompt: string;
  system_prompt_lexical: Record<string, unknown> | null;
  header_lexical: Record<string, unknown> | null;
  footer_lexical: Record<string, unknown> | null;
  provider: ReportProvider;
  model: string;
  max_tokens: number;
  is_active: boolean;
  version: number;
  previous_system_prompt: string | null;
  updated_by_name: string | null;
  updated_at: string;
}

type ReportType = 'summary' | 'detailed';

type ReportProvider = 'anthropic' | 'google' | 'openrouter';

const PROVIDERS: ReportProvider[] = ['anthropic', 'google', 'openrouter'];

const FALLBACK_MODELS: Record<ReportProvider, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
  google: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
  openrouter: ['anthropic/claude-sonnet-4-6', 'anthropic/claude-opus-4-1', 'google/gemini-2.5-flash', 'openai/gpt-4o'],
};

/** Builds a minimal Lexical EditorState from plain text (paragraph per line). */
function plainTextToLexicalState(text: string): Record<string, unknown> {
  const paragraphs = (text.split(/\n+/).filter(Boolean) as string[]).map((paragraph) => ({
    children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: paragraph, type: 'text', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    type: 'paragraph',
    version: 1,
  }));
  return { root: { children: paragraphs, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } };
}

export function PromptEditor() {
  const params = useParams<{ id: string }>();
  const checkId = params.id;
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = React.useState<ReportType>('summary');
  const [prompts, setPrompts] = React.useState<PromptRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [summaryState, setSummaryState] = React.useState<Record<string, unknown> | null>(null);
  const [detailedState, setDetailedState] = React.useState<Record<string, unknown> | null>(null);
  const [summaryHeader, setSummaryHeader] = React.useState<Record<string, unknown> | null>(null);
  const [summaryFooter, setSummaryFooter] = React.useState<Record<string, unknown> | null>(null);
  const [detailedHeader, setDetailedHeader] = React.useState<Record<string, unknown> | null>(null);
  const [detailedFooter, setDetailedFooter] = React.useState<Record<string, unknown> | null>(null);
  const [provider, setProvider] = React.useState<ReportProvider>('anthropic');
  const [model, setModel] = React.useState<string>('claude-sonnet-4-6');
  const [maxTokens, setMaxTokens] = React.useState<string>('4000');
  const [saving, setSaving] = React.useState(false);
  const [imageTarget, setImageTarget] = React.useState<'header' | 'footer' | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const browseResolverRef = React.useRef<((url: string | null) => void) | null>(null);

  const [models, setModels] = React.useState<Record<ReportProvider, string[]>>(() => {
  // Initialize with empty lists; API will populate them on load.
  return { anthropic: [], google: [], openrouter: [] } as Record<ReportProvider, string[]>;
});

  const activePrompt = prompts.find((p) => p.report_type === activeTab);

  React.useEffect(() => {
    let cancelled = false;
    adminFetch<{ anthropic: string[]; google: string[]; openrouter?: string[] }>('/api/admin/models')
      .then((data) => {
        if (cancelled) return;
        setModels({
          anthropic: data.anthropic ?? [],
          google: data.google ?? [],
          openrouter: data.openrouter ?? FALLBACK_OPENROUTER,
        });
      })
      .catch(() => {
        // Fall back to predefined lists if API fails.
        setModels({
          anthropic: FALLBACK_MODELS.anthropic,
          google: FALLBACK_MODELS.google,
          openrouter: FALLBACK_OPENROUTER,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { prompts: rows } = await adminFetch<{ prompts: PromptRow[] }>(`/api/admin/health-checks/${checkId}/prompts`);
        if (cancelled) return;
        setPrompts(rows);
        const summary = rows.find((p) => p.report_type === 'summary');
        const detailed = rows.find((p) => p.report_type === 'detailed');
        setSummaryState(summary?.system_prompt_lexical ?? (summary ? plainTextToLexicalState(summary.system_prompt) : null));
        setDetailedState(detailed?.system_prompt_lexical ?? (detailed ? plainTextToLexicalState(detailed.system_prompt) : null));
        setSummaryHeader(summary?.header_lexical ?? null);
        setSummaryFooter(summary?.footer_lexical ?? null);
        setDetailedHeader(detailed?.header_lexical ?? null);
        setDetailedFooter(detailed?.footer_lexical ?? null);
        const target = activeTab === 'summary' ? summary : detailed;
        setProvider(target?.provider ?? 'anthropic');
        setModel(target?.model ?? 'claude-sonnet-4-6');
        setMaxTokens((target?.max_tokens ?? 4000).toString());
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load prompts.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkId]);

  const selectTab = (type: ReportType) => {
    setActiveTab(type);
    const prompt = prompts.find((p) => p.report_type === type);
    setProvider(prompt?.provider ?? 'anthropic');
    setModel(prompt?.model ?? 'claude-sonnet-4-6');
    setMaxTokens((prompt?.max_tokens ?? 4000).toString());
  };

  const handleSave = async () => {
    const state = activeTab === 'summary' ? summaryState : detailedState;
    if (!state) {
      toast.error('Nothing to save yet.');
      return;
    }
    setSaving(true);
    try {
      const { prompt } = await adminPut<{ prompt: PromptRow }>(`/api/admin/health-checks/${checkId}/prompts`, {
        report_type: activeTab,
        system_prompt_lexical: state,
        header_lexical: (activeTab === 'summary' ? summaryHeader : detailedHeader) ?? null,
        footer_lexical: (activeTab === 'summary' ? summaryFooter : detailedFooter) ?? null,
        provider,
        model,
        max_tokens: Number(maxTokens),
      });
      setPrompts((prev) => prev.map((p) => (p.report_type === activeTab ? prompt : p)));
      toast.success(`${activeTab === 'summary' ? 'Summary' : 'Detailed'} prompt saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save prompt.');
    } finally {
      setSaving(false);
    }
  };

  const uploadHeaderImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'reports');
    const data = await adminPost<{ file: { publicUrl: string } }>('/api/admin/storage', form);
    return data.file.publicUrl;
  };

  const openHeaderImagePicker = (target: 'header' | 'footer'): Promise<string | null> => {
    setImageTarget(target);
    setPickerOpen(true);
    return new Promise((resolve) => {
      browseResolverRef.current = resolve;
    });
  };

  const handleRollback = async () => {
    if (!activePrompt?.previous_system_prompt) return;
    try {
      const ok = await confirm({
        message: 'Roll back to the previous version of this prompt?',
        danger: false,
        confirmLabel: 'Roll back',
        action: async () => {
          const { prompt } = await adminPut<{ prompt: PromptRow }>(`/api/admin/health-checks/${checkId}/prompts`, {
            report_type: activeTab,
            action: 'rollback',
          });
          setPrompts((prev) => prev.map((p) => (p.report_type === activeTab ? prompt : p)));
          if (activeTab === 'summary') setSummaryState(plainTextToLexicalState(prompt.system_prompt));
          else setDetailedState(plainTextToLexicalState(prompt.system_prompt));
        },
      });
      if (!ok) return;
      toast.success('Rolled back to the previous version');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to roll back.');
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading prompts…" />;

  const currentPrompt = prompts.find((p) => p.report_type === activeTab);
  const isLocked = !currentPrompt;

  return (
    <>
      <PageHeader
        title="Report Prompts"
        subtitle="The system prompts sent to Claude or Gemini when generating each report type."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Prompts' }]}
        actions={
          <AsyncButton
            onClick={handleSave}
            loading={saving}
            loadingLabel="Saving…"
            label="Save prompt"
            icon={<Save className="h-4 w-4" />}
            disabled={isLocked}
          />
        }
      />

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-1">
        {(['summary', 'detailed'] as ReportType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => selectTab(type)}
            className={cn(
              'rounded-md px-5 py-2 text-[13px] font-semibold transition-colors',
              activeTab === type ? 'bg-[#E8510A] text-white' : 'text-[var(--a-text2)] hover:text-[var(--a-ink2)]'
            )}
          >
            {type === 'summary' ? 'Summary' : 'Detailed'}
          </button>
        ))}
      </div>

      {isLocked ? (
        <ErrorBanner message="No prompt configured for this report type yet. Save one below to create it." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
              <AdminCard
                title="Prompt body"
                subtitle="Edits are stored as plain text for the model and as Lexical JSON for editing."
              >
                <LexicalEditor
                  key={activeTab}
                  state={activeTab === 'summary' ? summaryState ?? undefined : detailedState ?? undefined}
                  onChange={(state) =>
                    activeTab === 'summary' ? setSummaryState(state as Record<string, unknown>) : setDetailedState(state as Record<string, unknown>)
                  }
                  placeholder="Write the system prompt for the model…"
                  className="min-h-[420px]"
                />
              </AdminCard>
          </div>

          <div className="space-y-6">
            <AdminCard title="Model settings">
              <div className="space-y-5">
                <Field label="Provider">
                  <div className="inline-flex w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] p-1">
                    {PROVIDERS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setProvider(value);
                          setModel(FALLBACK_MODELS[value][0]);
                        }}
                        className={cn(
                          'flex-1 rounded-md px-3 py-2 text-[13px] font-semibold capitalize transition-colors',
                          provider === value ? 'bg-[#E8510A] text-white' : 'text-[var(--a-text2)] hover:text-[var(--a-ink2)]'
                        )}
                      >
                        {value === 'anthropic' ? 'Anthropic (Claude)' : value === 'google' ? 'Google (Gemini)' : 'OpenRouter'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--a-placeholder)]">
                    New models are fetched automatically; you can also type any model id.
                  </p>
                </Field>
                <Field label="Model">
                  <input
                    list="report-model-options"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={FALLBACK_MODELS[provider]?.[0] ?? 'claude-sonnet-4-6'}
                    className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
                  />
                  <datalist id="report-model-options">
                    {(models[provider] ?? FALLBACK_MODELS.anthropic).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Max tokens" hint="Between 500 and 200,000.">
                  <input
                    className="h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
                    type="number"
                    min={500}
                    max={200000}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </Field>
              </div>
            </AdminCard>

            <AdminCard title="Version history">
              <div className="space-y-3 text-sm text-[var(--a-text2)]">
                <p>
                  Last updated by <span className="font-semibold text-[var(--a-ink2)]">{currentPrompt?.updated_by_name ?? '—'}</span>
                  {currentPrompt?.updated_at ? ` on ${format(new Date(currentPrompt.updated_at), 'd MMM yyyy, HH:mm')}` : ''}
                  {' · '}
                  Version <span className="font-semibold text-[var(--a-ink2)]">{currentPrompt?.version ?? 1}</span>
                </p>
                {currentPrompt?.previous_system_prompt ? (
                  <button
                    type="button"
                    onClick={handleRollback}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-[13px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Rollback to previous version
                  </button>
                ) : (
                  <p className="text-xs text-[var(--a-placeholder)]">No previous version available to roll back to.</p>
                )}
              </div>
            </AdminCard>
          </div>
        </div>
      )}

      {/* Custom Header & Footer */}
      {!isLocked && (
        <div className="mt-6 grid gap-6">
          <AdminCard
            title="Custom header"
            subtitle="Rendered above the report body. Add your logo, business name or links — images are supported."
          >
            <LexicalEditor
              key={`header-${activeTab}`}
              state={(activeTab === 'summary' ? summaryHeader : detailedHeader) ?? undefined}
              onChange={(state) =>
                activeTab === 'summary'
                  ? setSummaryHeader(state as Record<string, unknown>)
                  : setDetailedHeader(state as Record<string, unknown>)
              }
              onUploadImage={uploadHeaderImage}
              onBrowseImage={() => openHeaderImagePicker('header')}
              placeholder="Branded header — logo, tagline, links…"
              className="min-h-[220px]"
            />
          </AdminCard>

          <AdminCard
            title="Custom footer"
            subtitle="Rendered below the report body — contact details, confidentiality note or links."
          >
            <LexicalEditor
              key={`footer-${activeTab}`}
              state={(activeTab === 'summary' ? summaryFooter : detailedFooter) ?? undefined}
              onChange={(state) =>
                activeTab === 'summary'
                  ? setSummaryFooter(state as Record<string, unknown>)
                  : setDetailedFooter(state as Record<string, unknown>)
              }
              onUploadImage={uploadHeaderImage}
              onBrowseImage={() => openHeaderImagePicker('footer')}
              placeholder="Contact block, confidentiality note, links…"
              className="min-h-[220px]"
            />
          </AdminCard>
        </div>
      )}

      <StorageImagePicker
        open={pickerOpen}
        onClose={() => {
          browseResolverRef.current?.(null);
          browseResolverRef.current = null;
          setPickerOpen(false);
          setImageTarget(null);
        }}
        onSelect={(publicUrl) => {
          browseResolverRef.current?.(publicUrl);
          browseResolverRef.current = null;
          setPickerOpen(false);
          setImageTarget(null);
        }}
      />
    </>
  );
}
