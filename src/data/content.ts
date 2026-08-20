import { learningPrograms, learningPathways } from '@/data/site';

export const business = {
  name: 'Deni Sawa',
  fullName: 'Deni Sawa — Debt Management',
  tagline: 'Clear guidance. Less debt. More peace.',
  heroHeadline: 'Be Debt Free',
  heroSubtext:
    'A clear, caring path to financial freedom. We help you understand your options, build a practical plan, and break free from debt for good.',
  aboutHeadline: 'Leave debt behind and take back your financial freedom.',
  aboutIntro:
    'Deni Sawa — Debt Management is a social enterprise helping people escape the stress of debt. We pair professional, ethical and sustainable advice with practical one-on-one support, so anyone facing financial pressure can find a workable path forward.',
  description:
    'A social enterprise offering practical, one-on-one debt advisory and management — a holistic, caring approach that helps you bring debt to a manageable level and, in time, reach a debt-free future.',
  vision: 'To be an international benchmark in the field of financial solutions provision.',
  mission:
    'To work professionally and ethically, delivering quality services for the provision of viable, successful and sustainable financial solutions.',
  partners:
    'A team of seasoned bankers with deep, hands-on experience across banking, debt management, finance, risk, trade finance and capital raising — in your corner throughout your recovery.',
  email: 'advisory@denisawa.co.ke',
  phone: '+254 702 448 601',
  phoneAlt: '+254 756 281136',
  website: 'denisawa.co.ke',
  facebook: 'https://www.facebook.com/profile.php?id=61586258092432',
  instagram: 'https://www.instagram.com/denisawadm/',
  linkedin: 'https://www.linkedin.com/company/deni-sawa-partners/',
  tiktok: 'https://vm.tiktok.com/ZS983HG7L1yvo-3wc1w/',
  youtube: 'http://www.youtube.com/@denisawa8468',
  logo: '/Deni-sawa-main-logo.webp',
};

export const navLinks = [
  { label: 'About', href: '/about', active: true },
  { label: 'Services', href: '/services', active: true },
  { label: 'Academy', href: '/academy', active: true },
  { label: 'Blog', href: '/about/blog', active: true },
  { label: 'Contact', href: '/contact', active: true },
];

export const heroImages = {
  main: '/Slider1-denisawa.png',
  small1: '/images/hero-1.webp',
  small2: '/images/hero-2.jpg',
  small3: '/images/hero-3.jpg',
  small4: '/images/hero-4.jpg',
};

export const aboutImages = {
  header: '/images/hero-1.webp',
  visual: '/images/hero-4.jpg',
  story: '/images/hero-3.jpg',
  team: '/images/hero-2.jpg',
};

export const quickFeatures = [
  { icon: 'ShieldCheck', title: 'Professional & Ethical', desc: 'Grounded in Biblical principles of service to God and humankind.' },
  { icon: 'Users', title: 'Seasoned Experts', desc: 'Well-seasoned bankers with far-reaching experience in banking and finance.' },
  { icon: 'TrendingDown', title: 'Proven & Sustainable', desc: 'Helping borrowers avoid penalties, auction fees, and legal costs.' },
];

export const stats = [
  { value: 20, suffix: '+', label: 'Years of Experience' },
  { value: 1000, suffix: '+', label: 'Individuals Coached' },
  { value: 48, suffix: ' wks', label: 'Flagship Program' },
  { value: 100, suffix: '%', label: 'Ethical & Sustainable' },
];

export const partners = [
  'KCB Bank Group',
  'Deni Sawa Partners',
  'Maendeleo-Sasa',
  'Daima Associates',
];

