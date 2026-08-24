'use client';

import { motion } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import type { ReactNode, ElementType } from 'react';

type Direction = 'up' | 'left' | 'right' | 'scale';

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  /** Delay in milliseconds, used to stagger siblings (~80ms apart). */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
  id?: string;
}

const OFFSET: Record<Direction, { x?: number; y?: number; scale?: number }> = {
  up: { y: 24 },
  left: { x: -40 },
  right: { x: 40 },
  scale: { scale: 0.95 },
};

const TAG_MAP: Record<string, string> = {
  div: 'div',
  section: 'section',
  li: 'li',
  span: 'span',
};

/** Scroll-reveal wrapper: opacity 0→1 + directional slide, 450ms.
 *  Uses a native IntersectionObserver for reliable SSR-safe triggering. */
export function Reveal({ children, direction = 'up', delay = 0, className = '', as = 'div', id }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = TAG_MAP[as] || 'div';
  const offset = OFFSET[direction];

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: delay / 1000 }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}
