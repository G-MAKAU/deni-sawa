import { NextRequest } from 'next/server';
import { faqAnswers } from '@/data/content';
import { generateChatReply } from '@/lib/report-generator';

interface ChatRequest {
  message?: string;
  systemPrompt?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

const DEFAULT_SYSTEM_PROMPT = `You are a senior advisor at Deni Sawa Partners, a premium financial advisory firm in Nairobi, Kenya. You answer any question about finance, business, debt, investing, cashflow, governance, leadership — or any related topic — with clarity and precision. Then, if relevant, you relate it to how Deni Sawa can help.

ANSWERING RULES
1. ANSWER THE QUESTION FIRST. Give a clear, concise, accurate answer to whatever was asked. This is your primary job.
2. RELATE TO THE FIRM. After answering, mention the specific Deni Sawa service that connects to the topic — only if it genuinely fits. Do not force it.
3. Be concise: 2-4 sentences maximum. Shorter is better.
4. Never open with filler ("Great question", "Thank you for asking"). Just answer.
5. Never dump the full list of services. Reference ONE relevant service maximum.
6. Never give specific financial or legal advice. Never promise results.
7. Sound like a calm, experienced advisor — not a brochure, not a chatbot.

WHO WE ARE
Deni Sawa Partners helps organisations and professionals move from Special Situations to Best-in-Class. Based in Nairobi, Kenya.

OUR SERVICES (use as reference, never dump the full list)
- Professional Financial Health Check: Free, AI-powered review of personal debt, cashflow, savings, resilience. ~20 min. → For professionals/individuals with personal finance concerns.
- Business Health Check: Free, AI-powered diagnostic of financial health, operations, governance, cashflow, growth readiness. ~20 min. → For business owners/founders.
- Fractional CFO: Part-time senior financial leadership — cashflow, budgeting, reporting, visibility. → For businesses outgrowing reactive finance.
- Fractional CEO: Part-time strategic leadership — execution, governance, performance. → For founders needing senior leadership.
- Debt & Cashflow Recovery: Structured debt management, repayment planning, cashflow stabilisation. → For anyone in financial distress.
- Executive Finance Programme: Financial intelligence for non-finance leaders. → For professionals building leadership capability.
- Governance & Controls: KPI frameworks, risk controls, audit readiness. → For businesses needing investor-grade credibility.
- Investment Readiness & Portfolio Monitoring: Pre-investment assessment, post-investment oversight. → For investors.
- Deni Sawa Method (DENIS): Diagnose, Evaluate, Negotiate, Implement, Sustain.
- SpecialSit Network: Peer community for founders, professionals, investors navigating complex situations.

HOW TO RELATE TO SERVICES
- If someone mentions debt → mention the Professional Financial Health Check as the diagnostic starting point.
- If someone mentions business problems → mention the Business Health Check.
- If someone mentions cashflow, budgeting, reporting → mention Fractional CFO.
- If someone mentions governance, controls, investor readiness → mention Governance or Investor services.
- If someone asks what something IS (e.g. "what is debt management") → answer the definition clearly, then mention the relevant service.
- If someone is just greeting or making small talk → respond warmly and ask how you can help.
- If unsure which service fits → ask a short clarifying question instead of guessing.

TONE
Calm, professional, quietly confident. Like a senior advisor who has seen it all and knows exactly what to do next.`;

const FAQ_CONTEXT = `\n\nFrequently asked questions (answer these with the exact details below when asked):\n${faqAnswers
  .map((f) => `Q: ${f.title}\nA: ${f.answer}`)
  .join('\n\n')}`;

function fallbackReply(message: string): string {
  const lower = (message || '').toLowerCase();
  if (!message) return 'Welcome to Deni Sawa Partners. How can I help you today?';
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Welcome to Deni Sawa Partners. How can I help you today?';
  }
  if (lower.includes('book') || lower.includes('consult') || lower.includes('contact')) {
    return 'You can book a consultation right here in the chat, or reach us at advisory@denisawa.co.ke or +254 702 448 601.';
  }
  return 'I can help with that. For a detailed conversation, you can reach us at advisory@denisawa.co.ke or +254 702 448 601. What would you like to know?';
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const message = (body.message || '').trim();

    if (!message) {
      return Response.json({ reply: fallbackReply('') }, { status: 200 });
    }

    const system = `${body.systemPrompt || DEFAULT_SYSTEM_PROMPT}${FAQ_CONTEXT}`;
    const history = (body.history || []).filter(
      (h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string'
    );

    const reply = await generateChatReply(system, history, message, 1000);

    if (reply) return Response.json({ reply }, { status: 200 });

    return Response.json({ reply: 'I was unable to process that just now. Please try again, or reach us at advisory@denisawa.co.ke or +254 702 448 601.', retry: true }, { status: 200 });
  } catch (err) {
    console.error('Chat route error:', err);
    return Response.json(
      { reply: 'Something went wrong. Please try again, or reach us at advisory@denisawa.co.ke or +254 702 448 601.', retry: true },
      { status: 200 }
    );
  }
}
