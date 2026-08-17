'use client';

import * as React from 'react';
import { Folder, FolderOpen, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { Modal } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

interface StorageFile {
  name: string;
  id: string;
  size: number;
  contentType: string;
  publicUrl: string;
}

interface StorageImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (publicUrl: string) => void;
}

/** Modal that browses Supabase storage folders and returns a picked image URL. */
export function StorageImagePicker({ open, onClose, onSelect }: StorageImagePickerProps) {
  const [folder, setFolder] = React.useState('');
  const [folders, setFolders] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<StorageFile[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (targetFolder: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (targetFolder) params.set('folder', targetFolder);
      const data = await adminFetch<{ folders: { name: string }[]; files: StorageFile[] }>(
        `/api/admin/storage?${params.toString()}`
      );
      setFolder(targetFolder);
      setFolders(data.folders.map((f) => f.name));
      setImages(data.files.filter((f) => f.contentType.startsWith('image/')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load storage.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) void load('');
  }, [open, load]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select image from storage"
      wide
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] hover:bg-[var(--a-hover)]"
        >
          Cancel
        </button>
      }
    >
      <div className="space-y-4">
        {/* Folder breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => void load('')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
              folder === '' ? 'bg-[#E8510A] text-white' : 'bg-[var(--a-subtle)] text-[var(--a-text)] hover:text-[#E8510A]'
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" /> Root
          </button>
          {folder.split('/').filter(Boolean).map((part, i, arr) => {
            const path = arr.slice(0, i + 1).join('/');
            return (
              <button
                key={path}
                type="button"
                onClick={() => void load(path)}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--a-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--a-text)] transition-colors hover:text-[#E8510A]"
              >
                <Folder className="h-3.5 w-3.5" /> {part}
              </button>
            );
          })}
        </div>

        {error && <p className="rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#E8510A]" />
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {folders.length === 0 && images.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <ImageIcon className="h-8 w-8 text-[var(--a-placeholder)]" />
                <p className="text-sm text-[var(--a-muted)]">No images here yet.</p>
                <p className="text-xs text-[var(--a-placeholder)]">
                  Upload images via the Storage manager, or pick a folder on the left.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => onSelect(file.publicUrl)}
                    title={file.name}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] transition-all duration-200 hover:border-[#E8510A]/50 hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.publicUrl} alt={file.name} className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-[#111111]/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {file.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
