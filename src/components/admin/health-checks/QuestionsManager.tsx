'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Layers, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { AdminCard, AsyncButton, EmptyState, ErrorBanner, Loading, Modal, PageHeader, StatusPill, Toggle } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  question_id: string;
  option_text: string;
  sort_order: number;
}

interface Question {
  id: string;
  subsection_id: string;
  question_text: string;
  question_type: 'paragraph' | 'single_select' | 'multi_select';
  is_required: boolean;
  helper_text: string | null;
  sort_order: number;
  options: Option[];
}

interface Subsection {
  id: string;
  heading: string;
  description: string | null;
}

interface Section {
  id: string;
  title: string;
  subsections: Subsection[];
}

type QuestionType = Question['question_type'];

const TYPE_LABELS: Record<QuestionType, string> = {
  paragraph: 'Paragraph',
  single_select: 'Single select',
  multi_select: 'Multi select',
};

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

export function QuestionsManager() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const checkId = params.id;
  const confirm = useConfirm();

  const [sections, setSections] = React.useState<Section[]>([]);
  const [selectedSubsection, setSelectedSubsection] = React.useState<string | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Question editor state
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [questionText, setQuestionText] = React.useState('');
  const [questionType, setQuestionType] = React.useState<QuestionType>('paragraph');
  const [isRequired, setIsRequired] = React.useState(true);
  const [helperText, setHelperText] = React.useState('');
  const [options, setOptions] = React.useState<string[]>([]);
  const [savingQuestion, setSavingQuestion] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { sections: rows } = await adminFetch<{ sections: Section[] }>(`/api/admin/health-checks/${checkId}/sections`);
        if (cancelled) return;
        setSections(rows);
        const fromUrl = searchParams.get('subsection_id');
        const first = rows.flatMap((s) => s.subsections)[0];
        const initial = fromUrl ?? first?.id ?? null;
        setSelectedSubsection(initial);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load the question tree.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkId]);

  React.useEffect(() => {
    if (!selectedSubsection) {
      setQuestions([]);
      return;
    }
    let cancelled = false;
    setQuestionsLoading(true);
    (async () => {
      try {
        const { questions: rows } = await adminFetch<{ questions: Question[] }>(
          `/api/admin/health-checks/${checkId}/questions?subsection_id=${selectedSubsection}`
        );
        if (!cancelled) setQuestions(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load questions.');
      } finally {
        if (!cancelled) setQuestionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkId, selectedSubsection]);

  const openNew = () => {
    setEditingId(null);
    setQuestionText('');
    setQuestionType('paragraph');
    setIsRequired(true);
    setHelperText('');
    setOptions([]);
    setEditorOpen(true);
  };

  const openEdit = (question: Question) => {
    setEditingId(question.id);
    setQuestionText(question.question_text);
    setQuestionType(question.question_type);
    setIsRequired(question.is_required);
    setHelperText(question.helper_text ?? '');
    setOptions(question.options.map((o) => o.option_text));
    setEditorOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedSubsection) return;
    if (!questionText.trim()) {
      toast.error('Question text is required.');
      return;
    }
    if ((questionType === 'single_select' || questionType === 'multi_select') && options.length === 0) {
      toast.error('Select questions need at least one option.');
      return;
    }

    setSavingQuestion(true);
    const payload = {
      question_text: questionText.trim(),
      question_type: questionType,
      is_required: isRequired,
      helper_text: helperText.trim() || null,
      options: (questionType === 'paragraph' ? [] : options.filter((o) => o.trim())).map((text) => ({ option_text: text.trim() })),
    };

    try {
      if (editingId) {
        const { question } = await adminPut<{ question: Question }>(`/api/admin/health-checks/${checkId}/questions/${editingId}`, payload);
        setQuestions((prev) => prev.map((q) => (q.id === editingId ? question : q)));
        toast.success('Question updated');
      } else {
        const { question } = await adminPost<{ question: Question }>(`/api/admin/health-checks/${checkId}/questions`, {
          ...payload,
          subsection_id: selectedSubsection,
        });
        setQuestions((prev) => [...prev, question]);
        toast.success('Question added');
      }
      setEditorOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    try {
      const ok = await confirm({
        message: 'Delete this question? This cannot be undone.',
        action: async () => {
          await adminDelete(`/api/admin/health-checks/${checkId}/questions/${question.id}`);
        },
      });
      if (!ok) return;
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
      toast.success('Question deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete question.');
    }
  };

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = questions.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
    try {
      await adminPut(`/api/admin/health-checks/${checkId}/questions`, {
        questions: next.map((q, i) => ({ id: q.id, sort_order: i + 1 })),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save question order.');
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading question tree…" />;

  const selectedSub = sections.flatMap((s) => s.subsections).find((sub) => sub.id === selectedSubsection);

  return (
    <>
      <PageHeader
        title="Questions"
        subtitle="Select a subsection on the left to manage its questions."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Questions' }]}
        actions={
          selectedSubsection ? (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 text-[13px] font-bold text-white hover:bg-[#c94508]"
            >
              <Plus className="h-4 w-4" /> Add question
            </button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left: section → subsection tree */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)]">
              <div className="flex items-center gap-2 border-b border-[var(--a-border-soft)] px-3 py-2.5">
                <Layers className="h-3.5 w-3.5 text-[#E8510A]" />
                <span className="truncate text-[13px] font-semibold text-[var(--a-ink2)]">{section.title}</span>
              </div>
              <div className="p-1.5">
                {section.subsections.length === 0 && <p className="px-2 py-2 text-xs text-[var(--a-placeholder)]">No subsections</p>}
                {section.subsections.map((subsection) => (
                  <button
                    key={subsection.id}
                    type="button"
                    onClick={() => setSelectedSubsection(subsection.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                      selectedSubsection === subsection.id
                        ? 'bg-[#E8510A]/10 font-semibold text-[#c94508]'
                        : 'text-[var(--a-text)] hover:bg-[var(--a-hover)]'
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', selectedSubsection === subsection.id ? 'bg-[#E8510A]' : 'bg-[var(--a-track)]')} />
                    <span className="truncate">{subsection.heading}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Link href={`/admin/health-checks/${checkId}/sections`} className="block text-center text-[13px] font-semibold text-[#E8510A] hover:underline">
            Manage sections & subsections →
          </Link>
        </div>

        {/* Right: questions for selected subsection */}
        <div>
          <AdminCard
            title={selectedSub ? `Questions in “${selectedSub.heading}”` : 'Select a subsection'}
            subtitle={selectedSub ? `${questions.length} question${questions.length === 1 ? '' : 's'}` : 'Choose a subsection from the tree to see its questions.'}
            bodyClassName="p-0"
          >
            {!selectedSubsection ? (
              <EmptyState title="No subsection selected" description="Pick a subsection from the tree on the left." />
            ) : questionsLoading ? (
              <Loading label="Loading questions…" />
            ) : questions.length === 0 ? (
              <EmptyState
                title="No questions here yet"
                description="Add the first question to this subsection."
                action={
                  <button
                    type="button"
                    onClick={openNew}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#c94508]"
                  >
                    <Plus className="h-4 w-4" /> Add question
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[var(--a-border-soft)]">
                {questions.map((question, index) => (
                  <div key={question.id} className="group flex items-start gap-3 px-5 py-4">
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="rounded p-0.5 text-[var(--a-placeholder)] hover:text-[#E8510A] disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-bold text-[var(--a-placeholder)]">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                        aria-label="Move down"
                        className="rounded p-0.5 text-[var(--a-placeholder)] hover:text-[#E8510A] disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-relaxed text-[var(--a-ink2)]">{question.question_text}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusPill tone={question.question_type === 'paragraph' ? 'grey' : question.question_type === 'single_select' ? 'orange' : 'blue'}>
                          {TYPE_LABELS[question.question_type]}
                        </StatusPill>
                        {!question.is_required && <StatusPill tone="amber">Optional</StatusPill>}
                        {question.options.length > 0 && (
                          <span className="text-[11px] text-[var(--a-muted)]">{question.options.length} options</span>
                        )}
                      </div>
                      {question.helper_text && <p className="mt-1 text-xs italic text-[var(--a-muted)]">{question.helper_text}</p>}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={() => openEdit(question)} aria-label="Edit" className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)]">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDeleteQuestion(question)} aria-label="Delete" className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      </div>

      {/* Question editor modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit question' : 'Add question'}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
            >
              Cancel
            </button>
            <AsyncButton
              onClick={handleSaveQuestion}
              loading={savingQuestion}
              loadingLabel="Saving…"
              label="Save question"
              icon={<Save className="h-4 w-4" />}
            />
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">
              Question text <span className="text-[#E8510A]">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 py-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. What is your current monthly revenue?"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Answer type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['paragraph', 'single_select', 'multi_select'] as QuestionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQuestionType(type)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors',
                    questionType === type ? 'border-[#E8510A] bg-[#E8510A]/5 text-[#c94508]' : 'border-[var(--a-border)] text-[var(--a-text2)] hover:border-[#E8510A]/40'
                  )}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {questionType !== 'paragraph' && (
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Options</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--a-hover)] text-[11px] font-bold text-[var(--a-muted)]">
                      {index + 1}
                    </span>
                    <input
                      className={INPUT_CLASS}
                      value={option}
                      onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === index ? e.target.value : o)))}
                      placeholder={`Option ${index + 1}`}
                    />
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = options.slice();
                          [next[index], next[index - 1]] = [next[index - 1], next[index]];
                          setOptions(next);
                        }}
                        disabled={index === 0}
                        className="rounded p-0.5 text-[var(--a-placeholder)] hover:text-[#E8510A] disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = options.slice();
                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                          setOptions(next);
                        }}
                        disabled={index === options.length - 1}
                        className="rounded p-0.5 text-[var(--a-placeholder)] hover:text-[#E8510A] disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600"
                      aria-label="Remove option"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOptions((prev) => [...prev, ''])}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#E8510A] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Helper text</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 py-2.5 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              value={helperText}
              onChange={(e) => setHelperText(e.target.value)}
              placeholder="Optional guidance shown under the question"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--a-ink2)]">Required</p>
              <p className="text-xs text-[var(--a-muted)]">Visitors must answer this question</p>
            </div>
            <Toggle checked={isRequired} onChange={setIsRequired} label="Required" />
          </div>
        </div>
      </Modal>
    </>
  );
}
