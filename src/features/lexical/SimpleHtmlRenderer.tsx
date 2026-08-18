import type { ReactNode } from 'react';
import styles from './SimpleHtmlRenderer.module.css';

interface SimpleHtmlRendererProps {
  html?: string | null;
  className?: string;
  emptyState?: ReactNode;
}

/**
 * Renders sanitized HTML for email template preview.
 * Similar to BlogContentRenderer but tailored for email templates.
 */
export function SimpleHtmlRenderer({
  html,
  className,
  emptyState = (
    <p className="italic text-muted-foreground">No content available.</p>
  ),
}: SimpleHtmlRendererProps) {
  const content = html?.trim();
  const wrapperClassName = [styles.simpleHtml, className].filter(Boolean).join(' ');

  if (!content) {
    return <article className={wrapperClassName}>{emptyState}</article>;
  }

  return <article className={wrapperClassName} dangerouslySetInnerHTML={{ __html: content }} />;
}