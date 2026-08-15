'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  ChevronRight,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileText,
  Folder,
  Loader2,
  Search,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { ErrorBanner, Loading, Modal } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

export interface PickerFile {
  name: string;
  publicUrl: string;
  contentType: string;
  size: number;
  used?: boolean;
}

interface StorageFolder {
  name: string;
}

interface PickerEntry extends PickerFile {}

interface StorageData {
  folder: string;
  folders: StorageFolder[];
  files: PickerEntry[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return FileImage;
  if (contentType === 'application/pdf') return FileText;
  if (contentType.startsWith('application/') || contentType.includes('zip')) return FileArchive;
  return FileIcon;
}

function isImage(contentType: string): boolean {
  return contentType.startsWith('image/');
}

/**
 * Modal browser over the deni_sawa storage bucket. Lets the user navigate
 * folders and pick a file — used for the blog featured image and content images.
 */
export function StoragePickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (file: PickerFile) => void;
}) {
  const [folder, setFolder] = React.useState('');
  const [data, setData] = React.useState<StorageData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async (targetFolder: string) => {
    setLoading(true);
    setError(null);
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
    if (open) {
      setFolder('');
      setSearch('');
      void load('');
    }
  }, [open, load]);

  const crumbs = folder.split('/').filter(Boolean);
  const navigate = (segment: string | null) => {
    if (segment === null) setFolder('');
    else if (segment === 'up') setFolder(crumbs.slice(0, -1).join('/'));
    else setFolder([...crumbs, segment].join('/'));
  };

  const files = data?.files ?? [];
  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : files;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select from storage"
      wide
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-4 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:bg-[var(--a-hover)]"
        >
          Cancel
        </button>
      }
    >
      <div className="space-y-4">
        {/* Search + breadcrumb */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="h-10 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] pl-9 pr-3 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-placeholder)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 text-sm">
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
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <Loading label="Loading storage…" />
        ) : (
          <div className="max-h-[46vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* Folders */}
              {(data?.folders ?? []).map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => navigate(item.name)}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] px-3 py-4 transition-colors hover:border-[#E8510A]/40 hover:bg-[var(--a-hover)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E8510A]/10 text-[#E8510A]">
                    <Folder className="h-5 w-5" />
                  </span>
                  <span className="w-full truncate text-center text-xs font-semibold text-[var(--a-ink2)]">{item.name}</span>
                </button>
              ))}

              {/* Files */}
              {filtered.map((file) => {
                const Icon = fileIcon(file.contentType);
                return (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => {
                      onPick(file);
                      onClose();
                    }}
                    className="group overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] text-left transition-colors hover:border-[#E8510A]/40 hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--a-subtle)]">
                      {file.used && (
                        <span
                          title="Referenced somewhere in the system"
                          className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#5A9E28] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm"
                        >
                          In use
                        </span>
                      )}
                      {isImage(file.contentType) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.publicUrl}
                          alt={file.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-[#5A9E28]/10 text-[#5A9E28]">
                          <Icon className="h-8 w-8" />
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Select
                      </span>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="truncate text-xs font-semibold text-[var(--a-ink2)]">{file.name}</p>
                      <p className="text-[10px] text-[var(--a-muted)]">{formatBytes(file.size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {!loading && (data?.folders ?? []).length === 0 && filtered.length === 0 && (
              <p className={cn('py-10 text-center text-sm text-[var(--a-muted)]')}>
                {search.trim() ? 'No files match your search.' : 'This folder is empty.'}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