export const services = [
  {
    slug: 'debt-management',
    icon: 'Landmark',
    title: 'Debt Management Service',
    tab: 'Debt Management',
    image: '/images/service-debt-management.jpg',
    detailImage: '/images/page-debt-crisis.jpg',
    summary: 'Professional debt management services that help you achieve a debt-free future through a holistic, structured approach to debt reduction.',
    points: ['One-on-one advisory', 'Structured repayment plans', 'Creditor negotiation support'],
    cta: 'schedule',
    overview:
      'Debt rarely resolves itself — it compounds. Our Debt Management Service pairs you with a seasoned advisor who helps you see the full picture of what you owe, build a realistic repayment plan, and negotiate with creditors so you stop bleeding charges, penalties and auction fees.',
    features: [
      { title: 'Complete debt audit', description: 'A confidential review of every obligation — principal, interest, penalties and legal exposure — so nothing surprises you later.' },
      { title: 'Structured repayment plan', description: 'A realistic, income-based plan that protects your essentials while steadily reducing what you owe.' },
      { title: 'Creditor negotiation', description: 'We engage lenders on your behalf to restructure terms, waive penalties and stop escalation to auctions or legal action.' },
      { title: 'Ongoing accountability', description: 'Regular check-ins keep your plan on track and adjust it as your income or circumstances change.' },
    ],
    deliverables: ['Confidential debt assessment', 'Written repayment roadmap', 'Creditor communication on your behalf', 'Progress reviews every month'],
    idealFor: ['Individuals overwhelmed by bank or digital loans', 'Families facing auction or legal threats', 'SME owners with business debt distress', 'Anyone who wants a clear, judgement-free path out'],
    faqs: [
      { q: 'Is my information confidential?', a: 'Absolutely. Everything you share is strictly confidential and never shared without your consent — that is the foundation of our work.' },
      { q: 'How long does the programme take?', a: 'Our structured programmes run 12 to 48 weeks. Many clients feel relief from the very first session as soon as a plan is in place.' },
      { q: 'Can you help with auctions and legal charges?', a: 'Yes. Our advisors are experienced in negotiating to avoid auction fees, penalties and legal costs whenever the situation still allows.' },
    ],
  },
  {
    slug: 'financial-coaching',
    icon: 'GraduationCap',
    title: 'Financial Coaching',
    tab: 'Coaching',
    image: '/images/service-financial-coaching.jpg',
    detailImage: '/images/page-budget.jpg',
    summary: 'Transform your financial situation with personalised one-on-one coaching and ongoing support from the Deni Sawa team.',
    points: ['Personal money management', 'Budgeting & saving habits', 'Accountability partnerships'],
    cta: 'schedule',
    overview:
      'Knowledge alone rarely changes behaviour — accountability does. Financial Coaching pairs you one-on-one with a certified coach who understands your goals, builds a practical money system around your life, and stays with you through check-ins so the new habits actually stick.',
    features: [
      { title: 'Personal money map', description: 'We build a budget that fits your real income and expenses — not a generic template.' },
      { title: 'Saving & emergency habits', description: 'Practical systems to build a buffer and save consistently, even on a tight income.' },
      { title: 'Debt-avoidance coaching', description: 'Learn to spot and resist the traps — payday loans, high-interest credit — before they compound.' },
      { title: 'Accountability partnership', description: 'Regular sessions keep you honest, motivated, and moving toward measurable money goals.' },
    ],
    deliverables: ['Personalised budget & money plan', 'Emergency fund framework', 'Monthly accountability sessions', 'Progress dashboard & milestones'],
    idealFor: ['Young professionals starting out', 'Families rebuilding after financial strain', 'Anyone who struggles to stick to budgets', 'People who want a personal money coach'],
    faqs: [
      { q: 'How is coaching different from advice?', a: 'Advice tells you what to do; coaching walks with you while you do it. You get a plan, tools, and a person who checks in until the habits become yours.' },
      { q: 'Do sessions happen online or in person?', a: 'We offer both — whatever is most comfortable for you. Many clients prefer virtual sessions for privacy and convenience.' },
      { q: 'What should I prepare?', a: 'Just bring an open mind and a rough idea of your income, expenses and debts. We guide you through the rest — no judgement.' },
    ],
  },
  {
    slug: 'financial-literacy',
    icon: 'BookOpen',
    title: 'Financial Literacy',
    tab: 'Literacy',
    image: '/images/service-financial-literacy.jpg',
    detailImage: '/images/page-cashflow.jpg',
    summary: 'Build the knowledge and confidence to make sound financial decisions through practical, accessible financial education.',
    points: ['Money fundamentals', 'Credit & debt literacy', 'Wealth-building principles'],
    cta: 'learn',
    overview:
      'The best way to stay debt-free is to understand money. Financial Literacy gives you the practical foundations — budgeting, credit, saving, and wealth-building — in plain language, so you can make confident decisions for life.',
    features: [
      { title: 'Money fundamentals', description: 'Income, expenses, budgeting and cash flow explained simply and applied to your life.' },
      { title: 'Credit & debt literacy', description: 'Understand interest rates, loan terms, credit scores and how to use credit without being used by it.' },
      { title: 'Wealth-building principles', description: 'Saving, investing and compounding basics that put your money to work.' },
      { title: 'Real-world application', description: 'Every lesson ends with a practical action you can take immediately.' },
    ],
    deliverables: ['Foundational money curriculum', 'Interactive workshops & worksheets', 'Credit health checklist', 'Access to our free online learning portal'],
    idealFor: ['Students and young adults', 'First-time earners', 'Employees wanting workplace literacy', 'Anyone rebuilding from financial mistakes'],
    faqs: [
      { q: 'Is financial literacy a course or a service?', a: 'Both. We run structured learning programmes and also embed literacy modules into coaching and corporate wellness engagements.' },
      { q: 'Do you offer certificates?', a: 'Yes — participants who complete our structured programmes receive a Deni Sawa Academy certificate of completion.' },
      { q: 'Where does learning happen?', a: 'Workshops, webinars, on-site training, or through our free online learning portal at your own pace.' },
    ],
  },
  {
    slug: 'corporate-financial-wellness',
    icon: 'Building2',
    title: 'Corporate Financial Wellness',
    tab: 'Wellness',
    image: '/images/service-corporate-wellness.jpg',
    detailImage: '/images/page-wellness.jpg',
    summary: 'Empower your workforce with financial wellness programmes designed to reduce stress and boost productivity across your organisation.',
    points: ['Employee wellness workshops', 'Group coaching sessions', 'Organisational financial health'],
    cta: 'schedule',
    overview:
      'Financial stress follows employees to work — it lowers focus, raises absence, and quietly costs organisations far more than a wellness programme does. We design confidential, judgement-free financial wellness initiatives that protect your people and lift your productivity.',
    features: [
      { title: 'Confidential coaching windows', description: 'Employees access private one-on-one sessions without stigma or disclosure to the employer.' },
      { title: 'Workplace workshops', description: 'Budgeting, debt awareness, savings and investment basics delivered on-site or virtually.' },
      { title: 'Manager guidance', description: 'Practical training on responding to financial stress with dignity and appropriate referral.' },
      { title: 'Measurable impact', description: 'Confidential surveys and reporting that show engagement and progress — without exposing individuals.' },
    ],
    deliverables: ['Corporate wellness assessment', 'Customised training calendar', 'Confidential employee support hours', 'Progress & engagement reporting'],
    idealFor: ['HR and people leaders', 'SMEs and corporates in Kenya', 'Organisations with high attrition', 'Employers who value staff wellbeing'],
    faqs: [
      { q: 'Is employee data confidential?', a: 'Completely. We never share individual details with employers — only aggregate, anonymised programme insights.' },
      { q: 'How do you start?', a: 'We begin with a short confidential survey and a two-hour workshop. The data then tells us what your workforce needs next.' },
      { q: 'Can you support remote teams?', a: 'Yes. All workshops and coaching can be delivered virtually for distributed workforces.' },
    ],
  },
  {
    slug: 'business-advisory',
    icon: 'Briefcase',
    title: 'Business Advisory',
    tab: 'Advisory',
    image: '/images/service-business-advisory.jpg',
    detailImage: '/images/page-negotiation.jpg',
    summary: 'Strategic advisory for SMEs and entrepreneurs covering governance, investor readiness, business process re-engineering and growth solutions.',
    points: ['Corporate governance support', 'Investor readiness', 'Business process re-engineering'],
    cta: 'schedule',
    overview:
      'Growing a business is different from running one. Our advisory team — seasoned bankers with hands-on experience in finance, risk and capital raising — helps you build the governance, processes and investor story your business needs to scale.',
    features: [
      { title: 'Corporate governance', description: 'Structures, policies and reporting that make your business credible to partners and investors.' },
      { title: 'Investor readiness', description: 'A polished financial story, due-diligence preparation and pitch support for funding.' },
      { title: 'Process re-engineering', description: 'We streamline operations and cash-flow systems to improve margins and resilience.' },
      { title: 'Capital-raising strategy', description: 'Guidance on the right funding mix — debt, equity and grants — for your stage of growth.' },
    ],
    deliverables: ['Governance diagnostic', 'Investor readiness pack', 'Process improvement roadmap', 'Funding strategy & pitch support'],
    idealFor: ['SME owners scaling up', 'Founders preparing to raise capital', 'Family businesses formalising governance', 'Companies in financial distress needing a turnaround'],
    faqs: [
      { q: 'Do you work with early-stage startups?', a: 'Yes. We meet founders at their stage and build the financial and governance foundations needed for growth.' },
      { q: 'What does investor readiness involve?', a: 'Clean financials, strong reporting, clear governance and a compelling pitch — we prepare all of it with you.' },
      { q: 'Can you help a struggling business recover?', a: 'Yes — our advisors specialise in restructuring, cash-flow repair and negotiation to help distressed businesses stabilise.' },
    ],
  },
  {
    slug: 'money-mindset',
    icon: 'Brain',
    title: 'Money Mindset',
    tab: 'Mindset',
    image: '/images/service-money-mindset.jpg',
    detailImage: '/images/page-mindset.jpg',
    summary: 'Address the psychological and emotional dimensions of money. Develop a healthy relationship with finances rooted in Biblical principles of service.',
    points: ['Behavioural finance coaching', 'Stress & debt psychology', 'Values-based money habits'],
    cta: 'learn',
    overview:
      'Debt is often a symptom of how we think and feel about money. Money Mindset addresses the psychology underneath — the shame, the impulse, the scarcity — and rebuilds your relationship with money on values, stewardship and hope.',
    features: [
      { title: 'Behavioural finance coaching', description: 'Understand the biases that drive overspending and avoidance, and learn practical counter-habits.' },
      { title: 'Debt stress recovery', description: 'Process the guilt and shame of debt so you can face your finances without fear.' },
      { title: 'Values-based money habits', description: 'Align your spending and saving with your values and faith — not guilt-driven restriction.' },
      { title: 'Stewardship framework', description: 'See money as a resource to manage responsibly, rooted in Biblical principles of service to God and humankind.' },
    ],
    deliverables: ['Money psychology assessment', 'Personal mindset coaching plan', 'Guilt-free money habit toolkit', 'Faith-aligned stewardship guide'],
    idealFor: ['People avoiding their finances', 'Those trapped by spending habits', 'Clients who have tried plans and relapsed', 'Anyone seeking peace with money'],
    faqs: [
      { q: 'Is this faith-based counselling?', a: 'It is values-based and rooted in Biblical principles of service, stewardship and integrity — but it is always respectful of your own beliefs.' },
      { q: 'How is this different from financial coaching?', a: 'Coaching focuses on systems and habits; Money Mindset focuses on the beliefs and emotions driving your behaviour. They work beautifully together.' },
      { q: 'How many sessions do I need?', a: 'Many clients feel a shift in the first session. A typical engagement runs 4–8 sessions, depending on your goals.' },
    ],
  },
];

