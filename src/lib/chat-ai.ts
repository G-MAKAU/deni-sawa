import { getSetting } from '@/lib/settings';

type ProviderType = 'anthropic' | 'google' | 'openai';

interface ProviderConfig {
  type: ProviderType;
  baseUrl?: string;
  apiKey: string;
  model: string;
  label: string;
}

async function resolveChatProvider(): Promise<ProviderConfig> {
  const s = await getSetting('AI_PROVIDER_TYPE');
  const apiKey = await getSetting('AI_API_KEY');
  const baseUrl = await getSetting('AI_BASE_URL');
  const model = await getSetting('AI_MODEL');

  if (s && apiKey) {
    const type = s as ProviderType;
    return {
      type,
      baseUrl: baseUrl ?? (type === 'google' ? 'https://generativelanguage.googleapis.com/v1beta' : 'https://api.openai.com/v1'),
      apiKey,
      model: model || (type === 'google' ? 'gemini-flash-latest' : type === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini'),
      label: `AI · ${model || type}`,
    };
  }

  const geminiKey = await getSetting('GEMINI_API_KEY');
  if (geminiKey) {
    return {
      type: 'google',
      apiKey: geminiKey,
      model: (await getSetting('GEMINI_MODEL')) || 'gemini-flash-latest',
      label: 'Gemini',
    };
  }

  const openaiKey = await getSetting('OPENAI_API_KEY');
  if (openaiKey) {
    return {
      type: 'openai',
      apiKey: openaiKey,
      model: (await getSetting('OPENAI_MODEL')) || 'gpt-4o-mini',
      label: 'OpenAI',
    };
  }

  const anthropicKey = await getSetting('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    return {
      type: 'anthropic',
      apiKey: anthropicKey,
      model: (await getSetting('ANTHROPIC_MODEL')) || 'claude-sonnet-4-5',
      label: 'Claude',
    };
  }

  throw new Error('No AI provider configured');
}

async function callChatAI(
  config: ProviderConfig,
  system: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  message: string,
  maxTokens: number
): Promise<string> {
  if (config.type === 'anthropic') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: config.apiKey });
    const messages = history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content }));
    messages.push({ role: 'user', content: message });
    const res = await anthropic.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      system,
      messages,
    });
    return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  }

  if (config.type === 'google') {
    const contents = history.map((h) => ({
      role: h.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: h.content }],
    }));
    contents.push({ role: 'user' as const, parts: [{ text: message }] });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text || '').join('').trim();
  }

  // OpenAI-compatible
  const baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [{ role: 'system', content: system }];
  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: 'user', content: message });
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Provider request failed (${res.status})`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

export async function generateChatReply(
  system: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  message: string,
  maxTokens = 1000
): Promise<string> {
  const config = await resolveChatProvider();
  try {
    return await callChatAI(config, system, history, message, maxTokens);
  } catch (err) {
    console.warn(`Chat AI failed (${config.label}), retrying...`, err);
    // Try same provider once more before giving up
    return await callChatAI(config, system, history, message, maxTokens);
  }
}
