import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from '@/lib/hooks';

type Direction = 'up' | 'left' | 'right' | 'scale';

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}

const variants: Record<Direction, string> = {
  up: 'opacity-0 translate-y-8',
  left: 'opacity-0 -translate-x-10',
  right: 'opacity-0 translate-x-10',
  scale: 'opacity-0 scale-95',
};

export function Reveal({ children, direction = 'up', delay = 0, className = '', as = 'div' }: RevealProps) {
  const { ref, inView } = useInView();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (inView && !visible) {
      timer.current = setTimeout(() => setVisible(true), delay);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [inView, delay, visible]);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : variants[direction]} ${className}`}
    >
      {children}
    </Tag>
  );
}
