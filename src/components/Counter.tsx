import { useCountUp, useInView } from '@/lib/hooks';

interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function Counter({ target, suffix = '', prefix = '', decimals = 0, className = '' }: CounterProps) {
  const { ref, inView } = useInView({ threshold: 0.3 });
  const value = useCountUp(target, 2200, inView);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <span ref={ref as never} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
