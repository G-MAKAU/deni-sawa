'use client';

import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, EditorState } from 'lexical';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

// Register list nodes
import { ListNode } from '@lexical/list';
import { ListItemNode } from '@lexical/list';

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded transition-colors',
        active ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        disabled && 'opacity-40'
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
        }
      });
    });
  }, [editor]);

  const toggleList = (type: 'bullet' | 'number') => {
    editor.dispatchCommand(type === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND);
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-input px-2 py-1">
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        active={isBold}
        disabled={disabled}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        active={isItalic}
        disabled={disabled}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <div className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton onClick={() => toggleList('bullet')} disabled={disabled} title="Bullet list">
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => toggleList('number')} disabled={disabled} title="Numbered list">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

const theme = {
  paragraph: 'mb-1',
  text: {
    bold: 'font-bold',
    italic: 'italic',
  },
  list: {
    ul: 'list-disc pl-6 mb-1',
    ol: 'list-decimal pl-6 mb-1',
    listItem: 'mb-0.5',
  },
};

interface RichTextEditorProps {
  onChange?: (editorState: EditorState) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function EditorInner({ onChange, placeholder, disabled }: Omit<RichTextEditorProps, 'className'>) {
  const handleChange = React.useCallback(
    (editorState: EditorState, _editor: import('lexical').LexicalEditor, _tags: Set<string>) => {
      onChange?.(editorState);
    },
    [onChange]
  );

  return (
    <>
      <Toolbar disabled={disabled} />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="min-h-[120px] w-full resize-none px-4 py-3 text-[15px] leading-relaxed text-foreground outline-none"
            aria-placeholder={placeholder ?? ''}
            placeholder={<span className="text-muted-foreground">{placeholder ?? ''}</span>}
          />
        }
        placeholder={null}
        ErrorBoundary={({ children }) => <div>{children}</div>}
      />
      <HistoryPlugin />
      <ListPlugin />
      <OnChangePlugin onChange={handleChange} />
    </>
  );
}

export function RichTextEditor({ onChange, placeholder, className, disabled }: RichTextEditorProps) {
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'ContactMessageEditor',
      theme,
      nodes: [ListNode, ListItemNode],
      onError: (error: Error) => console.error('Lexical error:', error),
    }),
    []
  );

  return (
    <div
      className={cn(
        'rounded-btn border border-card-border bg-background transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
        className
      )}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <EditorInner onChange={onChange} placeholder={placeholder} disabled={disabled} />
      </LexicalComposer>
    </div>
  );
}
