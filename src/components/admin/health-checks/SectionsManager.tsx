'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, Layers, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { AdminCard, AsyncButton, EmptyState, ErrorBanner, Loading, PageHeader } from '@/components/admin/ui';

interface Subsection {
  id: string;
  section_id: string;
  heading: string;
  description: string | null;
  sort_order: number;
}

interface Section {
  id: string;
  health_check_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  subsections: Subsection[];
}

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

function SortableSection({
  section,
  index,
  total,
  onMove,
  onEdit,
  onDelete,
  children,
}: {
  section: Section;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-20 opacity-60' : ''}
    >
      <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 border-b border-[var(--a-border-soft)] px-3 py-2.5">
          <button type="button" className="cursor-grab text-[var(--a-placeholder)] hover:text-[#E8510A]" aria-label="Drag to reorder" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8510A]/10 text-[11px] font-bold text-[#c94508]">
            {index + 1}
          </div>
          <span className="flex-1 truncate text-sm font-semibold text-[var(--a-ink2)]">{section.title}</span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onMove(index, index - 1)}
              disabled={index === 0}
              aria-label="Move up"
              className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)] disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, index + 1)}
              disabled={index === total - 1}
              aria-label="Move down"
              className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)] disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={onEdit} aria-label="Edit section" className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)]">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} aria-label="Delete section" className="rounded p-1 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-2 p-3">{children}</div>
      </div>
    </div>
  );
}

