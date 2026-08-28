import { NextRequest } from 'next/server';
import { faqAnswers } from '@/data/content';
import { learningPrograms, learningPathways } from '@/data/site';
import { getSetting } from '@/lib/settings';

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

const DEFAULT_SYSTEM_PROMPT = `You are the Deni Sawa Partners concierge — concise, precise, and direct. Answer ONLY the question asked. Never dump unrelated service areas or company背景 into an answer.

CRITICAL RULES — VIOLATION = FAILURE
- Maximum 3 sentences or 60 words per reply. Pick the shorter limit.
- If someone asks "What is a Fractional CFO?", answer THAT — do not list all service areas.
- If someone asks about one service, answer about THAT service only.
- Never open with "Thank you for your question" or "Great question." Just answer.
- Never list all five service areas unless the user explicitly asks "what services do you offer?"
- Close with one short follow-up question or next step, not both.

THE FIRM
Deni Sawa Partners is an AI-enabled advisory and fractional business support firm in Nairobi, Kenya. We help organisations and professionals move from Special Situations to Best-in-Class.

OUR SERVICES (reference only — do NOT dump this list unless asked)
1. Professionals & Individuals — Financial Health → Resilience → Leadership. Professional Financial Health Check, debt/cashflow support, budgeting, Executive Finance.
2. Entrepreneurs & Founders — Stability → Structure → Growth → Best-in-Class. Fractional CFO/CEO, governance, KPIs, recovery, growth strategy.
3. Investors — Visibility → Governance → Accountability → Portfolio Performance. Investment readiness, portfolio monitoring, representation.
4. Business Health Checks — Free, AI-powered: Business Health Check and Professional Financial Health Check. ~20 min each.
5. Learning & Programs — Executive Finance, Deni Sawa Method (DENIS), SpecialSit Network.

KEY DEFINITIONS (answer questions about these directly)
- Fractional CFO: Senior financial leadership on a part-time basis — cashflow discipline, budgeting, reporting, financial visibility — without a full-time hire cost.
- Fractional CEO: Strategic leadership on a part-time basis for founders who need execution support.
- Business Health Check: Free, AI-powered diagnostic covering financial health, operations, governance, cashflow, growth readiness. ~20 minutes. Produces a personalised report.
- Professional Financial Health Check: Free, AI-powered review of personal debt, cashflow, savings, resilience. ~20 minutes.

HOW TO ANSWER
- Direct answer first. No preamble.
- Use 1-3 short sentences max.
- If a symptom is mentioned (debt stress, cashflow pressure), name it and point to the relevant Health Check as the next step.
- Never give specific financial or legal advice. Never promise results.

TONE
- Calm, professional, quietly confident. Never salesy, never robotic.
- Sound like a senior advisor, not a brochure.`;

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
  if (lower.includes('founder') || lower.includes('entrepreneur') || lower.includes('my business') || lower.includes('business support')) {
    return 'For founders, our pathway runs Stability → Structure → Growth → Best-in-Class. We begin with the Business Health Check to diagnose what is actually happening, then build from there: Fractional CFO and Fractional CEO support, governance and KPIs, recovery or growth strategy. Would you like to start with the Business Health Check?';
  }
  if (lower.includes('investor')) {
    return 'For investors, our pathway is Visibility → Governance → Accountability → Portfolio Performance. We support you through investment readiness assessment before you commit capital, then independent portfolio monitoring — KPI and milestone tracking, financial and cashflow oversight, and governance accountability — plus investor representation and early risk escalation when something needs attention. In short, we make sure you always see what is really happening in your investments and can act before problems compound. Would you like to discuss a particular portfolio situation?';
  }
  if (lower.includes('health check') || lower.includes('assessment') || lower.includes('diagnostic')) {
    return 'Our Health Checks are the natural first step. The Business Health Check covers financial health, operations, governance, cashflow and growth readiness — while the Professional Financial Health Check reviews personal debt, cashflow, savings and resilience. Both are free, take about 20 minutes, and end with a personalised AI diagnostic report with prioritised recommendations. Shall I open one for you?';
  }
  if (lower.includes('cfo') || lower.includes('financial leadership') || lower.includes('finance function')) {
    return 'A Fractional CFO brings senior financial leadership on a part-time basis — cashflow discipline, budgeting, management reporting and financial visibility — without the cost of a full-time hire. Would you like to explore how that fits your business?';
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

    const [dbGeminiKey, dbOpenaiKey, dbGeminiModel] = await Promise.all([
      getSetting('GEMINI_API_KEY'),
      getSetting('OPENAI_API_KEY'),
      getSetting('GEMINI_MODEL'),
    ]);
    const apiKey = dbGeminiKey || dbOpenaiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const model = dbGeminiModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
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
