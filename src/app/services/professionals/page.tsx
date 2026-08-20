import type { Metadata } from 'next';
import { site } from '@/data/site';
import { ServiceCategoryLayout, type ServiceCategoryConfig } from '@/components/ServiceCategoryLayout';

export const metadata: Metadata = {
  title: 'Professional Financial Health, Resilience & Leadership | Deni Sawa',
  description: 'Financial health assessment, recovery planning, debt and cashflow support, budgeting and savings discipline for professionals and individuals.',
  alternates: { canonical: `${site.url}/services/professionals` },
};

const config: ServiceCategoryConfig = {
  number: '01',
  name: 'Professionals & Individuals',
  positioningTag: 'Financial Health → Resilience → Leadership',
  description: 'We help professionals and individuals build greater financial clarity, resilience and confidence.',
  heroImage: { src: '/images/professional-health.jpg', alt: 'Professional financial planning session' },
  primaryCta: { label: 'Take Professional Financial Health Check', href: '/health-checks/professional-financial-health-check' },
  subServiceEyebrow: 'Pathways for Professionals & Individuals',
  subServices: [
    {
      label: 'Financial Resilience',
      description:
        'Diagnose your financial position, restructure pressure points and build the cashflow, savings and debt discipline that keeps you resilient.',
      image: { src: '/images/resilience.jpg', alt: 'Professional financial resilience planning' },
      bullets: [
        'Professional Financial Health Assessment',
        'Financial recovery planning',
        'Debt and cashflow support',
        'Budgeting and savings discipline',
      ],
    },
    {
      label: 'Learning & Leadership',
      description:
        'Build the financial and leadership capability to make better decisions — in your career, your business and your life.',
      image: { src: '/images/leadership.jpg', alt: 'Executive finance and leadership development' },
      bullets: [
        'Financial resilience learning',
        'Executive Finance for Non-Finance Leaders',
        'Leadership and decision-making development',
      ],
    },
    {
      label: 'Mentorship & Accountability',
      description:
        'Stay on track with structured 1:1 mentorship and accountability that turns intentions into results.',
      image: { src: '/images/network-forum.jpg', alt: 'Mentorship and accountability session' },
      bullets: [
        '1:1 mentorship',
        'Group accountability',
        'Financial wellness and leadership support',
      ],
    },
  ],
  outcomes: [
    'Greater financial clarity',
    'Stronger resilience',
    'Better decisions',
    'Leadership confidence',
  ],
  journey: {
    eyebrow: 'Your Journey',
    title: 'Financial Health → Resilience → Leadership',
    description:
      'A deliberate path from understanding where you stand, to building the discipline that protects you, to leading with confidence.',
    stages: [
      {
        stage: 'Financial Health',
        icon: 'HeartPulse',
        description:
          'A professional financial health assessment reveals your true position — income, expenses, debt, savings and the patterns behind them.',
      },
      {
        stage: 'Resilience',
        icon: 'Shield',
        description:
          'Build the cashflow, savings and debt discipline that absorbs shocks and creates headroom for the decisions that matter.',
      },
      {
        stage: 'Leadership',
        icon: 'Award',
        description:
          'With clarity and resilience in place, develop the financial and leadership capability to lead your career, business and life with confidence.',
      },
    ],
  },
};

export default function ProfessionalsPage() {
  return <ServiceCategoryLayout config={config} />;
}