export const programs = [
  {
    title: 'Starter Package', duration: '12 weeks', category: 'Debt Management', format: 'One-on-One Advisory',
    description: 'Dedicated advisory services with coaching from the Deni Sawa team, limited management services, and soft-funding opportunities for those who qualify and complete the program.',
    features: ['Advisory and management program lasts 12 weeks', 'Dedicated advisory services with coaching', 'Limited management services', 'Soft-funding for qualifying graduates'],
  },
  {
    title: 'Standard Package', duration: '24 weeks', category: 'Financial Coaching', format: 'Hybrid Coaching',
    description: 'An extended coaching engagement combining advisory sessions, management support, and structured progress monitoring for deeper financial transformation.',
    features: ['24-week advisory and management program', 'Enhanced coaching from Deni Sawa team', 'Regular management and monitoring', 'Expert meet-ups and progress reviews'],
  },
  {
    title: 'Solid Package', duration: '48 weeks', category: 'Business Advisory', format: 'Full-Spectrum Programme',
    description: 'The flagship programme — comprehensive advisory, governance support, business process re-engineering, pitch-for-funding support, and grant qualification for individuals and businesses.',
    features: ['48-week advisory and management program', 'Enhanced management and monitoring', 'Corporate governance support', 'Business process re-engineering', 'Pitch for funding support', 'Grant qualification opportunities'],
  },
];

