import { NextRequest } from 'next/server';
import { faqAnswers } from '@/data/content';
import { learningPrograms, learningPathways } from '@/data/site';

interface ChatRequest {
  message?: string;
  systemPrompt?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

const LEARNING_LINE = `${learningPrograms[0]?.title ?? 'Executive Finance for Non-Finance Leaders'}${
  learningPrograms[0]?.format ? ` (${learningPrograms[0].format})` : ''
} plus pathways in ${learningPathways
  .filter((p) => !p.soon)
  .map((p) => p.title)
  .join(', ') || 'Business Recovery, Governance and Financial Resilience'}`;

const DEFAULT_SYSTEM_PROMPT = `You are the Deni Sawa Partners concierge — the articulate, quietly confident voice of a premium advisory firm. You guide visitors with polish, warmth and precision. Every reply must be genuinely informative, never generic.

THE FIRM
Deni Sawa Partners is an AI-enabled advisory and fractional business support firm helping organisations and professionals move from Special Situations to Best-in-Class. Based in Nairobi, Kenya.

OUR SERVICE AREAS (know these precisely)
Deni Sawa works across five service areas, each anchored in a clear pathway:

1. Professionals & Individuals — pathway: Financial Health → Resilience → Leadership. Encompasses the Professional Financial Health Check, financial recovery planning, debt and cashflow support, budgeting and savings discipline, plus financial resilience learning, Executive Finance for Non-Finance Leaders and 1:1 mentorship. It helps working people build clarity, resilience and the confidence to lead.

2. Entrepreneurs & Founders — pathway: Stability → Structure → Growth → Best-in-Class. Encompasses Fractional CFO / Financial Leadership, Fractional CEO / Strategic Leadership, cashflow and working capital management, management reporting and performance, governance, controls and KPIs, business recovery and restructuring, growth strategy and investor readiness. It helps founders build a business that runs on systems rather than on them being in every room.

3. Investors — pathway: Visibility → Governance → Accountability → Portfolio Performance. Encompasses investment readiness assessment, portfolio performance monitoring, KPI and milestone tracking, independent investor representation, risk identification and escalation, and post-investment oversight. It helps investors see what is really happening in portfolio businesses and protect value.

4. Business Health Checks — pathway: Know Your Status → Diagnose → Take Action. Two free, AI-powered assessments: the Business Health Check (financial health, operations, governance, cashflow, growth readiness) and the Professional Financial Health Check (personal debt, cashflow, savings, resilience). Each takes about 20 minutes and produces a personalised diagnostic report with prioritised recommendations.

5. Learning & Programs — pathway: Learn → Apply → Lead → Transform. ${LEARNING_LINE}. Also the Deni Sawa Method (DENIS), the digital Learning Centre (LMS) and the SpecialSit Network peer community.

THE DENI SAWA METHOD (DENIS)
Diagnose, Evaluate, Negotiate, Implement, Sustain.

CONTACT
advisory@denisawa.co.ke · +254 702 448 601

HOW TO ANSWER A SERVICE QUESTION
- When a visitor asks about a service, never reply vaguely. Structure your answer around three beats: (a) what the service is, (b) who it is for, and (c) how it helps — then name the natural next step.
- When a visitor asks "what services do you offer" or asks about a category (e.g. "services for professionals"), present the relevant service areas or sub-services clearly and concisely, then gently recommend the best fit for their situation.
- Be precise and structured. Short paragraphs or a few bullets are welcome when they make the answer easier to scan.

HOW TO TALK
- Sound elegant, professional and gently confident — the calm tone of a senior advisor. Never salesy, never robotic.
- Keep replies focused and effortless to scan; under ~150 words is a good ceiling.
- Open warmly and close with one graceful invitation or a crisp question.
- When someone shares a symptom (cashflow pressure, debt stress, governance gaps, growth stalls), name it precisely and point them to the right first step — usually the relevant Health Check.
- When a user wants to book or talk, the chat opens a booking form — encourage them to complete it.
- Never give specific financial or legal advice. Never promise results. Always steer towards a Health Check or a consultation.`;

function faqReply(message: string): string | null {
  const lower = message.toLowerCase();
  let best: { answer: string; hits: number } | null = null;
  for (const entry of faqAnswers) {
    const hits = entry.keywords.filter((k) => lower.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { answer: entry.answer, hits };
  }
  return best ? best.answer : null;
}

const FAQ_CONTEXT = `\n\nFrequently asked questions (answer these with the exact details below when asked):\n${faqAnswers
  .map((f) => `Q: ${f.title}\nA: ${f.answer}`)
  .join('\n\n')}`;

function fallbackReply(message: string): string {
  const lower = (message || '').toLowerCase();

  if (lower.includes('what service') || lower.includes('what do you offer') || lower.includes('list your service') || lower.includes('services do you have') || lower.includes('all services')) {
    return 'We work across five service areas, each with a clear pathway:\n\n1. Professionals & Individuals — Financial Health → Resilience → Leadership. The Professional Financial Health Check, debt and cashflow support, budgeting and savings discipline, plus financial resilience learning and Executive Finance.\n2. Entrepreneurs & Founders — Stability → Structure → Growth → Best-in-Class. Fractional CFO and Fractional CEO support, governance and KPIs, recovery and restructuring, growth strategy and investor readiness.\n3. Investors — Visibility → Governance → Accountability → Portfolio Performance. Investment readiness assessment, portfolio monitoring, independent representation and risk escalation.\n4. Business Health Checks — Know Your Status → Diagnose → Take Action. Two free, AI-powered assessments that end in a personalised diagnostic report.\n5. Learning & Programs — Learn → Apply → Lead → Transform, including the Deni Sawa Method and the SpecialSit Network.\n\nWhich of these is closest to your situation? I can point you to the right first step.';
  }
  if (lower.includes('professional') || lower.includes('individual') || lower.includes('personal finance') || lower.includes('my finances') || lower.includes('my debt')) {
    return 'For professionals and individuals we follow a deliberate pathway — Financial Health, then Resilience, then Leadership. We start with the Professional Financial Health Check: a free, AI-powered review of your income, expenses, debt, savings and the patterns behind them. From that report we plan your recovery — debt and cashflow support, budgeting and savings discipline — and then build your financial and leadership capability through Executive Finance for Non-Finance Leaders and 1:1 mentorship. It helps you move from financial pressure to clear-headed, confident decisions. Shall I open the Professional Financial Health Check for you?';
  }
  if (lower.includes('founder') || lower.includes('entrepreneur') || lower.includes('my business') || lower.includes('business support') || lower.includes('fractional')) {
    return 'For founders, our pathway runs Stability → Structure → Growth → Best-in-Class. We begin with the Business Health Check to diagnose what is actually happening, then build from there: Fractional CFO and Fractional CEO support for finance and execution, governance, controls and KPIs so the business runs on systems rather than on you, and recovery or growth strategy when it is needed. The aim is a business that is disciplined, investable and no longer founder-dependent. Would you like to start with the Business Health Check?';
  }
  if (lower.includes('investor')) {
    return 'For investors, our pathway is Visibility → Governance → Accountability → Portfolio Performance. We support you through investment readiness assessment before you commit capital, then independent portfolio monitoring — KPI and milestone tracking, financial and cashflow oversight, and governance accountability — plus investor representation and early risk escalation when something needs attention. In short, we make sure you always see what is really happening in your investments and can act before problems compound. Would you like to discuss a particular portfolio situation?';
  }
  if (lower.includes('health check') || lower.includes('assessment') || lower.includes('diagnostic')) {
    return 'Our Health Checks are the natural first step. The Business Health Check covers financial health, operations, governance, cashflow and growth readiness — while the Professional Financial Health Check reviews personal debt, cashflow, savings and resilience. Both are free, take about 20 minutes, and end with a personalised AI diagnostic report with prioritised recommendations. Shall I open one for you?';
  }
  if (lower.includes('cfo') || lower.includes('financial leadership') || lower.includes('finance function')) {
    return 'A Fractional CFO brings senior financial leadership on a part-time basis — financial visibility, cashflow discipline, budgeting and decision-grade reporting, without the cost of a full-time hire. It is ideal for businesses that have outgrown reactive finance.';
  }
  if (lower.includes('governance') || lower.includes('controls') || lower.includes('board')) {
    return 'Our Governance & Business Controls work builds the structures, policies and accountability systems that make a business credible to investors, banks and partners — including KPI frameworks, risk controls and audit readiness.';
  }
  if (lower.includes('special situation') || lower.includes('distress') || lower.includes('turnaround') || lower.includes('restructure')) {
    return 'Special Situations Support is what we do best — financial distress, debt pressure and cashflow crisis, handled with bankers-grade discipline. We stabilise first, then rebuild. It is often the difference between a rescue and a result.';
  }
  if (lower.includes('learning') || lower.includes('executive finance') || lower.includes('programme') || lower.includes('program')) {
    return `${learningPrograms[0]?.title ?? 'Executive Finance for Non-Finance Leaders'} is our flagship programme — a ${
      learningPrograms[0]?.format ?? 'cohort programme'
    } for leaders who want financial intelligence behind their decisions. We also offer learning pathways in ${learningPathways
      .filter((p) => !p.soon)
      .map((p) => p.title)
      .join(', ')}.`;
  }
  if (lower.includes('network') || lower.includes('specialsit') || lower.includes('community')) {
    return 'The SpecialSit Network (SS-N) is a curated peer community for founders, professionals and investors navigating complex situations — candid forums, mentorship from seasoned operators, investor connections and real accountability.';
  }
  if (lower.includes('book') || lower.includes('consult') || lower.includes('contact') || lower.includes('talk')) {
    return 'I would be delighted to arrange that. A booking form is opening for you — complete your name, a phone number or email, and the service you are interested in, and our team will reach out to confirm. Or call us directly at +254 702 448 601.';
  }
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return 'Welcome to Deni Sawa Partners. I can guide you through our Business Support services, Health Checks, Learning programmes and the SpecialSit Network — or simply help you find the right first step. What would you like to explore?';
  }
  return 'Thank you for reaching out. Whether it is a Business Health Check, fractional support or a Special Situations conversation, we would be glad to help. Reach us at advisory@denisawa.co.ke or +254 702 448 601, or tell me a little more about what you are facing.';
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const message = (body.message || '').trim();

    if (!message) {
      return Response.json({ reply: fallbackReply('') }, { status: 200 });
    }

    // Answer common questions with exact, professional facts before calling the LLM
    const faq = faqReply(message);
    if (faq) {
      return Response.json({ reply: faq }, { status: 200 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return Response.json({ reply: fallbackReply(message) }, { status: 200 });
    }

    const system = `${body.systemPrompt || DEFAULT_SYSTEM_PROMPT}${FAQ_CONTEXT}`;

    // Build Gemini contents: history as user/model turns, then the new user message
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const h of body.history || []) {
      if (h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') {
        contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
        }),
      }
    );

    if (!geminiRes.ok) {
      // Invalid key or model — fall back to rule-based replies so the chat still works
      return Response.json({ reply: fallbackReply(message) }, { status: 200 });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('')
      .trim();

    if (!text) {
      return Response.json({ reply: fallbackReply(message) }, { status: 200 });
    }

    return Response.json({ reply: text }, { status: 200 });
  } catch {
    return Response.json(
      { reply: 'Sorry, I hit a snag. Please reach us directly at advisory@denisawa.co.ke or +254 702 448 601.' },
      { status: 200 }
    );
  }
}
