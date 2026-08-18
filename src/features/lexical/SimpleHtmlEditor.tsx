'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const URL_PATTERN =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const EMAIL_PATTERN =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const URL_INPUT_CLASS = 'h-9 w-72 rounded-btn border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

interface SimpleHtmlEditorProps {
  html?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  variables?: string[];
  onInsertVariable?: (variable: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onBrowseImage?: () => Promise<string | null>;
}

export function SimpleHtmlEditor({
  html = '',
  onChange,
  placeholder = 'Start writing…',
  className,
  maxHeight = '760px',
  variables,
  onInsertVariable,
  onUploadImage,
  onBrowseImage,
}: SimpleHtmlEditorProps) {
  const [htmlContent, setHtmlContent] = useState(html || '');
  const [isEditing, setIsEditing] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync htmlContent with prop
  useEffect(() => {
    if (html !== htmlContent) {
      setHtmlContent(html);
    }
  }, [html]);

  // Sync htmlContent with onChange
  useEffect(() => {
    if (onChange && htmlContent !== html) {
      onChange(htmlContent);
    }
  }, [htmlContent, html, onChange]);

  const insertHtmlAtCursor = useCallback((html: string) => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = htmlContent.slice(0, start);
      const after = htmlContent.slice(end);
      const newHtml = before + html + after;
      setHtmlContent(newHtml);
      // Restore cursor position after inserted HTML
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + html.length;
          textareaRef.current.selectionEnd = start + html.length;
        }
      }, 0);
    }
  }, [htmlContent, isEditing]);

  const handleVariableInsert = useCallback((variable: string) => {
    insertHtmlAtCursor(`{{${variable}}}`);
  }, [insertHtmlAtCursor]);

  const handleImageUpload = async (file: File) => {
    if (!onUploadImage) return;
    try {
      const url = await onUploadImage(file);
      const imgHtml = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:0.5rem;">`;
      insertHtmlAtCursor(imgHtml);
    } catch {
      // Error handled in onUploadImage
    }
  };

  const handleBrowseImage = async () => {
    if (!onBrowseImage) return;
    try {
      const url = await onBrowseImage();
      if (url) {
        const imgHtml = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:0.5rem;">`;
        insertHtmlAtCursor(imgHtml);
      }
    } catch {
      // Error handled in onBrowseImage
    }
  };

  const handleBold = () => insertHtmlAtCursor('<strong></strong>');
  const handleItalic = () => insertHtmlAtCursor('<em></em>');
  const handleUnderline = () => insertHtmlAtCursor('<u></u>');
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) insertHtmlAtCursor(`<a href="${url}"></a>`);
  };
  const handleUnorderedList = () => insertHtmlAtCursor('<ul><li></li></ul>');
  const handleOrderedList = () => insertHtmlAtCursor('<ol><li></li></ol>');
  const handleCode = () => insertHtmlAtCursor('<code></code>');
  const handleQuote = () => insertHtmlAtCursor('<blockquote></blockquote>');
  const handleH1 = () => insertHtmlAtCursor('<h1></h1>');
  const handleH2 = () => insertHtmlAtCursor('<h2></h2>');
  const handleH3 = () => insertHtmlAtCursor('<h3></h3>');
  const handleHr = () => insertHtmlAtCursor('<hr>');
  const handleImage = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file) handleImageUpload(file);
    };
    fileInput.click();
  };

  const toolbarButtons = [
    { onClick: handleBold, title: 'Bold (Ctrl+B)', children: <strong>B</strong> },
    { onClick: handleItalic, title: 'Italic (Ctrl+I)', children: <em>I</em> },
    { onClick: handleUnderline, title: 'Underline (Ctrl+U)', children: <u>U</u> },
    { onClick: handleLink, title: 'Link (Ctrl+K)', children: '🔗' },
    { onClick: handleH1, title: 'Heading 1', children: 'H1' },
    { onClick: handleH2, title: 'Heading 2', children: 'H2' },
    { onClick: handleH3, title: 'Heading 3', children: 'H3' },
    { onClick: handleUnorderedList, title: 'Bullet List', children: '•' },
    { onClick: handleOrderedList, title: 'Numbered List', children: '1.' },
    { onClick: handleCode, title: 'Inline Code', children: <code>{' { }'}</code> },
    { onClick: handleQuote, title: 'Quote', children: '"' },
    { onClick: handleHr, title: 'Horizontal Rule', children: '—' },
    { onClick: handleImage, title: 'Insert Image', children: '🖼' },
  ];

  return (
    <div className={cn('rounded-lg border border-card-border bg-card', className)}>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-card-border bg-card px-3 py-2">
{toolbarButtons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              title={btn.title}
              className="flex h-9 w-9 items-center justify-center rounded-btn text-foreground/70 transition-colors hover:bg-brand/10 hover:text-brand text-sm font-semibold"
              type="button"
            >
              {btn.children}
            </button>
          ))}
        <div className="flex-1" />
        {variables && variables.length > 0 && (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onInsertVariable?.(e.target.value);
                  e.target.value = '';
                }
              }}
              className="h-9 w-40 rounded-btn border border-card-border bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>Insert variable…</option>
{variables.map((v) => (
                <option key={v} value={v}>
                  {'{'}{v}{'}'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={cn('overflow-hidden rounded-b-lg', 'min-h-0 flex-1')}>
        <div
          className={cn('ds-lexical overflow-y-auto bg-background px-4 py-3', 'min-h-[220px]')}
          style={{ maxHeight }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder={placeholder}
              className="ds-lexical-content min-h-[220px] focus:outline-none w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground font-sans text-sm leading-relaxed"
              spellCheck={false}
              style={{ fontFamily: 'inherit', lineHeight: 1.7 }}
            />
          ) : (
            <div
              ref={editorRef}
              className="ds-lexical-content min-h-[220px] focus:outline-none w-full"
              contentEditable={true}
              suppressContentEditableWarning={true}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{ fontFamily: 'inherit', lineHeight: 1.7 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleHtmlEditor;