import type { Metadata } from 'next';
import { site } from '@/data/site';
import { ServiceCategoryLayout, type ServiceCategoryConfig } from '@/components/ServiceCategoryLayout';

export const metadata: Metadata = {
  title: 'Investor Readiness, Portfolio Oversight & Advisory | Deni Sawa',
  description: 'Investment readiness assessment, portfolio performance monitoring, and independent investor representation for SME and growth-business investments.',
  alternates: { canonical: `${site.url}/services/investors` },
};

const config: ServiceCategoryConfig = {
  number: '03',
  name: 'Investors',
  positioningTag: 'Visibility → Governance → Accountability → Portfolio Performance',
  description: 'We support investors seeking stronger visibility, governance and execution discipline across SME and growth-business investments.',
  heroImage: { src: '/images/hero-investors.webp', alt: 'Investor reviewing portfolio performance data' },
  primaryCta: { label: 'Investor & Partner Enquiry', href: '/contact' },
  subServiceEyebrow: 'Pathways for Investors & Partners',
  subServices: [
    {
      label: 'Investor Readiness',
      description:
        'Before you commit capital, verify that the business, the team and the information environment are investment-ready.',
      image: { src: '/images/investor-readiness.jpg', alt: 'Investment readiness assessment' },
      bullets: [
        'Investment readiness assessment',
        'Business and financial readiness',
        'Management information and reporting',
        'Governance readiness',
      ],
    },
    {
      label: 'Portfolio Oversight',
      description:
        'Stay close to your portfolio with independent monitoring, KPI tracking and early warning on risks.',
      image: { src: '/images/portfolio-oversight.jpg', alt: 'Portfolio performance monitoring' },
      bullets: [
        'Portfolio performance monitoring',
        'KPI and milestone tracking',
        'Financial and cashflow monitoring',
        'Governance and founder accountability',
      ],
    },
    {
      label: 'Investor Advisory & Representation',
      description:
        'Independent representation and escalation that protects your position and keeps founders accountable.',
      image: { src: '/images/investor-rep.jpg', alt: 'Investor representation and advisory' },
      bullets: [
        'Independent investor representation',
        'Risk identification and escalation',
        'Investor reporting and governance monitoring',
        'Post-investment oversight',
      ],
    },
  ],
  outcomes: [
    'Investment visibility',
    'Governance standards',
    'Founder accountability',
    'Portfolio performance',
  ],
  journey: {
    eyebrow: 'Your Journey',
    title: 'Visibility → Governance → Accountability → Portfolio Performance',
    description:
      'An investor-focused path that turns opaque, founder-dependent holdings into visible, governed and performing investments.',
    stages: [
      {
        stage: 'Visibility',
        icon: 'Eye',
        description:
          'See what is actually happening in every portfolio business — real financials, real cashflow and real management information.',
      },
      {
        stage: 'Governance',
        icon: 'Scale',
        description:
          'Institute the board, reporting and control standards that protect your position and professionalise the business.',
      },
      {
        stage: 'Accountability',
        icon: 'LineChart',
        description:
          'Hold founders and management accountable through KPIs, milestones and disciplined review cadences.',
      },
      {
        stage: 'Portfolio Performance',
        icon: 'TrendingUp',
        description:
          'With visibility, governance and accountability in place, portfolio performance improves — and value is protected and grown.',
      },
    ],
  },
};

export default function InvestorsPage() {
  return <ServiceCategoryLayout config={config} />;
}
