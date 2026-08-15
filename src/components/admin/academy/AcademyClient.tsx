'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { AdminCard, AsyncButton, EmptyState, ErrorBanner, Field, Loading, Modal, PageHeader, StatusPill, Toggle } from '@/components/admin/ui';

interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  format: string;
  duration: string;
  level: string;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

const EMPTY_FORM = { title: '', category: '', format: '', duration: '', level: 'All Levels', description: '' };

export function AcademyClient() {
  const confirm = useConfirm();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState('0');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const { courses: rows } = await adminFetch<{ courses: Course[] }>('/api/admin/academy/courses');
      setCourses(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFeatured(false);
    setIsActive(true);
    setSortOrder('0');
    setEditorOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      category: course.category,
      format: course.format,
      duration: course.duration,
      level: course.level,
      description: course.description ?? '',
    });
    setIsFeatured(course.is_featured);
    setIsActive(course.is_active);
    setSortOrder(course.sort_order.toString());
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.format.trim() || !form.duration.trim()) {
      toast.error('Title, category, format and duration are required.');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      format: form.format.trim(),
      duration: form.duration.trim(),
      level: form.level,
      description: form.description.trim() || null,
      is_featured: isFeatured,
      is_active: isActive,
      sort_order: Number(sortOrder || 0),
    };
    try {
      if (editingId) {
        const { course } = await adminPut<{ course: Course }>(`/api/admin/academy/courses/${editingId}`, payload);
        setCourses((prev) => prev.map((c) => (c.id === editingId ? course : c)));
        toast.success('Course updated');
      } else {
        const { course } = await adminPost<{ course: Course }>('/api/admin/academy/courses', payload);
        setCourses((prev) => [...prev, course]);
        toast.success('Course created');
      }
      setEditorOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course: Course) => {
    try {
      const ok = await confirm({
        message: `Delete course "${course.title}"?`,
        action: async () => {
          await adminDelete(`/api/admin/academy/courses/${course.id}`);
        },
      });
      if (!ok) return;
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      toast.success('Course deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete course.');
    }
  };

  const handleToggle = async (course: Course, field: 'is_active' | 'is_featured') => {
    try {
      const { course: updated } = await adminPut<{ course: Course }>(`/api/admin/academy/courses/${course.id}`, { [field]: !course[field] });
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update course.');
    }
  };

  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <PageHeader
        title="Academy Courses"
        subtitle="Manage the LMS course catalogue."
        crumbs={[{ label: 'Academy' }]}
        actions={
          <button type="button" onClick={openNew} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 text-[13px] font-bold text-white hover:bg-[#c94508]">
            <Plus className="h-4 w-4" /> New course
          </button>
        }
      />

      <AdminCard bodyClassName="p-0">
        {loading ? (
          <Loading label="Loading courses…" />
        ) : courses.length === 0 ? (
          <EmptyState title="No courses yet" description="Add your first academy course." />
        ) : (
          <div className="divide-y divide-[var(--a-border-soft)]">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--a-subtle)]">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-[var(--a-ink2)]">
                    {course.title}
                    {course.is_featured && <StatusPill tone="orange">Featured</StatusPill>}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--a-muted)]">
                    {course.category} · {course.format} · {course.duration} · {course.level}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[var(--a-muted)]">Active</span>
                    <Toggle checked={course.is_active} onChange={() => handleToggle(course, 'is_active')} label="Active" />
                  </div>
                  <button type="button" onClick={() => openEdit(course)} aria-label="Edit" className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink2)]">
                    <Save className="hidden" />
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(course)} aria-label="Delete" className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-red-500/10 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Edit course' : 'New course'}
        wide
        footer={
          <>
            <button type="button" onClick={() => setEditorOpen(false)} className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]">
              Cancel
            </button>
            <AsyncButton
              onClick={handleSave}
              loading={saving}
              loadingLabel="Saving…"
              label="Save course"
              icon={<Save className="h-4 w-4" />}
            />
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <input className={INPUT_CLASS} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
          </Field>
          <Field label="Category" required>
            <input className={INPUT_CLASS} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <Field label="Format" required>
            <input className={INPUT_CLASS} value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))} />
          </Field>
          <Field label="Duration" required>
            <input className={INPUT_CLASS} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </Field>
          <Field label="Level">
            <input className={INPUT_CLASS} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} />
          </Field>
          <Field label="Sort order" className="sm:col-span-2">
            <input className={INPUT_CLASS} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 py-3 text-sm focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <div className="flex gap-4 sm:col-span-2">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">Featured</p>
                <p className="text-xs text-[var(--a-muted)]">Highlighted on the academy page</p>
              </div>
              <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured" />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-[var(--a-border-soft)] bg-[var(--a-subtle)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">Active</p>
                <p className="text-xs text-[var(--a-muted)]">Visible to the public</p>
              </div>
              <Toggle checked={isActive} onChange={setIsActive} label="Active" />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