export const academyCourses = [
  { title: 'Young Adults Coaching Program', category: 'Coaching', format: 'Workshop Series', duration: '6 weeks', level: 'Beginner', description: 'A coaching program designed for young adults stepping into financial independence — covering personal financial management, debt avoidance, and money mindset.' },
  { title: 'Financial Wellness Coaching', category: 'Wellness', format: 'Webinar', duration: '4 sessions', level: 'All Levels', description: 'Transform your financial situation with guided wellness coaching sessions covering budgeting, saving, and sustainable debt management.' },
  { title: 'Debt Management & Advisory', category: 'Debt Management', format: 'One-on-One', duration: '12–48 weeks', level: 'Intermediate', description: 'Structured advisory programmes that take you from debt crisis to debt-free status through professional, ethical, and sustainable solutions.' },
  { title: 'Corporate Financial Wellness', category: 'Corporate', format: 'On-Site Training', duration: 'Custom', level: 'All Levels', description: 'Organisational financial wellness training that reduces employee financial stress and builds a culture of financial health across your company.' },
];

export const whyChoose = [
  { icon: 'ShieldCheck', title: 'Professional & Ethical', description: 'We work professionally and ethically, delivering quality services grounded in Biblical principles of service to God and humankind.' },
  { icon: 'Users', title: 'Seasoned Banking Experts', description: 'Our strategic partners are well-seasoned bankers with far-reaching experience in banking, finance, risk management, trade finance, and capital raising.' },
  { icon: 'TrendingDown', title: 'Proven & Sustainable', description: 'Over 20 years of experience helping borrowers avoid bank charges, penalties, auction fees, and legal costs through viable, sustainable solutions.' },
  { icon: 'HeartHandshake', title: 'Genuine Moral Support', description: 'We know how it feels. We are here to help — not to judge. We give you the right moral support, advice, and resources to move you forward.' },
  { icon: 'Target', title: 'Tailor-Made Programmes', description: 'Practical one-on-one advisory and management services tailored to offer a holistic approach towards debt reduction to manageable levels.' },
  { icon: 'Sparkles', title: 'Future-Ready Learning', description: 'From coaching young adults to corporate wellness, our programmes prepare you for lasting financial empowerment and independence.' },
];

