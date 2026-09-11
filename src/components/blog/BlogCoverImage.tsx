import type { ReactNode } from 'react';
import Image from 'next/image';

interface BlogCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackTextSize?: string;
  overlay?: ReactNode;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}

export function BlogCoverImage({
  src,
  alt,
  className = '',
  overlay,
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, 50vw',
}: BlogCoverImageProps) {
  const imageSrc = src || '/images/blog-default-cover.webp';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={loading === 'eager'}
        className="object-cover"
      />
      {overlay}
    </div>
  );
}
