'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link, List, ListOrdered, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Image as ImageIcon,
  ChevronDown, Table, CheckSquare, Heading1, Heading2, Heading3, Type, Loader2, Link2, X,
} from 'lucide-react';
import { sanitizePastedHtml } from '@/lib/sanitizePastedHtml';
import { cn } from '@/lib/utils';

interface LexicalEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

type BlockFormat =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'code'
  | 'bullet'
  | 'number'
  | 'checkbox';

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  blockFormat: BlockFormat;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const blockFormatLabels: Record<BlockFormat, string> = {
  paragraph: 'Paragraph',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  quote: 'Quote',
  code: 'Code Block',
  bullet: 'Bulleted List',
  number: 'Numbered List',
  checkbox: 'Checkbox List',
};

const blockFormatIcons: Record<BlockFormat, React.ReactNode> = {
  paragraph: <Type size={13} />,
  h1: <Heading1 size={13} />,
  h2: <Heading2 size={13} />,
  h3: <Heading3 size={13} />,
  quote: <Quote size={13} />,
  code: <Code size={13} />,
  bullet: <List size={13} />,
  number: <ListOrdered size={13} />,
  checkbox: <CheckSquare size={13} />,
};

function syncCheckboxListItemState(li: HTMLElement): void {
  li.setAttribute('data-checked', 'true');
  li.querySelectorAll('input[data-checklist-checkbox="true"]').forEach((input) => input.remove());

  if (!li.textContent?.trim() && li.childElementCount === 0) {
    li.appendChild(document.createElement('br'));
  }
}

function normalizeCheckboxListMarkup(root: HTMLElement): void {
  root.querySelectorAll<HTMLLIElement>('ul[data-checklist="true"] > li').forEach((li) => {
    syncCheckboxListItemState(li);
  });
}