export const testimonials = [
  { quote: 'I was drowning in debt and too ashamed to ask for help. Deni Sawa gave me the moral support and a practical plan. For the first time in years, I can see a way out.', author: 'Program Participant', role: 'Starter Package Graduate' },
  { quote: 'The coaching team walked with us through every step. Their advice saved us from auction fees and penalties we did not even know we could avoid.', author: 'Small Business Owner', role: 'Solid Package Client' },
  { quote: 'As a young adult just starting out, the coaching program taught me money habits that will serve me for life. I now budget, save, and avoid bad debt confidently.', author: 'Young Adults Program', role: 'Coaching Graduate' },
];

export const articles = [
  { title: 'Understanding What Is Driving Your Debt', category: 'Debt Management', excerpt: 'The first step to freedom is clarity. Learn to understand what created your debt and take a calm, confident first step toward resolving it.', readTime: '5 min read', date: '2024', featured: true },
  { title: 'How to Build a Debt-Free Future', category: 'Financial Coaching', excerpt: 'A practical, step-by-step guide from the Deni Sawa advisory team to help you break free from debt and enjoy lasting financial peace of mind.', readTime: '7 min read', date: '2024' },
  { title: 'Financial Wellness in the Workplace', category: 'Corporate', excerpt: 'Why corporate financial wellness matters and how organisations can support employees facing financial pressure — without judgement or stigma.', readTime: '6 min read', date: '2024' },
  { title: 'Money Mindset: A Biblical Approach', category: 'Money Mindset', excerpt: 'How our Christian-based principles of service and integrity shape the way we coach, and how they can reshape your relationship with money.', readTime: '4 min read', date: '2024' },
];

