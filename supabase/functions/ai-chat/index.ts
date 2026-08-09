import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  systemPrompt?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

const DEFAULT_SYSTEM_PROMPT = `You are the Deni Sawa AI assistant. Deni Sawa is a Social Enterprise in Kenya that offers practical one-on-one advisory and management services for debt reduction and financial freedom.

Key information:
- Services: Debt Management, Financial Coaching, Financial Literacy, Corporate Financial Wellness, Business Advisory, Money Mindset
- Programs: Starter (12 weeks), Standard (24 weeks), Solid (48 weeks)
- Contact: advisory@denisawa.co.ke, +254 702 448 601
- Vision: To be an international benchmark in the field of financial solutions provision
- Mission: To work professionally and ethically, delivering quality services for the provision of viable, successful and sustainable financial solutions
- We are Christian-based, with principles in line with Biblical teachings of service to God and humankind
- Strategic partners: well-seasoned bankers with experience in banking, debt management, finance, management, risk management, trade finance, capital raising

Be warm, professional, and encouraging. Keep responses concise (under 150 words). If someone needs detailed personal advice, encourage them to book a consultation. Never give specific financial advice — always recommend speaking with our advisors for personalised guidance.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { message, systemPrompt, history } = (await req.json()) as ChatRequest;

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;

    // Build conversation context
    const conversationHistory = (history || []).filter(
      (h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string"
    );
    const messages = [
      { role: "system", content: prompt },
      ...conversationHistory.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    // Check for OpenAI API key
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    let reply: string;

    if (openaiKey) {
      // Use OpenAI API
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 250,
          temperature: 0.7,
        }),
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        reply = openaiData.choices?.[0]?.message?.content || "I apologize, I couldn't generate a response. Please try again.";
      } else if (openaiResponse.status === 401 || openaiResponse.status === 403) {
        // Invalid or revoked API key — fall back to rule-based replies so the chat keeps working
        reply = generateFallbackResponse(message);
      } else {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }
    } else {
      // Fallback: rule-based responses when no API key is configured
      reply = generateFallbackResponse(message);
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("debt") && (lower.includes("manage") || lower.includes("help") || lower.includes("free"))) {
    return "Our Debt Management Service offers professional, one-on-one advisory with structured repayment plans and creditor negotiation support. We offer three programmes: Starter (12 weeks), Standard (24 weeks), and Solid (48 weeks). Would you like to book a consultation to discuss which programme suits your situation?";
  }

  if (lower.includes("program") || lower.includes("package") || lower.includes("offer")) {
    return "We offer three programmes:\n\n• Starter Package (12 weeks) — advisory services with coaching\n• Standard Package (24 weeks) — enhanced coaching and monitoring\n• Solid Package (48 weeks) — full-spectrum advisory including governance and funding support\n\nEach programme is tailored to your needs. Would you like to book a consultation?";
  }

  if (lower.includes("book") || lower.includes("consult") || lower.includes("contact")) {
    return "You can book a consultation by emailing us at advisory@denisawa.co.ke or calling +254 702 448 601. You can also use the contact form on this page. Our team is ready to walk with you on your journey to financial freedom.";
  }

  if (lower.includes("coach") || lower.includes("financial")) {
    return "Our Financial Coaching transforms your financial situation through personalised one-on-one sessions. We cover personal money management, budgeting, saving habits, and accountability partnerships. We also offer Financial Literacy education and Money Mindset coaching rooted in Biblical principles.";
  }

  if (lower.includes("corporate") || lower.includes("business") || lower.includes("company")) {
    return "Our Corporate Financial Wellness programmes empower your workforce with financial education designed to reduce stress and boost productivity. We also offer Business Advisory for SMEs covering governance, investor readiness, and business process re-engineering.";
  }

  if (lower.includes("vision") || lower.includes("mission")) {
    return "Our vision is to be an international benchmark in financial solutions provision. Our mission is to work professionally and ethically, delivering quality services for viable, successful, and sustainable financial solutions. We are Christian-based, with principles in line with Biblical teachings of service.";
  }

  if (lower.includes("partner")) {
    return "Our strategic partners are well-seasoned bankers with far-reaching experience in banking, debt management, finance, management, risk management, trade finance, and capital raising. This depth of experience ensures you receive expert guidance.";
  }

  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
    return "Hello! Welcome to Deni Sawa. I can help you learn about our debt management services, financial coaching programmes, and corporate wellness offerings. What would you like to know?";
  }

  return "Thank you for your question. I'd be happy to connect you with our team for a detailed response. You can reach us at advisory@denisawa.co.ke or +254 702 448 601, or book a consultation through the contact form. Would you like to know about our services or programmes?";
}
