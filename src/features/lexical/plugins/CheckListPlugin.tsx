'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCheckList } from '@lexical/list';

/**
 * Registers the check-list commands and click handlers. The stock `ListPlugin`
 * only registers ordered/unordered lists, so `INSERT_CHECK_LIST_COMMAND` (used
 * by the toolbar's "Check List" action) needs this separate registration.
 */
export function CheckListPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCheckList(editor);
  }, [editor]);

  return null;
}