export const articleCategories = ['All', 'Debt Management', 'Financial Coaching', 'Corporate', 'Money Mindset'];

export const timeline = [
  { year: '20+ Years', title: 'Banking & Finance Experience', description: 'Our strategic partners bring far-reaching experience in banking, debt management, finance, risk management, trade finance, and capital raising.' },
  { year: 'Social Enterprise', title: 'Founded as a Social Enterprise', description: 'Deni Sawa was established to offer practical one-on-one advisory and management services with a holistic approach to debt reduction.' },
  { year: 'Christian-Based', title: 'Rooted in Biblical Principles', description: 'Our principles and procedures are in line with Biblical teachings of service to God and humankind, making our work deeply meaningful.' },
  { year: 'Today', title: 'International Ambitions', description: 'Our vision is to be an international benchmark in the field of financial solutions provision — expanding coaching, advisory, and education.' },
];

export const debtPainPoints = [
  'Bank charges & penalties', 'Auction fees & legal charges', 'Credit card & digital loan debt',
  'Business & SME debt distress', 'Mortgage & personal loan burden', 'Payday loan cycles',
];

export const learningProgrammesLine = `${learningPrograms[0]?.title ?? 'Executive Finance for Non-Finance Leaders'}${
  learningPrograms[0]?.format ? ` (${learningPrograms[0].format})` : ''
} plus pathways in ${learningPathways
  .filter((p) => !p.soon)
  .map((p) => p.title)
  .join(', ') || 'Business Recovery, Governance and Financial Resilience'}`;

