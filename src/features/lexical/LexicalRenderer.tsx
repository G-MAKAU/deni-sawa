'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { buildEditorConfig, NAMESPACE } from './EditorConfig';
import { ElementStylePlugin } from './plugins/ElementStylePlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { LexicalErrorBoundary } from './ErrorBoundary';
import { cn } from '@/lib/utils';

export function LexicalContentEditable() {
  return (
    <ContentEditable
      className="ds-lexical-content min-h-full focus:outline-none"
      aria-label="Report content"
      spellCheck={false}
    />
  );
}

interface LexicalRendererProps {
  /** Serialized Lexical EditorState JSON (object or stringified). */
  state: Record<string, unknown> | string;
  className?: string;
}

/**
 * Read-only Lexical renderer for AI-generated Health Check reports.
 * Hydrates the stored EditorState JSON and renders it with the brand theme —
 * including tables, code blocks and horizontal rules.
 */
export function LexicalRenderer({ state, className }: LexicalRendererProps) {
  return (
    <LexicalErrorBoundary onError={() => undefined}>
      <LexicalComposer initialConfig={buildEditorConfig({ state, editable: false })}>
        <div className={cn('ds-lexical', className)}>
          <RichTextPlugin
            contentEditable={<LexicalContentEditable />}
            placeholder={<div className="hidden" />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
          <ElementStylePlugin />
          <CodeHighlightPlugin />
          <TablePlugin />
          <HorizontalRulePlugin />
          <ClickableLinkPlugin />
          <span className="hidden" data-lexical-namespace={NAMESPACE} />
        </div>
      </LexicalComposer>
    </LexicalErrorBoundary>
  );
}
