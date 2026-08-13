import { type ReactNode } from 'react';

interface BlogCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTextSize?: string;
  overlay?: ReactNode;
  loading?: 'eager' | 'lazy';
}

export function BlogCoverImage({
  src,
  alt,
  className = '',
  fallbackTextSize = 'text-6xl',
  overlay,
  loading = 'lazy',
}: BlogCoverImageProps) {
  const hasImage = Boolean(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {hasImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading={loading}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.20),transparent_72%)]" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.20),transparent_72%)]" />
          <span className={`relative font-heading font-extrabold tracking-tight text-white/25 ${fallbackTextSize}`}>
            DS
          </span>
        </div>
      )}
      {overlay}
    </div>
  );
}