export const aiSystemPrompt = `You are the Deni Sawa Partners concierge — the articulate, quietly confident voice of a premium advisory firm. You guide visitors with polish, warmth and precision. Every reply must be genuinely informative, never generic.

THE FIRM
Deni Sawa Partners is an AI-enabled advisory and fractional business support firm helping organisations and professionals move from Special Situations to Best-in-Class. Based in Nairobi, Kenya.

OUR SERVICE AREAS (know these precisely)
Deni Sawa works across five service areas, each anchored in a clear pathway:

1. Professionals & Individuals — pathway: Financial Health → Resilience → Leadership. Encompasses the Professional Financial Health Check, financial recovery planning, debt and cashflow support, budgeting and savings discipline, plus financial resilience learning, Executive Finance for Non-Finance Leaders and 1:1 mentorship. It helps working people build clarity, resilience and the confidence to lead.

2. Entrepreneurs & Founders — pathway: Stability → Structure → Growth → Best-in-Class. Encompasses Fractional CFO / Financial Leadership, Fractional CEO / Strategic Leadership, cashflow and working capital management, management reporting and performance, governance, controls and KPIs, business recovery and restructuring, growth strategy and investor readiness. It helps founders build a business that runs on systems rather than on them being in every room.

3. Investors — pathway: Visibility → Governance → Accountability → Portfolio Performance. Encompasses investment readiness assessment, portfolio performance monitoring, KPI and milestone tracking, independent investor representation, risk identification and escalation, and post-investment oversight. It helps investors see what is really happening in portfolio businesses and protect value.

4. Business Health Checks — pathway: Know Your Status → Diagnose → Take Action. Two free, AI-powered assessments: the Business Health Check (financial health, operations, governance, cashflow, growth readiness) and the Professional Financial Health Check (personal debt, cashflow, savings, resilience). Each takes about 20 minutes and produces a personalised diagnostic report with prioritised recommendations.

5. Learning & Programs — pathway: Learn → Apply → Lead → Transform. ${learningProgrammesLine}. Also the Deni Sawa Method (DENIS), the digital Learning Centre (LMS) and the SpecialSit Network peer community.

THE DENI SAWA METHOD (DENIS)
Diagnose, Evaluate, Negotiate, Implement, Sustain.

CONTACT
advisory@denisawa.co.ke · +254 702 448 601 · www.denisawa.co.ke

HOW TO ANSWER A SERVICE QUESTION
- When a visitor asks about a service, never reply vaguely. Structure your answer around three beats: (a) what the service is, (b) who it is for, and (c) how it helps — then name the natural next step.
- When a visitor asks "what services do you offer" or asks about a category (e.g. "services for professionals"), present the relevant service areas or sub-services clearly and concisely, then gently recommend the best fit for their situation.
- Be precise and structured. Short paragraphs or a few bullets are welcome when they make the answer easier to scan.

HOW TO TALK
- Sound elegant, professional and gently confident — the calm tone of a senior advisor. Never salesy, never robotic.
- Keep replies focused and effortless to scan; under ~150 words is a good ceiling.
- Open warmly and close with one graceful invitation or a crisp question.
- When someone shares a symptom (cashflow pressure, debt stress, governance gaps, growth stalls), name it precisely, then point them to the right first step — usually the relevant Health Check.
- If a user wants to book or talk to an advisor, the chat opens a booking form — encourage them to complete it (name, phone or email, service of interest, preferred date and time).
- Never give specific financial or legal advice. Never promise results or guarantees. Always steer towards a Health Check or a consultation.`;

