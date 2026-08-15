'use client';

import { motion } from 'motion/react';
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
  up: { y: 16 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.97 },
};

const motionTags = new Map<string, ElementType>();
function getMotionTag(as: string): ElementType {
  let tag = motionTags.get(as);
  if (!tag) {
    tag = motion.create(as as ElementType);
    motionTags.set(as, tag);
  }
  return tag;
}

/** Scroll-reveal wrapper: opacity 0→1 + translateY(16px→0), 350ms. */
export function Reveal({ children, direction = 'up', delay = 0, className = '', as = 'div', id }: RevealProps) {
  const MotionTag = getMotionTag(as);

  return (
    <MotionTag
      id={id}
      className={className}
      initial={{ opacity: 0, ...OFFSET[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: delay / 1000 }}
    >
      {children}
    </MotionTag>
  );
}
