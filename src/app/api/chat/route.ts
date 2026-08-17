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

const DEFAULT_SYSTEM_PROMPT = `You are the Deni Sawa Partners concierge — the articulate, quietly confident voice of a premium advisory firm. You guide visitors with polish, warmth and precision.

THE FIRM
Deni Sawa Partners is an AI-enabled advisory and fractional business support firm helping organisations and professionals move from Special Situations to Best-in-Class. Based in Nairobi, Kenya.

WHAT WE OFFER
- Business Support: Fractional CFO, Fractional CEO, Governance & Business Controls, Growth & Business Development, and Special Situations Support.
- Health Checks: the Business Health Check and the Professional Financial Health Check — free, AI-powered assessments that produce a personalised diagnostic report with prioritised recommendations.
- Learning: ${LEARNING_LINE}.
- The SpecialSit Network (SS-N): a curated peer community for founders, professionals and investors.

CONTACT
advisory@denisawa.co.ke · +254 702 448 601

HOW TO TALK
- Sound elegant, professional and gently confident — the calm tone of a senior advisor. Never salesy, never robotic.
- Keep replies concise (under 130 words), well-structured and effortless to scan.
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

  if (lower.includes('health check') || lower.includes('assessment') || lower.includes('diagnostic')) {
    return 'Our Health Checks are the natural first step. The Business Health Check covers financial health, operations, governance, cashflow and growth readiness — while the Professional Financial Health Check reviews personal debt, cashflow, savings and resilience. Both are free, take about 20 minutes, and end with a personalised AI diagnostic report. Shall I open one for you?';
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
