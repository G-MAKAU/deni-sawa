import type { ReactNode } from 'react';

import styles from './BlogContentRenderer.module.css';

interface BlogContentRendererProps {
  html?: string | null;
  className?: string;
  emptyState?: ReactNode;
}

/**
 * Renders the sanitized HTML produced by the Lexical-style blog editor.
 * The editor output is normalized by `normalizeBlogHtml` before it is stored,
 * so rendering with dangerouslySetInnerHTML is safe and mirrors the
 * Horizon Spire frontend's BlogContentRenderer.
 */
export function BlogContentRenderer({
  html,
  className,
  emptyState = (
    <p className="italic text-muted-foreground">No content available.</p>
  ),
}: BlogContentRendererProps) {
  const content = html?.trim();
  const wrapperClassName = [styles.blogContent, className].filter(Boolean).join(' ');

  if (!content) {
    return <article className={wrapperClassName}>{emptyState}</article>;
  }

  return <article className={wrapperClassName} dangerouslySetInnerHTML={{ __html: content }} />;
}