'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Check, ChevronDown, ChevronRight, FileText, Layers, ListChecks, Loader2, Upload } from 'lucide-react';
import { adminPost } from '@/lib/admin-client';
import { Modal, AsyncButton } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PreviewQuestion {
  text: string;
  type: 'paragraph' | 'single_select' | 'multi_select';
  required: boolean;
  helper_text: string | null;
  options: string[];
}

interface PreviewSubsection {
  heading: string;
  description: string | null;
  questions: PreviewQuestion[];
}

interface PreviewSection {
  title: string;
  description: string | null;
  subsections: PreviewSubsection[];
}

interface PreviewData {
  preview: true;
  sections: PreviewSection[];
  totals: { sections: number; questions: number; options: number };
}

interface ImportResult {
  success: boolean;
  imported: { sections: number; questions: number; options: number };
}

type Step = 'paste' | 'preview';

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  paragraph: { label: 'Text', color: 'bg-gray-100 text-gray-700' },
  single_select: { label: 'Single select', color: 'bg-orange-100 text-orange-700' },
  multi_select: { label: 'Multi select', color: 'bg-blue-100 text-blue-700' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onClose: () => void;
  checkId: string;
  onImported: () => void;
}

export function ImportQuestionsDialog({ open, onClose, checkId, onImported }: Props) {
  const [step, setStep] = React.useState<Step>('paste');
  const [mode, setMode] = React.useState<'json' | 'text'>('json');
  const [content, setContent] = React.useState('');
  const [preview, setPreview] = React.useState<PreviewData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(new Set());
  const [expandedSubs, setExpandedSubs] = React.useState<Set<string>>(new Set());

  // Reset state on close.
  const handleClose = () => {
    setStep('paste');
    setContent('');
    setPreview(null);
    setError(null);
    setExpandedSections(new Set());
    setExpandedSubs(new Set());
    onClose();
  };

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSub = (key: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* ---- Preview ---- */
  const handlePreview = async () => {
    if (!content.trim()) {
      setError('Paste your content first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await adminPost<PreviewData>(`/api/admin/health-checks/${checkId}/import`, {
        mode,
        content,
        preview: true,
      });
      if (data.totals.sections === 0) {
        setError('No sections or questions found. Check the format and try again.');
        setLoading(false);
        return;
      }
      setPreview(data);
      setStep('preview');
      // Auto-expand all sections.
      setExpandedSections(new Set(data.sections.map((_, i) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse content.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Import ---- */
  const handleImport = async () => {
    setLoading(true);
    try {
      const result = await adminPost<ImportResult>(`/api/admin/health-checks/${checkId}/import`, {
        mode,
        content,
        preview: false,
      });
      toast.success(`Imported ${result.imported.sections} sections, ${result.imported.questions} questions.`);
      onImported();
      handleClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- JSON Template ---- */
  const jsonTemplate = `{
  "sections": [
    {
      "title": "Section A: Cash Flow",
      "subsections": [
        {
          "heading": "Cash Flow Management",
          "questions": [
            {
              "text": "How do you manage your monthly cash flow?",
              "type": "paragraph",
              "required": true
            },
            {
              "text": "What is your primary revenue source?",
              "type": "single_select",
              "options": ["Product sales", "Services", "Subscription"]
            }
          ]
        }
      ]
    }
  ]
}`;

  /* ---- Text Template ---- */
  const textTemplate = `## Section A: Cash Flow
### Cash Flow Management
How do you manage your monthly cash flow?
[radio] What is your primary revenue source?
- Product sales
- Services
- Subscription
[checkbox] Which expenses do you track monthly?
- Rent
- Salaries
- Marketing
## Section B: Operations
### Daily Operations
What tools do you use for project management?`;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import questions from Google Forms"
      wide
      footer={
        step === 'paste' ? (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
            >
              Cancel
            </button>
            <AsyncButton
              onClick={handlePreview}
              loading={loading}
              loadingLabel="Parsing…"
              label="Preview import"
              icon={<Upload className="h-4 w-4" />}
            />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep('paste')}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
            >
              ← Back to edit
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
            >
              Cancel
            </button>
            <AsyncButton
              onClick={handleImport}
              loading={loading}
              loadingLabel="Importing…"
              label={`Import ${preview?.totals.questions ?? 0} questions`}
              icon={<Check className="h-4 w-4" />}
            />
          </>
        )
      }
    >
      {/* Step 1: Paste content */}
      {step === 'paste' && (
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] p-1">
            <button
              type="button"
              onClick={() => setMode('json')}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors',
                mode === 'json' ? 'bg-[var(--a-card)] text-[var(--a-ink2)] shadow-sm' : 'text-[var(--a-muted)] hover:text-[var(--a-text)]'
              )}
            >
              JSON format
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors',
                mode === 'text' ? 'bg-[var(--a-card)] text-[var(--a-ink2)] shadow-sm' : 'text-[var(--a-muted)] hover:text-[var(--a-text)]'
              )}
            >
              Plain text format
            </button>
          </div>

          {/* Format guide */}
          <div className="rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3 text-xs text-[var(--a-muted)]">
            {mode === 'json' ? (
              <div className="space-y-1.5">
                <p className="font-semibold text-[var(--a-text2)]">JSON structure:</p>
                <p>Each section contains subsections. Each subsection contains questions. Select questions need a <code className="rounded bg-[var(--a-hover)] px-1">options</code> array.</p>
                <p>
                  Types: <code className="rounded bg-[var(--a-hover)] px-1">paragraph</code>, <code className="rounded bg-[var(--a-hover)] px-1">single_select</code>, <code className="rounded bg-[var(--a-hover)] px-1">multi_select</code>
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="font-semibold text-[var(--a-text2)]">Text format rules:</p>
                <p><code className="rounded bg-[var(--a-hover)] px-1">## Title</code> → Section &nbsp;|&nbsp; <code className="rounded bg-[var(--a-hover)] px-1">### Heading</code> → Subsection</p>
                <p><code className="rounded bg-[var(--a-hover)] px-1">[radio] Question</code> → Single select &nbsp;|&nbsp; <code className="rounded bg-[var(--a-hover)] px-1">[checkbox] Question</code> → Multi select</p>
                <p><code className="rounded bg-[var(--a-hover)] px-1">[text] Question</code> → Paragraph &nbsp;|&nbsp; Indented <code className="rounded bg-[var(--a-hover)] px-1">- Option</code> lines = options for select questions</p>
                <p>Plain text without a prefix = paragraph question.</p>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-semibold text-[var(--a-ink2)]">Paste your content</label>
              <button
                type="button"
                onClick={() => setContent(mode === 'json' ? jsonTemplate : textTemplate)}
                className="text-[12px] font-semibold text-[#E8510A] hover:underline"
              >
                Load template
              </button>
            </div>
            <textarea
              rows={14}
              className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 py-3 font-mono text-xs leading-relaxed text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={mode === 'json' ? 'Paste JSON here...' : 'Paste questions here...'}
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className="flex items-center gap-4 rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--a-ink2)]">
              <Layers className="h-4 w-4 text-[#E8510A]" />
              {preview.totals.sections} section{preview.totals.sections === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--a-ink2)]">
              <FileText className="h-4 w-4 text-[#E8510A]" />
              {preview.totals.questions} question{preview.totals.questions === 1 ? '' : 's'}
            </div>
            {preview.totals.options > 0 && (
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--a-ink2)]">
                <ListChecks className="h-4 w-4 text-[#E8510A]" />
                {preview.totals.options} option{preview.totals.options === 1 ? '' : 's'}
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Tree view */}
          <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-[var(--a-border)] bg-[var(--a-card)]">
            {preview.sections.map((section, sIdx) => (
              <div key={sIdx} className="border-b border-[var(--a-border-soft)] last:border-b-0">
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sIdx)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[var(--a-hover)]"
                >
                  {expandedSections.has(sIdx) ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--a-muted)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--a-muted)]" />
                  )}
                  <Layers className="h-4 w-4 shrink-0 text-[#E8510A]" />
                  <span className="text-[13px] font-semibold text-[var(--a-ink2)]">{section.title}</span>
                  <span className="ml-auto text-[11px] text-[var(--a-muted)]">
                    {section.subsections.length} subsection{section.subsections.length === 1 ? '' : 's'}
                  </span>
                </button>

                {/* Subsections (collapsible) */}
                {expandedSections.has(sIdx) && (
                  <div className="pl-6">
                    {section.subsections.map((sub, subIdx) => {
                      const subKey = `${sIdx}-${subIdx}`;
                      return (
                        <div key={subKey} className="border-t border-[var(--a-border-soft)]">
                          {/* Subsection header */}
                          <button
                            type="button"
                            onClick={() => toggleSub(subKey)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--a-hover)]"
                          >
                            {expandedSubs.has(subKey) ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--a-muted)]" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--a-muted)]" />
                            )}
                            <span className="text-[13px] font-medium text-[var(--a-text2)]">{sub.heading}</span>
                            <span className="ml-auto text-[11px] text-[var(--a-muted)]">
                              {sub.questions.length} question{sub.questions.length === 1 ? '' : 's'}
                            </span>
                          </button>

                          {/* Questions */}
                          {expandedSubs.has(subKey) && (
                            <div className="pl-6 pb-2">
                              {sub.questions.map((q, qIdx) => {
                                const badge = TYPE_BADGE[q.type] ?? TYPE_BADGE.paragraph;
                                return (
                                  <div key={qIdx} className="flex items-start gap-2 px-4 py-2">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--a-hover)] text-[10px] font-bold text-[var(--a-muted)]">
                                      {qIdx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[13px] text-[var(--a-ink2)]">{q.text}</p>
                                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                        <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold', badge.color)}>
                                          {badge.label}
                                        </span>
                                        {!q.required && (
                                          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                            Optional
                                          </span>
                                        )}
                                      </div>
                                      {q.options.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {q.options.map((opt, oIdx) => (
                                            <span key={oIdx} className="inline-flex items-center rounded bg-[var(--a-hover)] px-2 py-0.5 text-[11px] text-[var(--a-muted)]">
                                              {opt}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[var(--a-muted)]">
            Review the structure above. Click &quot;Import&quot; to add these questions to this health check.
          </p>
        </div>
      )}
    </Modal>
  );
}
