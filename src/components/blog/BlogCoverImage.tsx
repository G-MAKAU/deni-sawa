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
  overlay,
  loading = 'lazy',
}: BlogCoverImageProps) {
  const imageSrc = src || '/images/blog-default-cover.webp';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        className="h-full w-full object-cover"
      />
      {overlay}
    </div>
  );
}
