'use client';

import { useState } from 'react';
import { FileDown, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExportBarProps {
  /** Serialized Lexical EditorState JSON to export. */
  state: Record<string, unknown> | string;
  /** Filename base used for the downloaded files. */
  filename?: string;
  className?: string;
}

/** Download a blob from a POST to an export API route. */
async function downloadFromApi(
  path: string,
  state: Record<string, unknown> | string,
  fallbackFilename: string
): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const matched = disposition?.match(/filename="?([^"]+)"?/i);
  const filename = matched?.[1] ?? fallbackFilename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** PDF / Word export buttons for the report page. */
export function ExportBar({ state, filename = 'deni-sawa-health-report', className }: ExportBarProps) {
  const [busy, setBusy] = useState<'pdf' | 'word' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (kind: 'pdf' | 'word') => {
    setBusy(kind);
    setError(null);
    try {
      await downloadFromApi(
        kind === 'pdf' ? '/api/health-check/export/pdf' : '/api/health-check/export/word',
        state,
        `${filename}.${kind}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => handleExport('pdf')}
          disabled={busy !== null}
          className="min-w-[150px]"
        >
          {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Download PDF
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleExport('word')}
          disabled={busy !== null}
          className="min-w-[150px]"
        >
          {busy === 'word' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Download Word
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