export function SectionsManager() {
  const confirm = useConfirm();
  const params = useParams<{ id: string }>();
  const checkId = params.id;

  const [sections, setSections] = React.useState<Section[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [addingSection, setAddingSection] = React.useState(false);
  const [newSectionTitle, setNewSectionTitle] = React.useState('');
  // Tracks which inline action is busy so its button shows a spinner.
  const [busyAction, setBusyAction] = React.useState<string | null>(null);

  // Inline edit state
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editingSubsectionId, setEditingSubsectionId] = React.useState<string | null>(null);
  const [editHeading, setEditHeading] = React.useState('');
  const [addingSubsectionFor, setAddingSubsectionFor] = React.useState<string | null>(null);
  const [newSubsectionHeading, setNewSubsectionHeading] = React.useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = React.useCallback(async () => {
    try {
      const { sections: rows } = await adminFetch<{ sections: Section[] }>(`/api/admin/health-checks/${checkId}/sections`);
      setSections(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sections.');
    } finally {
      setLoading(false);
    }
  }, [checkId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const persistOrder = async (ordered: Section[]) => {
    setSections(ordered);
    try {
      await adminPut(`/api/admin/health-checks/${checkId}/sections`, {
        sections: ordered.map((section, index) => ({ id: section.id, sort_order: index + 1 })),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save the new order.');
      void load();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void persistOrder(arrayMove(sections, oldIndex, newIndex));
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    setBusyAction('section:new');
    try {
      const { section } = await adminPost<{ section: Section }>(`/api/admin/health-checks/${checkId}/sections`, {
        title: newSectionTitle.trim(),
      });
      setSections((prev) => [...prev, section]);
      setNewSectionTitle('');
      setAddingSection(false);
      toast.success('Section added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add section.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveSection = async (section: Section) => {
    setBusyAction(`section:${section.id}`);
    try {
      const { section: updated } = await adminPut<{ section: Section }>(
        `/api/admin/health-checks/${checkId}/sections/${section.id}`,
        { title: editTitle, description: section.description }
      );
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, ...updated } : s)));
      setEditingSectionId(null);
      toast.success('Section saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save section.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteSection = async (section: Section) => {
    try {
      const ok = await confirm({
        message: `Delete section "${section.title}"? All its subsections and questions are removed.`,
        action: async () => {
          await adminDelete(`/api/admin/health-checks/${checkId}/sections/${section.id}`);
        },
      });
      if (!ok) return;
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast.success('Section deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete section.');
    }
  };

  const handleCreateSubsection = async (sectionId: string) => {
    if (!newSubsectionHeading.trim()) return;
    setBusyAction(`subsection:new:${sectionId}`);
    try {
      const { subsection } = await adminPost<{ subsection: Subsection }>(
        `/api/admin/health-checks/${checkId}/sections/${sectionId}`,
        { heading: newSubsectionHeading.trim() }
      );
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, subsections: [...s.subsections, subsection] } : s)));
      setNewSubsectionHeading('');
      setAddingSubsectionFor(null);
      toast.success('Subsection added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add subsection.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveSubsection = async (sectionId: string, subsection: Subsection) => {
    setBusyAction(`subsection:${subsection.id}`);
    try {
      const { subsection: updated } = await adminPut<{ subsection: Subsection }>(
        `/api/admin/health-checks/${checkId}/sections/${sectionId}/subsections/${subsection.id}`,
        { heading: editHeading, description: subsection.description }
      );
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, subsections: s.subsections.map((sub) => (sub.id === subsection.id ? { ...sub, ...updated } : sub)) } : s))
      );
      setEditingSubsectionId(null);
      toast.success('Subsection saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save subsection.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteSubsection = async (sectionId: string, subsection: Subsection) => {
    try {
      const ok = await confirm({
        message: `Delete subsection "${subsection.heading}"? All its questions are removed.`,
        action: async () => {
          await adminDelete(`/api/admin/health-checks/${checkId}/sections/${sectionId}/subsections/${subsection.id}`);
        },
      });
      if (!ok) return;
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, subsections: s.subsections.filter((sub) => sub.id !== subsection.id) } : s)));
      toast.success('Subsection deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete subsection.');
    }
  };

  const moveSubsection = async (sectionId: string, index: number, direction: -1 | 1) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const target = index + direction;
    if (target < 0 || target >= section.subsections.length) return;
    const next = section.subsections.slice();
    [next[index], next[target]] = [next[target], next[index]];
    const updated = sections.map((s) => (s.id === sectionId ? { ...s, subsections: next } : s));
    setSections(updated);
    try {
      await adminPut(`/api/admin/health-checks/${checkId}/sections/${sectionId}/subsections`, {
        subsections: next.map((sub, i) => ({ id: sub.id, sort_order: i + 1 })),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save subsection order.');
      void load();
    }
  };

  if (error) return <ErrorBanner message={error} />;
  if (loading) return <Loading label="Loading sections…" />;

  return (
    <>
      <PageHeader
        title="Sections & Subsections"
        subtitle="Structure the assessment into sections, each containing subsections of questions."
        crumbs={[{ label: 'Health Checks', href: '/admin/health-checks' }, { label: 'Sections' }]}
        actions={
          <Link
            href={`/admin/health-checks/${checkId}/questions`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 text-[13px] font-semibold text-[var(--a-text)] hover:border-[#E8510A]/40 hover:text-[#E8510A]"
          >
            <Layers className="h-4 w-4" /> Manage questions
          </Link>
        }
      />

      {sections.length === 0 && !addingSection ? (
        <EmptyState
          title="No sections yet"
          description="Add your first section to start structuring this health check."
          action={
            <button
              type="button"
              onClick={() => setAddingSection(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#c94508]"
            >
              <Plus className="h-4 w-4" /> Add section
            </button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map((section, index) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  index={index}
                  total={sections.length}
                  onMove={(from, to) => void persistOrder(arrayMove(sections, from, to))}
                  onEdit={() => {
                    setEditingSectionId(section.id);
                    setEditTitle(section.title);
                  }}
                  onDelete={() => handleDeleteSection(section)}
                >
                  {section.description && !editingSectionId && (
                    <p className="px-1 text-xs text-[var(--a-muted)]">{section.description}</p>
                  )}

                  {editingSectionId === section.id ? (
                    <div className="flex gap-2">
                      <input className={INPUT_CLASS} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                      <AsyncButton
                        onClick={() => handleSaveSection(section)}
                        loading={busyAction === `section:${section.id}`}
                        loadingLabel="Saving…"
                        label="Save"
                        icon={<Save className="h-3.5 w-3.5" />}
                        size="sm"
                      />
                    </div>
                  ) : null}

                  {section.subsections.map((subsection, subIndex) => (
                    <div key={subsection.id} className="group flex items-center gap-2 rounded-md border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-3 py-2">
                      {editingSubsectionId === subsection.id ? (
                        <>
                          <input className={INPUT_CLASS} value={editHeading} onChange={(e) => setEditHeading(e.target.value)} autoFocus />
                          <AsyncButton
                            onClick={() => handleSaveSubsection(section.id, subsection)}
                            loading={busyAction === `subsection:${subsection.id}`}
                            loadingLabel="Saving…"
                            label="Save"
                            icon={<Save className="h-3.5 w-3.5" />}
                            size="sm"
                          />
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E8510A]/50" />
                          <span className="flex-1 truncate text-[13px] font-medium text-[var(--a-ink2)]">{subsection.heading}</span>
                          <Link
                            href={`/admin/health-checks/${checkId}/questions?subsection_id=${subsection.id}`}
                            className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[#E8510A]"
                            title="Manage questions"
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => moveSubsection(section.id, subIndex, -1)}
                            disabled={subIndex === 0}
                            aria-label="Move up"
                            className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] disabled:opacity-30"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSubsection(section.id, subIndex, 1)}
                            disabled={subIndex === section.subsections.length - 1}
                            aria-label="Move down"
                            className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] disabled:opacity-30"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubsectionId(subsection.id);
                              setEditHeading(subsection.heading);
                            }}
                            aria-label="Edit"
                            className="rounded p-1 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubsection(section.id, subsection)}
                            aria-label="Delete"
                            className="rounded p-1 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {addingSubsectionFor === section.id ? (
                    <div className="flex gap-2">
                      <input
                        className={INPUT_CLASS}
                        value={newSubsectionHeading}
                        onChange={(e) => setNewSubsectionHeading(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSubsection(section.id)}
                        placeholder="Subsection heading…"
                        autoFocus
                      />
                      <AsyncButton
                        onClick={() => handleCreateSubsection(section.id)}
                        loading={busyAction === `subsection:new:${section.id}`}
                        loadingLabel="Adding…"
                        label="Add"
                        size="sm"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingSubsectionFor(section.id);
                        setNewSubsectionHeading('');
                      }}
                      className="flex items-center gap-1.5 px-1 text-[12px] font-semibold text-[#E8510A] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add subsection
                    </button>
                  )}
                </SortableSection>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {addingSection ? (
        <div className="mt-4 flex gap-2">
          <input
            className={INPUT_CLASS}
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
            placeholder="Section title…"
            autoFocus
          />
          <AsyncButton
            onClick={handleCreateSection}
            loading={busyAction === 'section:new'}
            loadingLabel="Adding…"
            label="Add section"
            icon={<Plus className="h-4 w-4" />}
          />
        </div>
      ) : (
        sections.length > 0 && (
          <button
            type="button"
            onClick={() => setAddingSection(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--a-border)] px-4 py-2.5 text-[13px] font-semibold text-[#E8510A] hover:border-[#E8510A]/50"
          >
            <Plus className="h-4 w-4" /> Add section
          </button>
        )
      )}

      <p className="mt-4 text-xs text-[var(--a-muted)]">Drag sections by their handle to reorder. Subsections use the arrow buttons.</p>
    </>
  );
}
