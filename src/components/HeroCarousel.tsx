'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HeroImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface HeroCarouselProps {
  images: HeroImage[];
  interval?: number;
  className?: string;
}

export function HeroCarousel({ images, interval = 5000, className }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [paused, next, interval, images.length]);

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-full w-full">
        {images.map((img, i) => {
          const isCurrent = i === current;
          const shouldRender = mounted ? isCurrent || i <= 2 : i === 0;

          if (!shouldRender) return null;

          return (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              placeholder="blur"
              blurDataURL="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          );
        })}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:left-5 lg:left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-5 lg:right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute sm:-ml-10 md:-ml-16 bg-brand p-2 rounded-sm sm:bottom-12 md:bottom-4 left-1/4 z-10 flex -translate-x-1/2 items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-5 bg-white'
                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
