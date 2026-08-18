/**
 * Central content + configuration for Deni Sawa Partners.
 * All brand-facing strings live here so pages stay declarative.
 */

export const site = {
  name: 'Deni Sawa Partners',
  tagline: 'From Special Situations to Best-in-Class',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://denisawa.co.ke',
  email: 'advisory@denisawa.co.ke',
  phone: '+254 702 448 601',
  address: 'Nairobi, Kenya',
  logo: '/images/logo.png',
  logoWhite: '/images/logo-white.png',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61586258092432',
    linkedin: 'https://www.linkedin.com/company/deni-sawa-partners/',
    instagram: 'https://www.instagram.com/denisawadm/',
    tiktok: 'https://vm.tiktok.com/ZS983HG7L1yvo-3wc1w/',
    youtube: 'http://www.youtube.com/@denisawa8468',
  },
  description:
    'AI-enabled advisory and fractional business support helping organisations recover, stabilise, grow and perform at their best.',
};

export interface NavItem {
  label: string;
  href?: string;
  children?: { label: string; href: string; description?: string }[];
}

export const navItems: NavItem[] = [
  {
    label: 'Services',
    href: '/business-support',
    children: [
      { label: 'Business Support', href: '/business-support', description: 'Explore every service area' },
      { label: 'Fractional CFO', href: '/business-support/fractional-cfo', description: 'Financial leadership on demand' },
      { label: 'Fractional CEO', href: '/business-support/fractional-ceo', description: 'Strategic leadership and execution' },
      { label: 'Governance & Controls', href: '/business-support/governance-controls', description: 'Structures, policies and accountability' },
      { label: 'Growth & Development', href: '/business-support/growth-support', description: 'Revenue, partnerships and investor readiness' },
      { label: 'Special Situations', href: '/business-support/special-situations', description: 'Distress, restructuring and recovery' },
    ],
  },
  { label: 'Health Checks', href: '/health-checks' },
  { label: 'Learning', href: '/learning' },
  { label: 'SpecialSit Network', href: '/specialsit-network' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'About Us', href: '/about', description: 'Who we are' },
      { label: 'Leadership', href: '/about/leadership', description: 'The team behind the method' },
      { label: 'Philosophy', href: '/about/philosophy', description: 'How we think and work' },
      { label: 'Experience', href: '/about/experience', description: 'Track record and credentials' },
      { label: 'Blog & Insights', href: '/about/blog', description: 'Articles, guides and financial insights' },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

export const capabilities = [
  'Strategy',
  'Finance & CFO',
  'Governance',
  'Cashflow',
  'Growth',
  'Investor Readiness',
];

export interface Service {
  slug: string;
  title: string;
  short: string;
  icon: string;
  positioning: string;
  whoFor: string;
  howWeWork: string[];
  capabilities: string[];
  outcomes: string[];
}

export const services: Service[] = [
  {
    slug: 'fractional-cfo',
    title: 'Fractional CFO / Financial Leadership',
    short: 'Financial visibility, cashflow management and management reporting — without the cost of a full-time hire.',
    icon: 'LineChart',
    positioning:
      'Most businesses do not need a full-time CFO — they need the discipline of one. We step in on a part-time, senior basis to bring financial visibility, controls and decision-grade reporting to your leadership team.',
    whoFor:
      'Founders and CEOs who have outgrown spreadsheet accounting, need decision-grade numbers and want CFO-level discipline without the full-time payroll cost.',
    howWeWork: [
      'Assess the current finance function, reporting and controls',
      'Design the cashflow, budgeting and reporting rhythm that fits your stage',
      'Embed a fractional finance lead who trains and upgrades your team as they go',
    ],
    capabilities: [
      'Financial visibility and management reporting',
      'Cashflow management and forecasting',
      'Budgeting and financial planning',
      'Financial controls and reporting discipline',
      'Working capital management',
      'Financial decision support for leadership',
    ],
    outcomes: [
      'Clear, decision-ready numbers every month',
      'Cashflow controlled rather than reacted to',
      'A finance function that earns investor confidence',
    ],
  },
  {
    slug: 'fractional-ceo',
    title: 'Fractional CEO / Strategic Leadership',
    short: 'Strategic planning, performance and execution leadership for founders who need a senior hand on the tiller.',
    icon: 'Briefcase',
    positioning:
      'Founders often reach a stage where the business outgrows its current leadership structure. A fractional CEO provides senior strategic leadership — planning, execution and accountability — without the full-time cost.',
    whoFor:
      'Founders hitting a growth ceiling, boards between permanent appointments, and businesses that need senior operational leadership with clear accountability.',
    howWeWork: [
      'Clarify strategy, priorities and the decisions that matter',
      'Build the operating rhythm — reviews, KPIs and accountability',
      'Drive execution alongside your team until the structure holds on its own',
    ],
    capabilities: [
      'Strategic planning and business performance',
      'Growth execution and operational accountability',
      'Management accountability systems',
      'Business restructuring and turnaround',
      'Founder transition and succession planning',
      'Board and investor communication',
    ],
    outcomes: [
      'A clear strategy translated into monthly execution',
      'Accountable management that delivers on commitments',
      'A business that can scale beyond its founder',
    ],
  },
  {
    slug: 'governance-controls',
    title: 'Governance & Business Controls',
    short: 'Governance structures, policies, KPI frameworks and risk controls that make a business credible.',
    icon: 'ShieldCheck',
    positioning:
      'Investors, banks and partners underwrite governance. We build the structures, policies and control systems that protect value, reduce risk and make your business bankable.',
    whoFor:
      'Businesses preparing for funding, acquisition or due diligence, and organisations that need credible structure for banks, investors and regulators.',
    howWeWork: [
      'Benchmark current governance, policies and controls against best practice',
      'Design the framework — board rhythm, KPIs, risk controls and reporting',
      'Embed it with your team so it operates without constant hand-holding',
    ],
    capabilities: [
      'Governance structures and board support',
      'Policies, procedures and accountability systems',
      'KPI frameworks and management dashboards',
      'Internal controls and risk management',
      'Compliance and statutory readiness',
      'Audit preparation and remediation',
    ],
    outcomes: [
      'A governance spine that survives due diligence',
      'Risks identified and controlled before they bite',
      'Credibility with investors, banks and regulators',
    ],
  },
  {
    slug: 'growth-support',
    title: 'Growth & Business Development',
    short: 'Growth strategy, revenue optimisation, business model review and strategic partnerships.',
    icon: 'TrendingUp',
    positioning:
      'Growth is a discipline, not an accident. We review your business model, sharpen your revenue engine and build the partnerships and investor story required to fund and sustain expansion.',
    whoFor:
      'Businesses with a proven model that want deliberate, sustainable growth — through sharper revenue, stronger partnerships and investor-ready positioning.',
    howWeWork: [
      'Review the business model, pricing and revenue economics',
      'Identify the highest-leverage growth moves and partnerships',
      'Build the investor story and readiness that funds the next stage',
    ],
    capabilities: [
      'Growth strategy and revenue optimisation',
      'Business model review and redesign',
      'Strategic partnerships and alliances',
      'Investor readiness preparation',
      'Pricing and margin management',
      'Market and product prioritisation',
    ],
    outcomes: [
      'A credible growth plan with clear economics',
      'Revenue engines that compound rather than stall',
      'An investor-ready financial story',
    ],
  },
  {
    slug: 'special-situations',
    title: 'Special Situations Support',
    short: 'Financial distress, debt pressure, cashflow crisis and restructuring — when it matters most.',
    icon: 'LifeBuoy',
    positioning:
      'When a business faces financial distress, clarity and speed decide the outcome. We bring bankers-grade experience to debt pressure, cashflow crisis, underperformance and restructuring — stabilising first, then rebuilding.',
    whoFor:
      'Businesses under financial distress or debt pressure, and stakeholders who need a credible, realistic plan when time is against them.',
    howWeWork: [
      'Stabilise the situation — cash, creditors and immediate risk',
      'Negotiate a realistic plan with lenders and stakeholders',
      'Rebuild performance and governance to prevent regression',
    ],
    capabilities: [
      'Financial distress and debt pressure management',
      'Cashflow crisis stabilisation',
      'Creditor and lender negotiation',
      'Underperformance diagnosis and correction',
      'Founder dependency and key-man risk',
      'Business restructuring and recovery plans',
    ],
    outcomes: [
      'Stabilisation before structural change',
      'Creditors managed with a credible plan',
      'A realistic path from distress to recovery',
    ],
  },
];

export const audiences = [
  {
    title: 'Professionals & Individuals',
    accent: 'brand',
    journey: 'Financial Health → Resilience → Leadership',
    description:
      'Personal financial health is the foundation of professional performance. Build resilience, clarity and the confidence to lead.',
    cta: 'Professional Financial Health Check',
    href: '/health-checks/professional-health-check',
  },
  {
    title: 'Entrepreneurs & Founders',
    accent: 'growth',
    journey: 'Stability → Structure → Growth → Best-in-Class',
    description:
      'From stabilising cashflow to building governance and growth systems — the support founders need at every stage.',
    cta: 'Business Health Check',
    href: '/health-checks/business-health-check',
  },
  {
    title: 'Investors',
    accent: 'brand',
    journey: 'Visibility → Governance → Accountability → Portfolio Performance',
    description:
      'Independent oversight, governance monitoring and portfolio performance reporting that protect and grow investment value.',
    cta: 'Investor & Partner Enquiry',
    href: '/investors',
  },
];

export const healthChecks = {
  business: {
    slug: 'business',
    title: 'Business Health Check',
    subtitle: 'AI-powered assessment of financial health, operations, governance, cashflow and growth readiness.',
    description:
      'A confidential, structured assessment across the five pillars of a healthy business. Claude AI turns your answers into a diagnostic report with prioritised recommendations.',
    areas: ['Financial Health', 'Operations', 'Governance', 'Cashflow', 'Growth & Investment Readiness'],
  },
  professional: {
    slug: 'professional',
    title: 'Professional Financial Health Check',
    subtitle: 'AI-powered assessment of personal finances, debt, cashflow, savings and future financial security.',
    description:
      'A structured, confidential review of your personal financial position — debt, cashflow, savings and resilience — with a prioritised action plan.',
    areas: ['Personal Finances', 'Debt', 'Cashflow', 'Savings', 'Resilience', 'Future Financial Security'],
  },
};

export const methodSteps = [
  {
    letter: 'D',
    title: 'Diagnose',
    description: 'Understand the real situation',
    objective: 'Establish the facts before proposing any fix — cash, debt, controls, performance and stakeholders.',
    example: 'A distributor under creditor pressure: we map the full cash position and every obligation within days.',
    service: '/health-checks/business-health-check',
    serviceLabel: 'Start with a Health Check',
  },
  {
    letter: 'E',
    title: 'Evaluate',
    description: 'Determine priorities, risks and opportunities',
    objective: 'Rank the decisions that matter and quantify what each one changes.',
    example: 'We identify which obligations are restructurable and which costs must move this month, not next.',
    service: '/business-support/fractional-cfo',
    serviceLabel: 'Fractional CFO support',
  },
  {
    letter: 'N',
    title: 'Negotiate',
    description: 'Create workable solutions',
    objective: 'Turn a position into a plan your lenders, partners and team can agree to.',
    example: 'A repayment schedule and equity line negotiated so the business keeps operating while it recovers.',
    service: '/business-support/special-situations',
    serviceLabel: 'Special Situations support',
  },
  {
    letter: 'I',
    title: 'Implement',
    description: 'Put the recovery or growth plan into action',
    objective: 'Execute with accountability — rhythms, KPIs and a senior hand on execution.',
    example: 'A 90-day operating plan with weekly reviews, cash forecasting and a management cadence that sticks.',
    service: '/business-support/fractional-ceo',
    serviceLabel: 'Fractional CEO leadership',
  },
  {
    letter: 'S',
    title: 'Sustain',
    description: 'Build systems that prevent regression and support long-term performance',
    objective: 'Embed governance, controls and reporting so the gains hold without constant hand-holding.',
    example: 'Board rhythm, policy framework and reporting that survive due diligence and scale with the business.',
    service: '/business-support/governance-controls',
    serviceLabel: 'Governance & Controls',
  },
];

export const journeyStages = [
  {
    stage: 'Recovery',
    description: 'Stabilise the situation. Stop the bleed, protect what matters and restore control.',
    icon: 'HeartPulse',
  },
  {
    stage: 'Resilience',
    description: 'Build the systems and buffers that absorb shocks — financial, operational and leadership.',
    icon: 'Shield',
  },
  {
    stage: 'Growth',
    description: 'Put the organisation on a deliberate, well-governed path to sustainable growth.',
    icon: 'TrendingUp',
  },
  {
    stage: 'Best-in-Class',
    description: 'Embed the standards, reporting and culture that keep performance compounding.',
    icon: 'Award',
  },
];

export const conversionSteps = [
  { step: '01', title: 'Identify', description: 'What is your situation?' },
  { step: '02', title: 'Assess', description: 'Take the relevant Health Check' },
  { step: '03', title: 'Understand', description: 'Receive your Health Report' },
  { step: '04', title: 'Choose', description: 'Self-Learning | Mentorship | Fractional Support | Advisory' },
  { step: '05', title: 'Implement', description: 'LMS + Tools + Advisory + Accountability' },
  { step: '06', title: 'Transform', description: 'Recovery → Resilience → Growth → Best-in-Class' },
];

export const learningPrograms = [
  {
    slug: 'executive-finance',
    title: 'Executive Finance for Non-Finance Leaders',
    short: 'The flagship programme for leaders who want to understand the numbers behind their decisions.',
    positioning:
      'You do not need an accounting background to lead with financial intelligence. This programme gives leaders the confidence to read statements, challenge assumptions and make better decisions around profitability, cashflow and working capital.',
    capabilities: [
      'Read and interpret financial statements with confidence',
      'Understand business numbers and what drives them',
      'Make better decisions around profitability and cashflow',
      'Manage working capital with discipline',
      'Strengthen governance, reporting and financial controls',
      'Connect finance to business performance and leadership decisions',
    ],
    format: 'Cohort programme · 6 modules · Capstone case study',
  },
];

export const learningPathways = [
  { title: 'Business Recovery', slug: '/learning/business-recovery', description: 'Rebuild and restructure under pressure' },
  { title: 'Governance', slug: '/learning/governance', description: 'Boards, policies and accountability' },
  { title: 'Financial Resilience', slug: '/learning/financial-resilience', description: 'Buffers, systems and sustainable performance' },
  { title: 'Learning Centre / LMS', slug: '/learning#lms', description: 'Self-paced learning — Phase 2', soon: true },
];

export const investorServices = [
  {
    title: 'Investor Readiness',
    slug: 'investor-readiness',
    description: 'Preparing founders and businesses for investment — clean financials, governance and a credible story.',
    icon: 'Rocket',
  },
  {
    title: 'Post-Investment Oversight',
    slug: 'portfolio-oversight',
    description: 'Independent monitoring and reporting after the cheque is written.',
    icon: 'Eye',
  },
  {
    title: 'Governance Monitoring',
    slug: 'governance',
    description: 'Ensuring governance standards are maintained between board meetings.',
    icon: 'Scale',
  },
  {
    title: 'Investor Representation',
    slug: 'investor-representation',
    description: 'Independent, outsourced representation of investor interests at the table.',
    icon: 'Handshake',
  },
];

export const investorCapabilities = [
  'Portfolio performance tracking and reporting',
  'Founder accountability and commitment tracking',
  'Risk tracking — identifying and escalating material risks',
  'Clear, structured investment reporting',
  'Due-diligence support for prospective investments',
  'Independent / outsourced board representation',
];

export const networkBenefits = [
  'Peer Forums — candid exchange with operators in similar situations',
  'Mentorship — direct access to seasoned bankers and operators',
  'Investor Connections — curated introductions for qualifying members',
  'Strategic Partnerships — collaboration opportunities across the ecosystem',
  'Learning — member-only sessions and materials',
  'Accountability — progress disciplines that keep plans moving',
];

export const insights = {
  title: 'Insights',
  description:
    'Perspectives, frameworks and field notes on special situations, fractional leadership, governance and the road to Best-in-Class.',
};
