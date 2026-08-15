'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  ChevronRight,
  Copy,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileText,
  Folder,
  HardDrive,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { adminFetch, adminDelete, adminPost, adminUpload } from '@/lib/admin-client';
import { useConfirm } from '@/components/admin/confirm';
import { EmptyState, ErrorBanner, Loading, Modal, PageHeader } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface StorageFile {
  name: string;
  id: string;
  size: number;
  contentType: string;
  updatedAt: string | null;
  publicUrl: string;
  used: boolean;
}

interface StorageFolder {
  name: string;
}

interface StorageData {
  folder: string;
  folders: StorageFolder[];
  files: StorageFile[];
  summary: { totalSize: number; totalFiles: number; usedFiles?: number; quota: number; maxFileSize: number; usedPercent: number };
}

const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // Supabase direct-upload limit

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return FileImage;
  if (contentType === 'application/pdf') return FileText;
  if (contentType.startsWith('application/') || contentType.includes('zip') || contentType.includes('archive')) return FileArchive;
  return FileIcon;
}

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20';

export function StorageManager() {
  const confirm = useConfirm();

  const [folder, setFolder] = React.useState('');
  const [data, setData] = React.useState<StorageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedCount, setUploadedCount] = React.useState(0);

  const [renameTarget, setRenameTarget] = React.useState<StorageFile | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [renaming, setRenaming] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async (targetFolder: string) => {
    setLoading(true);
    try {
      const params = targetFolder ? `?folder=${encodeURIComponent(targetFolder)}` : '';
      const result = await adminFetch<StorageData>(`/api/admin/storage${params}`);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load storage.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(folder);
  }, [load, folder]);

  const navigate = (segment: string | null) => {
    const crumbs = folder.split('/').filter(Boolean);
    if (segment === null) setFolder('');
    else if (segment === 'up') setFolder(crumbs.slice(0, -1).join('/'));
    else setFolder([...crumbs, segment].join('/'));
  };

  const openUpload = () => {
    setPendingFiles([]);
    setUploadedCount(0);
    setUploadOpen(true);
  };

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const maxFileSize = data?.summary.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
    const valid: File[] = [];
    for (const file of list) {
      if (file.size > maxFileSize) {
        toast.error(`"${file.name}" exceeds the ${Math.round(maxFileSize / (1024 * 1024))} MB upload limit and was skipped.`);
        continue;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error(`"${file.name}" is not an image or PDF and was skipped.`);
        continue;
      }
      valid.push(file);
    }
    setPendingFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...valid.filter((f) => !existing.has(`${f.name}-${f.size}`))];
    });
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    let done = 0;
    try {
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        await adminUpload('/api/admin/storage', formData);
        done += 1;
        setUploadedCount(done);
      }
      toast.success(`${done} file${done === 1 ? '' : 's'} uploaded`);
      setUploadOpen(false);
      setPendingFiles([]);
      await load(folder);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = async (file: StorageFile) => {
    try {
      await navigator.clipboard.writeText(file.publicUrl);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleDelete = async (file: StorageFile) => {
    try {
      const path = folder ? `${folder}/${file.name}` : file.name;
      const ok = await confirm({
        message: `Delete "${file.name}"?`,
        action: async () => {
          await adminDelete(`/api/admin/storage?path=${encodeURIComponent(path)}`);
        },
      });
      if (!ok) return;
      toast.success('File deleted');
      await load(folder);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete file.');
    }
  };

  const openRename = (file: StorageFile) => {
    setRenameTarget(file);
    setRenameValue(file.name);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const newName = renameValue.trim();
    if (newName === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    setRenaming(true);
    try {
      const from = folder ? `${folder}/${renameTarget.name}` : renameTarget.name;
      const to = folder ? `${folder}/${newName}` : newName;
      await adminPost('/api/admin/storage/rename', { from, to });
      toast.success('File renamed');
      setRenameTarget(null);
      await load(folder);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to rename file.');
    } finally {
      setRenaming(false);
    }
  };

  const crumbs = folder.split('/').filter(Boolean);

  return (
    <>
      <PageHeader
        title="Storage"
        subtitle={`Manage files in the ${'deni_sawa'} bucket (images + PDF).`}
        crumbs={[{ label: 'Storage' }]}
        actions={
          <button
            type="button"
            onClick={openUpload}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-[#5A9E28] bg-[#5A9E28]/10 px-4 text-[13px] font-bold text-[#3f7a1a] transition-colors hover:bg-[#5A9E28]/20"
          >
            <Upload className="h-4 w-4" /> Upload files
          </button>
        }
      />

      {error && <ErrorBanner message={error} className="mb-6" />}

      {/* Capacity */}
      {data && (
        <div className="mb-6 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5A9E28]/10 text-[#5A9E28]">
                <HardDrive className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--a-ink2)]">
                  {formatBytes(data.summary.totalSize)} of {formatBytes(data.summary.quota)} used
                </p>
                <p className="text-xs text-[var(--a-muted)]">
                  {data.summary.totalFiles} file{data.summary.totalFiles === 1 ? '' : 's'} ·{' '}
                  <span className="font-medium text-[#3f7a1a]">{data.summary.usedFiles ?? 0} in use</span>
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-semibold text-[#3f7a1a]">{data.summary.usedPercent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--a-border-soft)]">
            <div className="h-2 rounded-full bg-[#5A9E28] transition-all duration-500" style={{ width: `${data.summary.usedPercent}%` }} />
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        <button type="button" onClick={() => navigate(null)} className="font-semibold text-[#E8510A] hover:underline">
          root
        </button>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--a-muted)]" />
            <button
              type="button"
              onClick={() => navigate(crumbs.slice(0, index + 1).join('/'))}
              className={index === crumbs.length - 1 ? 'font-semibold text-[var(--a-ink2)]' : 'font-medium text-[#E8510A] hover:underline'}
            >
              {crumb}
            </button>
          </React.Fragment>
        ))}
      </div>

      {loading ? (
        <Loading label="Loading storage…" />
      ) : data && data.folders.length === 0 && data.files.length === 0 ? (
        <EmptyState
          title="This folder is empty"
          description="Upload images or PDF files to start populating your media library."
          action={
            <button
              type="button"
              onClick={openUpload}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#5A9E28] bg-[#5A9E28]/10 px-4 py-2 text-[13px] font-bold text-[#3f7a1a] hover:bg-[#5A9E28]/20"
            >
              <Plus className="h-4 w-4" /> Upload files
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {/* Folders */}
            {(data?.folders ?? []).map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.name)}
                className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-[#E8510A]/40 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E8510A]/10 text-[#E8510A] transition-colors group-hover:bg-[#E8510A] group-hover:text-white">
                  <Folder className="h-5 w-5" />
                </span>
                <span className="w-full truncate text-xs font-semibold text-[var(--a-ink2)] group-hover:text-[#E8510A]">{item.name}</span>
              </button>
            ))}

            {/* Files */}
            {(data?.files ?? []).map((file) => {
              const isImg = file.contentType.startsWith('image/');
              const Icon = fileIcon(file.contentType);
              return (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--a-subtle)]">
                    {file.used && (
                      <span
                        title="This file is referenced somewhere in the system"
                        className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#5A9E28] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" /> In use
                      </span>
                    )}

                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[#5A9E28]/10 text-[#5A9E28]">
                        <Icon className="h-10 w-10" />
                      </span>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(file)}
                        title="Copy link"
                        aria-label="Copy link"
                        className="flex h-9 w-9 items-center justify-center rounded-none bg-white/90 text-[#1A1A1A] transition-all hover:scale-110 hover:bg-[#E8510A] hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openRename(file)}
                        title="Rename"
                        aria-label="Rename"
                        className="flex h-9 w-9 items-center justify-center rounded-none bg-white/90 text-[#1A1A1A] transition-all hover:scale-110 hover:bg-[#5A9E28] hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        title="Delete"
                        aria-label="Delete"
                        className="flex h-9 w-9 items-center justify-center rounded-none bg-white/90 text-[#1A1A1A] transition-all hover:scale-110 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="truncate text-xs font-semibold text-[var(--a-ink2)]">{file.name}</p>
                    <p className="text-[10px] text-[var(--a-muted)]">
                      {formatBytes(file.size)} · {file.contentType.split('/')[1]?.toUpperCase() ?? file.contentType}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {data && data.folders.length === 0 && data.files.length === 0 && (
            <p className="px-4 pb-6 text-center text-sm text-[var(--a-muted)]">This folder is empty.</p>
          )}
        </div>
      )}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload files"
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
              className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || pendingFiles.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#5A9E28] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#4d8820] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? `Uploading ${uploadedCount}/${pendingFiles.length}…` : `Upload ${pendingFiles.length || ''} file${pendingFiles.length === 1 ? '' : 's'}`}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => modalInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              dragOver ? 'border-[#5A9E28] bg-[#5A9E28]/10' : 'border-[var(--a-border)] bg-[var(--a-subtle)] hover:border-[#5A9E28]/50'
            )}
          >
            <input
              ref={modalInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5A9E28]/15 text-[#5A9E28]">
              <UploadCloud className="h-7 w-7" />
            </span>
            <p className="text-sm font-semibold text-[var(--a-ink2)]">
              Drag &amp; drop files here, or <span className="text-[#3f7a1a] underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-[var(--a-muted)]">
              Images and PDF · up to {Math.round((data?.summary.maxFileSize ?? DEFAULT_MAX_FILE_SIZE) / (1024 * 1024))} MB each · saved to /{folder || 'root'}
            </p>
          </div>

          {/* Selected files */}
          {pendingFiles.length > 0 && (
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--a-border-soft)] p-2">
              {pendingFiles.map((file, index) => {
                const Icon = fileIcon(file.type);
                return (
                  <div key={`${file.name}-${file.size}`} className="flex items-center gap-2.5 rounded-md bg-[var(--a-subtle)] px-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#5A9E28]/10 text-[#5A9E28]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--a-ink2)]">{file.name}</p>
                      <p className="text-[11px] text-[var(--a-muted)]">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Remove file"
                      className="rounded-md p-1.5 text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title={`Rename "${renameTarget?.name ?? ''}"`}
        footer={
          <>
            <button type="button" onClick={() => setRenameTarget(null)} disabled={renaming} className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)] disabled:opacity-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRename}
              disabled={renaming || !renameValue.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#c94508] disabled:opacity-50"
            >
              {renaming && <Loader2 className="h-4 w-4 animate-spin" />}
              Rename file
            </button>
          </>
        }
      >
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          className={INPUT_CLASS}
          placeholder="New file name"
        />
        <p className="mt-2 text-xs text-[var(--a-muted)]">
          The public URL will update to the new name. Existing references will break.
        </p>
      </Modal>
    </>
  );
}
