'use client';

import {
  LineChart,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  LifeBuoy,
  Rocket,
  Eye,
  Scale,
  Handshake,
  HeartPulse,
  Shield,
  Award,
  type LucideProps,
} from 'lucide-react';

const iconMap = {
  LineChart,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  LifeBuoy,
  Rocket,
  Eye,
  Scale,
  Handshake,
  HeartPulse,
  Shield,
  Award,
};

export type IconName = keyof typeof iconMap;

export function BrandIcon({
  name,
  ...props
}: { name: IconName } & LucideProps) {
  const Cmp = iconMap[name] ?? Briefcase;
  return <Cmp {...props} />;
}
