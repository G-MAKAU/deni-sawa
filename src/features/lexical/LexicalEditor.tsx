'use client';

import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TRANSFORMERS } from '@lexical/markdown';
import { buildEditorConfig } from './EditorConfig';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin';
import { ElementStylePlugin } from './plugins/ElementStylePlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { CheckListPlugin } from './plugins/CheckListPlugin';
import { PastePlugin } from './plugins/PastePlugin';
import { LexicalErrorBoundary } from './ErrorBoundary';
import { cn } from '@/lib/utils';

const URL_PATTERN =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const EMAIL_PATTERN =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_PATTERN),
  createLinkMatcherWithRegExp(EMAIL_PATTERN),
];

/** Serializes EditorState changes and reports them to the parent. */
function StateSyncPlugin({ onChange }: { onChange?: (state: unknown) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      onChange?.(editorState.toJSON());
    });
  }, [editor, onChange]);

  return null;
}

interface LexicalEditorProps {
  /** Initial serialized Lexical EditorState JSON. */
  state?: Record<string, unknown> | string;
  onChange?: (state: unknown) => void;
  placeholder?: string;
  className?: string;
  /** Max height of the scrollable editing area (default 760px). */
  maxHeight?: string;
  /** When true, the editor fills its parent's height and only the editing
   *  area scrolls (no outer/page scrollbar). maxHeight is ignored. */
  fillHeight?: boolean;
  /** Available {{variable}} names exposed via the toolbar "Insert variable" dropdown. */
  variables?: string[];
  /** When provided, the toolbar gains an "Insert image" button that uploads via this callback. */
  onUploadImage?: (file: File) => Promise<string>;
  /** When provided, the image button also offers "Browse storage" — resolves with the picked URL. */
  onBrowseImage?: () => Promise<string | null>;
}

/** Full branded Lexical editor (playground-style) with toolbar, floating toolbar and rich plugins. */
export function LexicalEditor({ state, onChange, placeholder = 'Start writing…', className, maxHeight = '760px', fillHeight = false, variables, onUploadImage, onBrowseImage }: LexicalEditorProps) {
  return (
    <div className={cn('rounded-lg border border-card-border bg-card', fillHeight && 'flex h-full min-h-0 flex-col', className)}>
      <LexicalComposer initialConfig={buildEditorConfig({ state, editable: true })}>
        {/* The toolbar has no overflow-hidden so its wrapped controls and
            dropdown menus are always visible, never clipped. */}
        <ToolbarPlugin variables={variables} onUploadImage={onUploadImage} onBrowseImage={onBrowseImage} />
        <div className={cn('overflow-hidden rounded-b-lg', fillHeight && 'min-h-0 flex-1')}>
          <div
            className={cn('ds-lexical overflow-y-auto bg-background px-4 py-3', fillHeight ? 'min-h-0 h-full' : 'min-h-[220px]')}
            style={fillHeight ? undefined : { maxHeight }}
          >
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="ds-lexical-content min-h-[220px] focus:outline-none"
                  aria-label={placeholder}
                  data-placeholder={placeholder}
                />
              }
              placeholder={
                <div className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>

        {/* Playground-core plugins */}
        <HistoryPlugin />
        <LinkPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <ElementStylePlugin />
        <CodeHighlightPlugin />
        <CheckListPlugin />
        <PastePlugin />
        <TablePlugin />
        <HorizontalRulePlugin />
        <ClickableLinkPlugin />
        <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <FloatingToolbarPlugin />
        <StateSyncPlugin onChange={onChange} />
      </LexicalComposer>
    </div>
  );
}
