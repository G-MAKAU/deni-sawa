import { NextRequest } from 'next/server';
import { faqAnswers } from '@/data/content';

interface ChatRequest {
  message?: string;
  systemPrompt?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

const DEFAULT_SYSTEM_PROMPT = `You are the Deni Sawa AI assistant. Deni Sawa is a Social Enterprise in Kenya offering practical one-on-one advisory and management services for debt reduction and financial freedom.

Key info:
- Services: Debt Management, Financial Coaching, Financial Literacy, Corporate Financial Wellness, Business Advisory, Money Mindset
- Programs: Starter (12 weeks), Standard (24 weeks), Solid (48 weeks)
- Contact: advisory@denisawa.co.ke, +254 702 448 601
- Strategic partners are seasoned bankers with experience in banking, debt management, finance, risk management, trade finance, capital raising
- We are Christian-based, with principles aligned with Biblical teachings of service
- First consultation is free; pricing is transparent and shared during the consultation
- All client information is strictly confidential and never shared without consent
- When a user wants to book a consultation, a booking form opens in the chat — encourage them to fill it in and confirm their details

Be warm, professional, and encouraging. Keep responses concise (under 150 words). For personal financial advice, encourage booking a consultation. Never give specific financial advice.`;

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

  if (lower.includes('debt') && (lower.includes('manage') || lower.includes('help') || lower.includes('free'))) {
    return 'Our Debt Management Service offers professional one-on-one advisory with structured repayment plans and creditor negotiation support. We offer three programmes: Starter (12 weeks), Standard (24 weeks), and Solid (48 weeks). Would you like to book a consultation?';
  }
  if (lower.includes('program') || lower.includes('package') || lower.includes('offer')) {
    return 'We offer three programmes:\n\n\u2022 Starter Package (12 weeks) \u2014 advisory services with coaching\n\u2022 Standard Package (24 weeks) \u2014 enhanced coaching and monitoring\n\u2022 Solid Package (48 weeks) \u2014 full-spectrum advisory including governance and funding support\n\nEach is tailored to your needs. Would you like to book a consultation?';
  }
  if (lower.includes('book') || lower.includes('consult') || lower.includes('contact')) {
    return 'You can book a consultation by emailing advisory@denisawa.co.ke or calling +254 702 448 601, or through the contact form on this page.';
  }
  if (lower.includes('coach') || lower.includes('financial')) {
    return 'Our Financial Coaching covers personal money management, budgeting, saving habits, and accountability. We also offer Financial Literacy education and Money Mindset coaching rooted in Biblical principles.';
  }
  if (lower.includes('corporate') || lower.includes('business') || lower.includes('company')) {
    return 'Our Corporate Financial Wellness programmes empower your workforce with financial education. We also offer Business Advisory for SMEs covering governance, investor readiness, and process re-engineering.';
  }
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return 'Hello! Welcome to Deni Sawa. I can help you learn about our debt management services, financial coaching programmes, and corporate wellness offerings. What would you like to know?';
  }
  return 'Thank you for your question. Reach us at advisory@denisawa.co.ke or +254 702 448 601, or book a consultation through the contact form. Would you like to know about our services or programmes?';
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
