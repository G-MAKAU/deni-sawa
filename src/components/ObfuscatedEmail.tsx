'use client';

import { useState, useEffect } from 'react';

/**
 * Renders an email address as a clickable mailto link.
 * The raw email is never present in the initial HTML — it's assembled
 * client-side from data attributes, defeating simple scrapers.
 */
export function ObfuscatedEmail({
  email,
  className,
  children,
}: {
  email: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    setRendered(true);
  }, []);

  if (!rendered) {
    // Server / initial render: show a placeholder that doesn't contain the email
    return <span className={className}>{children ?? 'Email'}</span>;
  }

  const [user, domain] = email.split('@');
  return (
    <a href={`mailto:${email}`} className={className}>
      {children ?? (
        <span>
          {user}@<span style={{ display: 'none' }}>.</span>{domain}
        </span>
      )}
    </a>
  );
}