export function LexicalEditor({ initialContent = '', onChange, onUploadImage }: LexicalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastAppliedInitialRef = useRef<string | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>(['']);
  const historyIndexRef = useRef(0);

  const [toolbar, setToolbar] = useState<ToolbarState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    blockFormat: 'paragraph',
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    canUndo: false,
    canRedo: false,
  });
  const [showBlockFormatDropdown, setShowBlockFormatDropdown] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showTableInsert, setShowTableInsert] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isEditorEffectivelyEmpty, setIsEditorEffectivelyEmpty] = useState(true);
  const [markdownShortcutsEnabled, setMarkdownShortcutsEnabled] = useState(true);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState({ top: 0, left: 0 });

  const updateCounts = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(text.length);

    const hasNonTextContent = !!editorRef.current.querySelector('img, table, ul, ol, pre, blockquote, hr');
    setIsEditorEffectivelyEmpty(text.trim().length === 0 && !hasNonTextContent);
  }, []);

  const updateToolbarState = useCallback(() => {
    const bold = document.queryCommandState('bold');
    const italic = document.queryCommandState('italic');
    const underline = document.queryCommandState('underline');
    const strikethrough = document.queryCommandState('strikeThrough');

    const selection = window.getSelection();
    let isInlineCode = false;
    let blockFormat: BlockFormat = 'paragraph';

    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === 'code') isInlineCode = true;
          if (tag === 'h1') blockFormat = 'h1';
          else if (tag === 'h2') blockFormat = 'h2';
          else if (tag === 'h3') blockFormat = 'h3';
          else if (tag === 'blockquote') blockFormat = 'quote';
          else if (tag === 'pre') blockFormat = 'code';
          else if (tag === 'ul') blockFormat = el.getAttribute('data-checklist') === 'true' ? 'checkbox' : 'bullet';
          else if (tag === 'ol') blockFormat = 'number';
          if (blockFormat !== 'paragraph') break;
        }
        node = node.parentNode;
      }
    }

    setToolbar((prev) => ({ ...prev, bold, italic, underline, strikethrough, code: isInlineCode, blockFormat }));
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const containerEl = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : (container.parentElement ?? null);
    if (!containerEl || !editorRef.current.contains(containerEl)) return;
    savedSelectionRef.current = range.cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedSelectionRef.current;
    const selection = window.getSelection();
    if (!range || !selection || !editorRef.current) return;
    const container = range.commonAncestorContainer;
    const containerEl = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : (container.parentElement ?? null);
    if (!containerEl || !editorRef.current.contains(containerEl)) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const getEditorRange = useCallback((): Range | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const containerEl = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : (container.parentElement ?? null);
    if (!containerEl || !editorRef.current.contains(containerEl)) return null;
    return range;
  }, []);

  const wrapRangeWithLink = useCallback(
    (href: string) => {
      if (!editorRef.current) return;
      const range = getEditorRange();
      if (!range) return;

      const container = range.commonAncestorContainer;
      const containerEl = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : (container.parentElement ?? null);
      const existingAnchor = containerEl?.closest('a');
      if (existingAnchor && editorRef.current.contains(existingAnchor)) {
        existingAnchor.setAttribute('href', href);
        return;
      }

      const anchor = document.createElement('a');
      anchor.setAttribute('href', href);

      if (range.collapsed) {
        anchor.textContent = href;
        range.insertNode(anchor);
        const selection = window.getSelection();
        if (selection) {
          const after = document.createRange();
          after.setStartAfter(anchor);
          after.collapse(true);
          selection.removeAllRanges();
          selection.addRange(after);
        }
        return;
      }

      const fragment = range.extractContents();
      anchor.appendChild(fragment);
      range.insertNode(anchor);
      const selection = window.getSelection();
      if (selection) {
        const after = document.createRange();
        after.setStartAfter(anchor);
        after.collapse(true);
        selection.removeAllRanges();
        selection.addRange(after);
      }
    },
    [getEditorRange]
  );

  useEffect(() => {
    if (!editorRef.current) return;

    const nextHtml = initialContent || '<p><br></p>';
    const isFocused = document.activeElement === editorRef.current;
    const isFirstLoad = lastAppliedInitialRef.current == null;
    const isExternalChange = lastAppliedInitialRef.current !== nextHtml;

    if ((isFirstLoad || isExternalChange) && !isFocused) {
      editorRef.current.innerHTML = nextHtml;
      normalizeCheckboxListMarkup(editorRef.current);
      lastAppliedInitialRef.current = nextHtml;
      historyRef.current = [editorRef.current.innerHTML];
      historyIndexRef.current = 0;
      setToolbar((prev) => ({ ...prev, canUndo: false, canRedo: false }));
      updateToolbarState();
      updateCounts();
    }
  }, [initialContent, updateCounts, updateToolbarState]);

  const pushHistory = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(html);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setToolbar((prev) => ({ ...prev, canUndo: historyIndexRef.current > 0, canRedo: false }));
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !editorRef.current) return;
    historyIndexRef.current -= 1;
    editorRef.current.innerHTML = historyRef.current[historyIndexRef.current];
    setToolbar((prev) => ({
      ...prev,
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    }));
    onChange?.(editorRef.current.innerHTML);
    updateCounts();
  }, [onChange, updateCounts]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !editorRef.current) return;
    historyIndexRef.current += 1;
    editorRef.current.innerHTML = historyRef.current[historyIndexRef.current];
    setToolbar((prev) => ({
      ...prev,
      canUndo: true,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    }));
    onChange?.(editorRef.current.innerHTML);
    updateCounts();
  }, [onChange, updateCounts]);

  const handleSelectionChange = useCallback(() => {
    updateToolbarState();

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setShowFloatingToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();

    if (rect.width > 0) {
      setFloatingToolbarPos({
        top: rect.top - editorRect.top - 44,
        left: Math.max(0, rect.left - editorRect.left + rect.width / 2 - 150),
      });
      setShowFloatingToolbar(true);
    } else {
      setShowFloatingToolbar(false);
    }
  }, [updateToolbarState]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const execFormat = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      updateToolbarState();
      pushHistory();
      if (editorRef.current) {
        onChange?.(editorRef.current.innerHTML);
        updateCounts();
      }
    },
    [onChange, pushHistory, updateCounts, updateToolbarState]
  );

  const applyInlineCode = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const codeElement = document.createElement('code');

    if (range.collapsed) {
      codeElement.textContent = '\u200B';
      range.insertNode(codeElement);
      const caretRange = document.createRange();
      caretRange.setStart(codeElement.firstChild ?? codeElement, 1);
      caretRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caretRange);
    } else {
      const selectedText = range.toString();
      if (!selectedText.trim()) return;
      codeElement.textContent = selectedText;
      range.deleteContents();
      range.insertNode(codeElement);
      range.setStartAfter(codeElement);
      range.setEndAfter(codeElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    updateToolbarState();
    pushHistory();
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
      updateCounts();
    }
  }, [updateToolbarState, pushHistory, onChange, updateCounts]);

  const insertCheckboxList = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    const activeRange = getEditorRange();

    const getTopLevelContainer = (node: Node | null) => {
      let current: Node | null = node;
      let topLevelElement: HTMLElement | null = null;
      while (current && current !== editorRef.current) {
        if (current.nodeType === Node.ELEMENT_NODE) topLevelElement = current as HTMLElement;
        current = current.parentNode;
      }
      return topLevelElement;
    };

    const isEditorEffectivelyBlank =
      editorRef.current.innerText.trim().length === 0 &&
      editorRef.current.childElementCount === 1 &&
      editorRef.current.firstElementChild?.tagName === 'P';

    if (isEditorEffectivelyBlank) {
      editorRef.current.innerHTML = '';
    }

    const ul = document.createElement('ul');
    ul.setAttribute('data-checklist', 'true');
    const li = document.createElement('li');
    li.setAttribute('data-checked', 'true');

    if (activeRange && !activeRange.collapsed) {
      const extracted = activeRange.extractContents();
      if (extracted.childNodes.length > 0) li.appendChild(extracted);
    }
    if (li.childNodes.length === 1) li.appendChild(document.createElement('br'));
    ul.appendChild(li);

    const insertionRange = (() => {
      const r = document.createRange();
      const topLevelContainer = activeRange ? getTopLevelContainer(activeRange.commonAncestorContainer) : null;
      if (topLevelContainer && editorRef.current?.contains(topLevelContainer)) {
        r.setStartAfter(topLevelContainer);
        r.collapse(true);
        return r;
      }
      r.selectNodeContents(editorRef.current!);
      r.collapse(false);
      return r;
    })();

    insertionRange.insertNode(ul);
    normalizeCheckboxListMarkup(ul);

    if (selection) {
      const caret = document.createRange();
      caret.setStart(li, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
    }

    updateToolbarState();
    pushHistory();
    onChange?.(editorRef.current.innerHTML);
    updateCounts();
  }, [getEditorRange, onChange, pushHistory, updateCounts, updateToolbarState]);

  const applyBlockFormat = useCallback(
    (format: BlockFormat) => {
      editorRef.current?.focus();
      setShowBlockFormatDropdown(false);

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount || !editorRef.current) return;
      const range = selection.getRangeAt(0);

      const wrapBlock = (tag: string) => {
        const el = document.createElement(tag);
        try {
          range.surroundContents(el);
        } catch {
          el.appendChild(range.extractContents());
          range.insertNode(el);
        }
      };

      const insertList = (type: string) => {
        const list = document.createElement(type);
        const li = document.createElement('li');
        li.appendChild(range.extractContents());
        list.appendChild(li);
        range.insertNode(list);
      };

      switch (format) {
        case 'paragraph':
          wrapBlock('p');
          break;
        case 'h1':
        case 'h2':
        case 'h3':
          wrapBlock(format);
          break;
        case 'quote':
          wrapBlock('blockquote');
          break;
        case 'code':
          wrapBlock('pre');
          break;
        case 'bullet':
          insertList('ul');
          break;
        case 'number':
          insertList('ol');
          break;
        case 'checkbox':
          insertCheckboxList();
          return;
      }

      selection.removeAllRanges();
      selection.addRange(range);
      updateToolbarState();
      pushHistory();
      if (editorRef.current) {
        onChange?.(editorRef.current.innerHTML);
        updateCounts();
      }
    },
    [insertCheckboxList, onChange, pushHistory, updateCounts, updateToolbarState]
  );

  const handleInsertLink = useCallback(() => {
    if (!linkUrl) return;

    const normalizedUrl = /^(https?:\/\/|mailto:|#)/i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;

    editorRef.current?.focus();
    restoreSelection();
    wrapRangeWithLink(normalizedUrl);
    updateToolbarState();
    pushHistory();
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
      updateCounts();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [linkUrl, onChange, pushHistory, restoreSelection, updateCounts, updateToolbarState, wrapRangeWithLink]);

  const handleInsertTable = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = '<table><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        if (r === 0) tableHtml += `<th>Header ${c + 1}</th>`;
        else tableHtml += '<td>&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';

    document.execCommand('insertHTML', false, tableHtml);
    setShowTableInsert(false);
    pushHistory();
    onChange?.(editorRef.current.innerHTML);
  }, [tableRows, tableCols, pushHistory, onChange]);

  const handleInsertHR = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, '<hr/><p><br></p>');
    pushHistory();
    onChange?.(editorRef.current.innerHTML);
  }, [pushHistory, onChange]);

  const handleInsertImageUrl = useCallback(() => {
    if (!imageUrl.trim() || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(
      'insertHTML',
      false,
      `<img src="${imageUrl.trim()}" alt="" style="max-width:100%;border-radius:8px;margin:8px 0;" /><p><br></p>`
    );
    pushHistory();
    onChange?.(editorRef.current.innerHTML);
    setShowImageUrlInput(false);
    setImageUrl('');
  }, [imageUrl, pushHistory, onChange]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editorRef.current) return;

      if (!onUploadImage) {
        setShowImageUrlInput(true);
        if (imageInputRef.current) imageInputRef.current.value = '';
        return;
      }

      setIsUploadingImage(true);
      try {
        const url = await onUploadImage(file);
        editorRef.current.focus();
        document.execCommand(
          'insertHTML',
          false,
          `<img src="${url}" alt="${file.name.replace(/[<>"']/g, '')}" style="max-width:100%;border-radius:8px;margin:8px 0;" /><p><br></p>`
        );
        pushHistory();
        onChange?.(editorRef.current.innerHTML);
      } finally {
        setIsUploadingImage(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    },
    [onUploadImage, pushHistory, onChange]
  );

  const handleEditorMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target || !editorRef.current) return;
      const li = target.closest('li');
      const ul = li?.closest('ul');
      if (!li || !ul || !editorRef.current.contains(ul)) return;
      if (ul.getAttribute('data-checklist') !== 'true') return;

      const rect = li.getBoundingClientRect();
      const gutterWidth = 28;
      if (e.clientX - rect.left > gutterWidth) return;

      e.preventDefault();
      e.stopPropagation();
      syncCheckboxListItemState(li);
      updateToolbarState();
      pushHistory();
      if (editorRef.current) {
        onChange?.(editorRef.current.innerHTML);
        updateCounts();
      }
    },
    [onChange, pushHistory, updateCounts, updateToolbarState]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'b': e.preventDefault(); execFormat('bold'); break;
          case 'i': e.preventDefault(); execFormat('italic'); break;
          case 'u': e.preventDefault(); execFormat('underline'); break;
          case 'z': e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); break;
          case 'y': e.preventDefault(); handleRedo(); break;
          case 'k': e.preventDefault(); saveSelection(); setShowLinkInput(true); break;
        }
      }

      if (e.key === 'Enter') {
        const selection = window.getSelection();
        const anchorNode = selection?.anchorNode ?? null;
        const anchorEl =
          anchorNode?.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode?.parentElement ?? null;
        const isInsideListItem = Boolean(anchorEl?.closest('li') && editorRef.current?.contains(anchorEl.closest('li')));
        if (isInsideListItem) return;

        e.preventDefault();
        execFormat(e.shiftKey ? 'insertLineBreak' : 'insertParagraph');
        return;
      }

      if (!markdownShortcutsEnabled) return;

      const selection = window.getSelection();
      if (e.key === ' ' && selection) {
        const range = selection.getRangeAt(0);
        const text = range.startContainer.textContent || '';
        const cursorPos = range.startOffset;
        const lineText = text.substring(0, cursorPos);

        if (lineText === '#') {
          e.preventDefault();
          document.execCommand('delete', false);
          document.execCommand('delete', false);
          applyBlockFormat('h1');
        } else if (lineText === '##') {
          e.preventDefault();
          document.execCommand('delete', false);
          document.execCommand('delete', false);
          document.execCommand('delete', false);
          applyBlockFormat('h2');
        } else if (lineText === '###') {
          e.preventDefault();
          for (let i = 0; i < 4; i++) document.execCommand('delete', false);
          applyBlockFormat('h3');
        } else if (lineText === '>') {
          e.preventDefault();
          document.execCommand('delete', false);
          document.execCommand('delete', false);
          applyBlockFormat('quote');
        } else if (lineText === '-' || lineText === '*') {
          e.preventDefault();
          document.execCommand('delete', false);
          document.execCommand('delete', false);
          applyBlockFormat('bullet');
        } else if (lineText === '1.') {
          e.preventDefault();
          for (let i = 0; i < 3; i++) document.execCommand('delete', false);
          applyBlockFormat('number');
        }
      }
    },
    [applyBlockFormat, execFormat, handleRedo, handleUndo, markdownShortcutsEnabled, saveSelection]
  );

  const handleInput = useCallback(() => {
    updateCounts();
    if (editorRef.current) onChange?.(editorRef.current.innerHTML);
  }, [updateCounts, onChange]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      const sanitizedHtml = html ? sanitizePastedHtml(html) : null;

      if (sanitizedHtml) {
        document.execCommand('insertHTML', false, sanitizedHtml);
      } else {
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }

      pushHistory();
      updateCounts();
      if (editorRef.current) onChange?.(editorRef.current.innerHTML);
    },
    [pushHistory, updateCounts, onChange]
  );

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded transition-all duration-100 text-xs cursor-pointer active:scale-95 sm:h-7 sm:w-7',
        active
          ? 'bg-brand/20 text-brand-400'
          : 'text-ink-400 hover:bg-ink-700 hover:text-ink-100',
        disabled && 'cursor-not-allowed opacity-30'
      )}
    >
      {children}
    </button>
  );

  const ToolbarSep = () => <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-ink-700 sm:block" />;

  return (
    <div className="flex h-full flex-col">
      {/* Main toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 overflow-visible border-b border-ink-700 bg-ink-900 px-2 py-2 shrink-0 sm:px-3">
        <ToolbarButton onClick={handleUndo} disabled={!toolbar.canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={handleRedo} disabled={!toolbar.canRedo} title="Redo (Ctrl+Y)">
          <Redo2 size={13} />
        </ToolbarButton>
        <ToolbarSep />

        {/* Block format */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowBlockFormatDropdown(!showBlockFormatDropdown); }}
            className="flex h-8 min-w-32 items-center gap-1.5 rounded bg-ink-800 px-2.5 text-xs font-semibold text-ink-300 transition-colors hover:bg-ink-700 sm:h-7"
          >
            <span className="shrink-0">{blockFormatIcons[toolbar.blockFormat]}</span>
            <span className="flex-1 truncate text-left">{blockFormatLabels[toolbar.blockFormat]}</span>
            <ChevronDown size={10} className="shrink-0 text-ink-500" />
          </button>

          {showBlockFormatDropdown && (
            <>
              <div className="fixed inset-0 z-10" onMouseDown={() => setShowBlockFormatDropdown(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-ink-700 bg-ink-800 py-1 shadow-xl" style={{ minWidth: 'min(180px, calc(100vw - 2rem))' }}>
                {(Object.keys(blockFormatLabels) as BlockFormat[]).map((fmt) => (
                  <button
                    key={`fmt-${fmt}`}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyBlockFormat(fmt); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-ink-700',
                      toolbar.blockFormat === fmt ? 'text-brand' : 'text-ink-300'
                    )}
                  >
                    <span className="w-4 shrink-0">{blockFormatIcons[fmt]}</span>
                    {blockFormatLabels[fmt]}
                    {toolbar.blockFormat === fmt && <span className="ml-auto text-brand">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <ToolbarSep />

        <ToolbarButton onClick={() => execFormat('bold')} active={toolbar.bold} title="Bold (Ctrl+B)">
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execFormat('italic')} active={toolbar.italic} title="Italic (Ctrl+I)">
          <Italic size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execFormat('underline')} active={toolbar.underline} title="Underline (Ctrl+U)">
          <Underline size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execFormat('strikeThrough')} active={toolbar.strikethrough} title="Strikethrough">
          <Strikethrough size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={applyInlineCode} active={toolbar.code} title="Inline code">
          <Code size={13} />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton onClick={() => execFormat('justifyLeft')} active={toolbar.alignLeft} title="Align left">
          <AlignLeft size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execFormat('justifyCenter')} active={toolbar.alignCenter} title="Align center">
          <AlignCenter size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execFormat('justifyRight')} active={toolbar.alignRight} title="Align right">
          <AlignRight size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execFormat('justifyFull')} active={toolbar.alignJustify} title="Justify">
          <AlignJustify size={13} />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton onClick={() => applyBlockFormat('bullet')} active={toolbar.blockFormat === 'bullet'} title="Bulleted list">
          <List size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyBlockFormat('number')} active={toolbar.blockFormat === 'number'} title="Numbered list">
          <ListOrdered size={13} />
        </ToolbarButton>
        <ToolbarButton onClick={() => applyBlockFormat('checkbox')} active={toolbar.blockFormat === 'checkbox'} title="Checkbox list">
          <CheckSquare size={13} />
        </ToolbarButton>

        <ToolbarSep />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              if (!showLinkInput) saveSelection();
              setShowLinkInput(!showLinkInput);
            }}
            title="Insert link (Ctrl+K)"
          >
            <Link size={13} />
          </ToolbarButton>
          {showLinkInput && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLinkInput(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-ink-700 bg-ink-800 p-3 shadow-xl" style={{ width: 'min(18rem, calc(100vw - 2rem))' }}>
                <p className="mb-2 text-[11px] font-semibold text-ink-400">Insert Link</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded border border-ink-600 bg-ink-700 px-2 py-1.5 text-xs text-ink-100 placeholder-ink-500 focus:border-brand/50 focus:outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInsertLink(); }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleInsertLink}
                    className="rounded bg-brand px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                  >
                    Insert
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Table */}
        <div className="relative">
          <ToolbarButton onClick={() => setShowTableInsert(!showTableInsert)} title="Insert table">
            <Table size={13} />
          </ToolbarButton>
          {showTableInsert && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTableInsert(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-ink-700 bg-ink-800 p-3 shadow-xl" style={{ width: 'min(14rem, calc(100vw - 2rem))' }}>
                <p className="mb-3 text-[11px] font-semibold text-ink-400">Insert Table</p>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] text-ink-500">Rows</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableRows}
                      onChange={(e) => setTableRows(Number(e.target.value))}
                      className="w-full rounded border border-ink-600 bg-ink-700 px-2 py-1.5 text-xs text-ink-100 focus:border-brand/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-ink-500">Columns</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tableCols}
                      onChange={(e) => setTableCols(Number(e.target.value))}
                      className="w-full rounded border border-ink-600 bg-ink-700 px-2 py-1.5 text-xs text-ink-100 focus:border-brand/50 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInsertTable}
                  className="w-full rounded bg-brand py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                >
                  Insert {tableRows}×{tableCols} table
                </button>
              </div>
            </>
          )}
        </div>

        <ToolbarButton onClick={handleInsertHR} title="Insert horizontal rule">
          <Minus size={13} />
        </ToolbarButton>

        {/* Image */}
        <div className="relative">
          <ToolbarButton
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            title="Insert image"
          >
            {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
          </ToolbarButton>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          {showImageUrlInput && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowImageUrlInput(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-ink-700 bg-ink-800 p-3 shadow-xl" style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
                <p className="mb-2 text-[11px] font-semibold text-ink-400">Image URL</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://.../image.png"
                    className="flex-1 rounded border border-ink-600 bg-ink-700 px-2 py-1.5 text-xs text-ink-100 placeholder-ink-500 focus:border-brand/50 focus:outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInsertImageUrl(); }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleInsertImageUrl}
                    className="rounded bg-brand px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <ToolbarSep />

        <ToolbarButton onClick={() => applyBlockFormat('quote')} active={toolbar.blockFormat === 'quote'} title="Blockquote">
          <Quote size={13} />
        </ToolbarButton>
      </div>

      {/* Floating toolbar */}
      {showFloatingToolbar && (
        <div
          className="absolute z-50 hidden items-center gap-0.5 rounded-lg border border-ink-700 bg-ink-800 px-1 py-1 shadow-xl sm:flex"
          style={{ top: floatingToolbarPos.top, left: floatingToolbarPos.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarButton onClick={() => execFormat('bold')} active={toolbar.bold} title="Bold">
            <Bold size={12} />
          </ToolbarButton>
          <ToolbarButton onClick={() => execFormat('italic')} active={toolbar.italic} title="Italic">
            <Italic size={12} />
          </ToolbarButton>
          <ToolbarButton onClick={() => execFormat('underline')} active={toolbar.underline} title="Underline">
            <Underline size={12} />
          </ToolbarButton>
          <ToolbarButton onClick={() => execFormat('strikeThrough')} active={toolbar.strikethrough} title="Strikethrough">
            <Strikethrough size={12} />
          </ToolbarButton>
          <div className="mx-0.5 h-4 w-px bg-ink-700" />
          <ToolbarButton
            onClick={() => {
              saveSelection();
              setShowLinkInput(true);
            }}
            title="Link"
          >
            <Link2 size={12} />
          </ToolbarButton>
          <ToolbarButton onClick={() => applyBlockFormat('quote')} title="Quote">
            <Quote size={12} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor content */}
      <div className="lexical-editor relative flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onMouseDown={handleEditorMouseDown}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onMouseUp={updateToolbarState}
          data-placeholder="Start writing your post... Type / for commands, or use the toolbar above."
          className="min-h-full px-4 py-4 text-[15px] leading-7 text-ink-50 outline-none sm:px-6 lg:px-8"
        />
        {isEditorEffectivelyEmpty && (
          <div className="pointer-events-none px-4 py-4 text-[15px] text-ink-500 sm:px-6 lg:px-8">
            Start writing your post... Use the toolbar above to format.
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-ink-700 bg-ink-900/50 px-4 py-2">
        <div className="flex items-center gap-4 text-[11px] text-ink-500">
          <span><span className="font-semibold tabular-nums text-ink-400">{wordCount}</span> words</span>
          <span><span className="font-semibold tabular-nums text-ink-400">{charCount}</span> characters</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-500">
          <button
            type="button"
            onClick={() => setMarkdownShortcutsEnabled((value) => !value)}
            className={cn(
              'rounded-full border px-2 py-1 font-semibold transition-colors',
              markdownShortcutsEnabled
                ? 'border-green/30 bg-green/10 text-green'
                : 'border-ink-700 bg-ink-800 text-ink-400 hover:bg-ink-700'
            )}
          >
            Markdown {markdownShortcutsEnabled ? 'On' : 'Off'}
          </button>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Auto-saved
          </span>
        </div>
      </div>
    </div>
  );
}