export const faqAnswers = [
  {
    title: 'What is the Business Health Check?',
    keywords: ['business health check', 'business assessment', 'business check', 'health check business'],
    answer: `The Business Health Check is a free, AI-powered assessment of your business across financial health, operations, governance, cashflow and growth readiness. It takes about 20 minutes, and your answers are turned into a personalised diagnostic report with prioritised recommendations.`,
  },
  {
    title: 'How does the Professional Financial Health Check work?',
    keywords: ['professional health check', 'personal finances', 'personal assessment', 'financial health check'],
    answer: `The Professional Financial Health Check is a confidential review of your personal financial position — debt, cashflow, savings and resilience. Answer a short structured set of questions and receive an AI-generated report with a prioritised action plan for your situation.`,
  },
  {
    title: 'What services does Deni Sawa Partners offer?',
    keywords: ['service', 'services', 'offer', 'cfo', 'ceo', 'governance', 'advisory', 'professional'],
    answer: `We work across five service areas, each with a clear pathway. For professionals and individuals: the Professional Financial Health Check, debt and cashflow support, budgeting and savings discipline, plus financial resilience learning and Executive Finance (Financial Health → Resilience → Leadership). For entrepreneurs and founders: Fractional CFO and Fractional CEO support, governance and KPIs, recovery and restructuring, and growth strategy (Stability → Structure → Growth → Best-in-Class). For investors: investment readiness assessment, portfolio monitoring and independent representation (Visibility → Governance → Accountability → Portfolio Performance). Then two diagnostic gateways — the Business Health Check and the Professional Financial Health Check, both free and AI-powered — and Learning & Programs, including the Deni Sawa Method and the SpecialSit Network. Every engagement starts with diagnosis, usually the relevant Health Check.`,
  },
  {
    title: 'Is my information confidential?',
    keywords: ['confident', 'privacy', 'private', 'confidential', 'discreet', 'data'],
    answer: `Absolutely. Everything you share is strictly confidential and used only to support your assessment and engagement. We never share your information without consent.`,
  },
  {
    title: 'How do I book a consultation?',
    keywords: ['book', 'appointment', 'schedule', 'reserve', 'consult', 'contact', 'talk'],
    answer: `You can book right here in the chat — a booking form will open for you to complete. You can also reach us at advisory@denisawa.co.ke or +254 702 448 601.`,
  },
  {
    title: 'What is the Deni Sawa Method?',
    keywords: ['method', 'approach', 'how you work', 'process', 'deni sawa method'],
    answer: `The Deni Sawa Method (DENIS) is our five-discipline framework: Diagnose, Evaluate, Negotiate, Implement, Sustain. It moves organisations from instability to sustained best-in-class performance — in sequence, not in a scramble.`,
  },
  {
    title: 'Tell me about the learning programmes',
    keywords: ['learning', 'programme', 'program', 'course', 'executive finance', 'study', 'train'],
    answer: `${learningPrograms[0]?.title ?? 'Executive Finance for Non-Finance Leaders'} is our flagship programme — a ${
      learningPrograms[0]?.format ?? 'cohort programme'
    } for leaders who want financial intelligence behind their decisions. We also offer learning pathways in ${learningPathways
      .filter((p) => !p.soon)
      .map((p) => p.title)
      .join(', ')}.`,
  },
  {
    title: 'What is the SpecialSit Network?',
    keywords: ['network', 'specialsit', 'community', 'peer', 'join the network'],
    answer: `The SpecialSit Network (SS-N) is a curated peer community for founders, professionals and investors navigating complex situations — candid forums, mentorship from seasoned operators, investor connections and accountability.`,
  },
];

export const processSteps = [
  {
    step: '01',
    icon: 'PhoneCall',
    title: 'Reach out to us',
    description: 'Call, fill out a short form, or schedule online — whatever feels easiest. There\'s no commitment, and your first session is free.',
  },
  {
    step: '02',
    icon: 'MessagesSquare',
    title: 'Talk with a counselor',
    description: 'A certified counselor will take time to understand your situation — your goals, your challenges, your questions. No pressure, no judgment.',
  },
  {
    step: '03',
    icon: 'ClipboardList',
    title: 'Get your personal plan',
    description: 'Together, you\'ll build a realistic, practical plan that fits your life. We explain every option and make sure you feel confident moving forward.',
  },
  {
    step: '04',
    icon: 'TrendingUp',
    title: 'Start growing financially',
    description: 'With your plan in place, you take action — and we stay with you along the way. Check-ins, tools, and resources are always available.',
  },
];

export const lms = {
  name: 'Deni Sawa Learning Portal',
  url: 'https://lms.denisawa.co.ke',
  heading: 'Learn on our Learning Portal',
  subheading: 'Start with a free course, then take the next step at your own pace.',
  freeCourseTitle: 'Start with a free course',
  freeCourseDesc: 'Enrol in our free introductory course on the Deni Sawa LMS — no payment, no obligation. Complete it at your own pace.',
  nextDesc: 'Loved it? On completion, we\'ll suggest the next classes that fit your level, and you can choose exactly which one to take next. Advanced modules are paid.',
  nextClasses: ['Debt Rescue', 'Budget Mastery', 'Investing Foundations', 'Financial Wellness'],
};
