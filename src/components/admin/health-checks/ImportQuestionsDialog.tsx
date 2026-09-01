'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Check, ChevronDown, ChevronRight, FileText, Layers, ListChecks, Loader2, Upload, Pencil } from 'lucide-react';
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
  _selected?: boolean;
}

interface PreviewData {
  preview: true;
  sections: PreviewSection[];
  totals: { sections: number; questions: number; options: number };
}

interface ImportResult {
  success: boolean;
  imported: { sections: number; questions: number; options: number };
  skipped?: number;
}

type Step = 'paste' | 'preview';

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  paragraph: { label: 'Text', color: 'bg-gray-100 text-gray-700' },
  single_select: { label: 'Single select', color: 'bg-orange-100 text-orange-700' },
  multi_select: { label: 'Multi select', color: 'bg-blue-100 text-blue-700' },
};

/* ------------------------------------------------------------------ */
/*  Inline editable field                                              */
/* ------------------------------------------------------------------ */

function InlineField({
  value,
  onChange,
  className,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => { setDraft(value); }, [value]);

  if (!editing) {
    return (
      <span
        className={cn('group inline-flex items-center gap-1 cursor-pointer hover:bg-[var(--a-hover)] rounded px-1 -mx-1', className)}
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        {value || <span className="italic text-[var(--a-muted)]">Empty</span>}
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-[var(--a-muted)]" />
      </span>
    );
  }

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed !== value) onChange(trimmed);
    setEditing(false);
  };

  if (multiline) {
    return (
      <textarea
        rows={2}
        className="w-full rounded border border-[#E8510A] bg-[var(--a-card)] px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        autoFocus
      />
    );
  }

  return (
    <input
      type="text"
      className="w-full rounded border border-[#E8510A] bg-[var(--a-card)] px-2 py-1 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
      autoFocus
    />
  );
}

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
  const [selectedSections, setSelectedSections] = React.useState<Set<number>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(new Set());
  const [expandedSubs, setExpandedSubs] = React.useState<Set<string>>(new Set());
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep('paste');
    setContent('');
    setPreview(null);
    setSelectedSections(new Set());
    setError(null);
    setExpandedSections(new Set());
    setExpandedSubs(new Set());
    setDragging(false);
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

  const toggleSelected = (idx: number) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    if (!preview) return;
    setSelectedSections(new Set(preview.sections.map((_, i) => i)));
  };

  const deselectAll = () => setSelectedSections(new Set());

  /* ---- File handling ---- */
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      if (file.name.endsWith('.json')) setMode('json');
      else setMode('text');
    };
    reader.readAsText(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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
      setSelectedSections(new Set(data.sections.map((_, i) => i)));
      setExpandedSections(new Set(data.sections.map((_, i) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse content.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Import ---- */
  const handleImport = async () => {
    if (!preview) return;

    // Collect selected section titles.
    const selectedTitles = [...selectedSections].map((i) => preview.sections[i]?.title).filter(Boolean);
    if (selectedTitles.length === 0) {
      toast.error('Select at least one section to import.');
      return;
    }

    setLoading(true);
    try {
      // Build modified content with edited titles/headings/text if needed.
      const result = await adminPost<ImportResult>(`/api/admin/health-checks/${checkId}/import`, {
        mode,
        content,
        preview: false,
        selectedSections: selectedTitles,
      });
      const skippedMsg = result.skipped ? ` (${result.skipped} duplicate section${result.skipped === 1 ? '' : 's'} skipped)` : '';
      toast.success(`Imported ${result.imported.sections} sections, ${result.imported.questions} questions${skippedMsg}.`);
      onImported();
      handleClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Compute selected totals ---- */
  const selectedTotals = React.useMemo(() => {
    if (!preview) return { sections: 0, questions: 0, options: 0 };
    let questions = 0, options = 0;
    for (const i of selectedSections) {
      const s = preview.sections[i];
      if (!s) continue;
      for (const sub of s.subsections) {
        questions += sub.questions.length;
        for (const q of sub.questions) options += q.options.length;
      }
    }
    return { sections: selectedSections.size, questions, options };
  }, [preview, selectedSections]);

  /* ---- Templates ---- */
  const jsonTemplate = `{
  "sections": [
    {
      "title": "Section A: Cash Flow",
      "description": "Optional section description",
      "subsections": [
        {
          "heading": "Cash Flow Management",
          "description": "Optional subsection description",
          "questions": [
            {
              "text": "How do you manage your monthly cash flow?",
              "type": "paragraph",
              "required": true,
              "helper_text": "Optional helper text shown below the question"
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

  const textTemplate = `## Section A: Cash Flow
Optional section description goes here

### Cash Flow Management
Optional subsection description goes here

How do you manage your monthly cash flow?
> Helper text: Include budgeting, forecasting, and monitoring

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
      title="Import questions"
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
              label={`Import ${selectedTotals.questions} questions from ${selectedTotals.sections} sections`}
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
                <p>Each section contains subsections. Each subsection contains questions.</p>
                <p>
                  Types: <code className="rounded bg-[var(--a-hover)] px-1">paragraph</code>, <code className="rounded bg-[var(--a-hover)] px-1">single_select</code>, <code className="rounded bg-[var(--a-hover)] px-1">multi_select</code>
                </p>
                <p>Select questions <strong>must</strong> include an <code className="rounded bg-[var(--a-hover)] px-1">options</code> array of strings.</p>
                <p>Optional fields: <code className="rounded bg-[var(--a-hover)] px-1">description</code> (on sections/subsections), <code className="rounded bg-[var(--a-hover)] px-1">helper_text</code> and <code className="rounded bg-[var(--a-hover)] px-1">required</code> (on questions).</p>
                <p className="mt-2 font-semibold text-[var(--a-text2)]">Example — single select:</p>
                <pre className="overflow-x-auto rounded bg-[var(--a-card)] p-2 text-[10px] leading-relaxed">{`{
  "text": "What is your primary revenue source?",
  "type": "single_select",
  "options": ["Product sales", "Services", "Subscription"]
}`}</pre>
                <p className="mt-2 font-semibold text-[var(--a-text2)]">Example — multi select:</p>
                <pre className="overflow-x-auto rounded bg-[var(--a-card)] p-2 text-[10px] leading-relaxed">{`{
  "text": "Which expenses do you track?",
  "type": "multi_select",
  "options": ["Rent", "Salaries", "Marketing", "Utilities"]
}`}</pre>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-[var(--a-text2)]">Text format rules:</p>

                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-[var(--a-text2)]">Headings</p>
                    <p><code className="rounded bg-[var(--a-hover)] px-1">## Title</code> → Section</p>
                    <p><code className="rounded bg-[var(--a-hover)] px-1">### Heading</code> → Subsection</p>
                    <p>Lines immediately after a heading (before any question) become the section/subsection description.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--a-text2)]">Question types</p>
                    <p><code className="rounded bg-[var(--a-hover)] px-1">[radio] Question</code> → Single select</p>
                    <p><code className="rounded bg-[var(--a-hover)] px-1">[checkbox] Question</code> → Multi select</p>
                    <p><code className="rounded bg-[var(--a-hover)] px-1">[text] Question</code> → Paragraph (open text)</p>
                    <p>Plain text without a prefix → Paragraph question</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-[var(--a-text2)]">Options (for [radio] and [checkbox] questions)</p>
                  <p>Each option <strong>must</strong> start with <code className="rounded bg-[var(--a-hover)] px-1">- </code> (hyphen + space) or <code className="rounded bg-[var(--a-hover)] px-1">* </code> (asterisk + space) on its own line, directly below the question.</p>
                  <p><strong>Options only attach to the most recent [radio] or [checkbox] question.</strong> A blank line or new question ends the option list.</p>
                </div>

                <div>
                  <p className="font-semibold text-[var(--a-text2)]">Other</p>
                  <p><code className="rounded bg-[var(--a-hover)] px-1">&gt; Helper text</code> on the line after a question → attached as helper_text.</p>
                  <p><code className="rounded bg-[var(--a-hover)] px-1">required</code> defaults to true. Add <code className="rounded bg-[var(--a-hover)] px-1">[optional]</code> before a question to make it optional.</p>
                </div>

                <div className="rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-card)] p-3">
                  <p className="mb-1.5 font-semibold text-[var(--a-text2)]">Full example — copy & paste:</p>
                  <pre className="overflow-x-auto text-[10px] leading-relaxed">{`## Financial Management
Revenue and cash flow assessment

### Revenue Sources
[radio] What is your primary revenue source?
- Product sales
- Services
- Subscription
- Other

[checkbox] Which revenue streams do you have?
- Product sales
- Consulting
- Training
- Licensing

> Select all that apply

### Cash Flow
[text] Describe your monthly cash flow process
> Include budgeting, forecasting, and monitoring

[radio] How often do you review cash flow?
- Daily
- Weekly
- Monthly
- Quarterly`}</pre>
                </div>
              </div>
            )}
          </div>

          {/* File upload + textarea */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-semibold text-[var(--a-ink2)]">Paste or drop a file</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[12px] font-semibold text-[#E8510A] hover:underline"
                >
                  Upload file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt,.md"
                  onChange={onFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => setContent(mode === 'json' ? jsonTemplate : textTemplate)}
                  className="text-[12px] font-semibold text-[#E8510A] hover:underline"
                >
                  Load template
                </button>
              </div>
            </div>
            <div
              className={cn(
                'relative rounded-lg border-2 border-dashed transition-colors',
                dragging ? 'border-[#E8510A] bg-[#E8510A]/5' : 'border-[var(--a-border)]',
                !content && 'min-h-[200px]'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {dragging && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#E8510A]/5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#E8510A]">
                    <Upload className="h-5 w-5" />
                    Drop file here
                  </div>
                </div>
              )}
              <textarea
                rows={14}
                className="w-full rounded-lg bg-transparent px-3.5 py-3 font-mono text-xs leading-relaxed text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={mode === 'json' ? 'Paste JSON here, or drag a .json / .txt file...' : 'Paste questions here, or drag a .txt file...'}
                spellCheck={false}
              />
            </div>
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
              {selectedTotals.sections} of {preview.totals.sections} section{preview.totals.sections === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--a-ink2)]">
              <FileText className="h-4 w-4 text-[#E8510A]" />
              {selectedTotals.questions} question{selectedTotals.questions === 1 ? '' : 's'}
            </div>
            {selectedTotals.options > 0 && (
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--a-ink2)]">
                <ListChecks className="h-4 w-4 text-[#E8510A]" />
                {selectedTotals.options} option{selectedTotals.options === 1 ? '' : 's'}
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={selectAll} className="text-[11px] font-semibold text-[#E8510A] hover:underline">All</button>
              <span className="text-[var(--a-muted)]">|</span>
              <button type="button" onClick={deselectAll} className="text-[11px] font-semibold text-[var(--a-muted)] hover:underline">None</button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Tree view */}
          <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-[var(--a-border)] bg-[var(--a-card)]">
            {preview.sections.map((section, sIdx) => {
              const isSelected = selectedSections.has(sIdx);
              return (
                <div key={sIdx} className={cn('border-b border-[var(--a-border-soft)] last:border-b-0', !isSelected && 'opacity-50')}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-[var(--a-hover)]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(sIdx)}
                      className="h-4 w-4 shrink-0 rounded border-[var(--a-border)] text-[#E8510A] focus:ring-[#E8510A]/20"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSection(sIdx)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {expandedSections.has(sIdx) ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--a-muted)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--a-muted)]" />
                      )}
                      <Layers className="h-4 w-4 shrink-0 text-[#E8510A]" />
                      <span className="text-[13px] font-semibold text-[var(--a-ink2)]">
                        <InlineField
                          value={section.title}
                          onChange={(v) => {
                            const updated = { ...preview, sections: preview.sections.map((s, i) => i === sIdx ? { ...s, title: v } : s) };
                            setPreview(updated);
                          }}
                        />
                      </span>
                      <span className="ml-auto text-[11px] text-[var(--a-muted)]">
                        {section.subsections.length} subsection{section.subsections.length === 1 ? '' : 's'}
                      </span>
                    </button>
                  </div>

                  {expandedSections.has(sIdx) && (
                    <div className="pl-10">
                      {section.subsections.map((sub, subIdx) => {
                        const subKey = `${sIdx}-${subIdx}`;
                        return (
                          <div key={subKey} className="border-t border-[var(--a-border-soft)]">
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
                              <span className="text-[13px] font-medium text-[var(--a-text2)]">
                                <InlineField
                                  value={sub.heading}
                                  onChange={(v) => {
                                    const updated = { ...preview, sections: preview.sections.map((s, i) => i === sIdx ? { ...s, subsections: s.subsections.map((sub2, j) => j === subIdx ? { ...sub2, heading: v } : sub2) } : s) };
                                    setPreview(updated);
                                  }}
                                />
                              </span>
                              <span className="ml-auto text-[11px] text-[var(--a-muted)]">
                                {sub.questions.length} question{sub.questions.length === 1 ? '' : 's'}
                              </span>
                            </button>

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
                                        <p className="text-[13px] text-[var(--a-ink2)]">
                                          <InlineField
                                            value={q.text}
                                            onChange={(v) => {
                                              const updated = { ...preview, sections: preview.sections.map((s, i) => i === sIdx ? { ...s, subsections: s.subsections.map((sub2, j) => j === subIdx ? { ...sub2, questions: sub2.questions.map((q2, k) => k === qIdx ? { ...q2, text: v } : q2) } : sub2) } : s) };
                                              setPreview(updated);
                                            }}
                                          />
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                          <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold', badge.color)}>
                                            {badge.label}
                                          </span>
                                          {!q.required && (
                                            <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                              Optional
                                            </span>
                                          )}
                                          {q.helper_text && (
                                            <span className="inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                                              Has helper text
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
              );
            })}
          </div>

          <p className="text-center text-xs text-[var(--a-muted)]">
            Select sections to import. Click &quot;Import&quot; to add the selected questions to this health check.
          </p>
        </div>
      )}
    </Modal>
  );
}
