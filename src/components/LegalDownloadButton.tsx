'use client';

import { FileDown } from 'lucide-react';

/** Opens the browser print dialog which renders only the .print-area content
 *  (the rest of the page is hidden via print CSS) — saving as PDF produces a
 *  clean copy of the legal document. */
export function LegalDownloadButton({ label = 'Download as PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-lg bg-[#E8510A] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_2px_16px_rgba(232,81,10,0.35)] transition-all duration-300 hover:bg-[#c94508] hover:shadow-[0_4px_24px_rgba(232,81,10,0.45)] active:scale-[0.97]"
    >
      <FileDown className="h-4 w-4" />
      {label}
    </button>
  );
}