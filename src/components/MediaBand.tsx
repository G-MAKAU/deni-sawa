import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';

interface MediaBandProps {
  src: string;
  alt: string;
  /** Optional caption/eyebrow rendered over the image. */
  caption?: string;
  className?: string;
  height?: 'md' | 'lg';
}

/** Full-width photographic band used to break sections with real imagery. */
export function MediaBand({ src, alt, caption, className, height = 'md' }: MediaBandProps) {
  return (
    <Reveal className={cn('w-full', className)}>
      <div className={cn('relative w-full overflow-hidden', height === 'lg' ? 'h-72 sm:h-96' : 'h-56 sm:h-72')}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent" />
        {caption && (
          <div className="absolute bottom-0 left-0 bg-navy">
            <div className="px-5 py-3 sm:px-8">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-white/80">{caption}</p>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}
