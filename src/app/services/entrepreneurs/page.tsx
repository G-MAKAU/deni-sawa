import type { Metadata } from 'next';
import { site } from '@/data/site';
import { ServiceCategoryLayout, type ServiceCategoryConfig } from '@/components/ServiceCategoryLayout';

export const metadata: Metadata = {
  title: 'Fractional CFO & CEO Support, Business Recovery & Growth for Founders | Deni Sawa',
  description: 'Fractional business support, recovery and growth strategy, and leadership governance for entrepreneurs and founders.',
  alternates: { canonical: `${site.url}/services/entrepreneurs` },
};

const config: ServiceCategoryConfig = {
  number: '02',
  name: 'Entrepreneurs & Founders',
  positioningTag: 'Stability → Structure → Growth → Best-in-Class',
  description: 'Our core business support pathway for founders and owners who need stronger financial discipline, governance, execution and growth support.',
  heroImage: { src: '/images/entrepreneur-support.jpg', alt: 'Founder business planning session' },
  primaryCta: { label: 'Take Business Health Check', href: '/health-checks/business-health-check' },
  secondaryCta: { label: 'Discuss Fractional Support', href: '/contact' },
  subServiceEyebrow: 'Pathways for Entrepreneurs & Founders',
  subServices: [
    {
      label: 'Fractional / Part-Time Business Support',
      description:
        'Boardroom capability without boardroom payroll — senior finance and strategic leadership on a part-time, embedded basis.',
      image: { src: '/images/founder-planning.jpg', alt: 'Founder strategic planning session' },
      bullets: [
        'Fractional CFO / Financial Leadership',
        'Fractional CEO / Strategic Leadership',
        'Cashflow & working capital',
        'Management reporting and performance',
        'Governance, controls and KPIs',
      ],
    },
    {
      label: 'Business Recovery & Growth',
      description:
        'Diagnose what is actually happening, stabilise the business, then build a deliberate path to sustainable growth.',
      image: { src: '/images/growth.jpg', alt: 'Business recovery and growth strategy' },
      bullets: [
        'Business Health Check and diagnostics',
        'Recovery and restructuring support',
        'Growth strategy',
        'Business model and revenue review',
        'Strategic partnerships and investor readiness',
      ],
    },
    {
      label: 'Leadership, Governance & Accountability',
      description:
        'Install the systems and discipline that let the business run on process rather than on you being in every room.',
      image: { src: '/images/governance.jpg', alt: 'Governance and accountability systems' },
      bullets: [
        'Founder mentorship',
        'Governance implementation',
        'KPI and accountability systems',
        'Executive Finance for Non-Finance Leaders',
        'LMS-supported learning',
      ],
    },
  ],
  outcomes: [
    'Stable operations',
    'Better cashflow',
    'Stronger governance',
    'Reduced founder dependency',
    'Scalable growth',
    'Investment readiness',
  ],
  journey: {
    eyebrow: 'Your Journey',
    title: 'Stability → Structure → Growth → Best-in-Class',
    description:
      'A founder-focused path that moves the business from fragile and dependent to disciplined, scalable and genuinely best-in-class.',
    stages: [
      {
        stage: 'Stability',
        icon: 'Shield',
        description:
          'Diagnose the real situation and stabilise cashflow, debt and operations before anything else. Survival first, then build.',
      },
      {
        stage: 'Structure',
        icon: 'Building2',
        description:
          'Install the governance, controls, KPIs and reporting that let the business run on process rather than on you being everywhere.',
      },
      {
        stage: 'Growth',
        icon: 'TrendingUp',
        description:
          'With stability and structure in place, pursue deliberate growth — model, revenue, partnerships and market expansion.',
      },
      {
        stage: 'Best-in-Class',
        icon: 'Award',
        description:
          'Embed the discipline, accountability and talent that make the business excellent, investable and no longer founder-dependent.',
      },
    ],
  },
};

export default function EntrepreneursPage() {
  return <ServiceCategoryLayout config={config} />;
}
