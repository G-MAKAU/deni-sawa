import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Lightbulb, MessagesSquare, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { business, aiSystemPrompt } from '@/data/content';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Tab = 'suggestions' | 'chat';

const welcomeMessage: Message = {
  role: 'assistant',
  content: `Hello! I'm the Deni Sawa AI assistant. I can help you learn about our debt management programmes, financial coaching, and corporate wellness services. What would you like to know?`,
};

const suggestionGroups = [
  {
    label: 'Services',
    prompts: [
      'Tell me about your debt management services',
      'What programmes do you offer?',
      'What is your approach to financial coaching?',
    ],
  },
  {
    label: 'Getting Started',
    prompts: [
      'How can I book a consultation?',
      'How much does counselling cost?',
      'What do I need to prepare for a session?',
    ],
  },
  {
    label: 'Common Questions',
    prompts: [
      'Is my information confidential?',
      'How soon can I expect results?',
      'Do you serve businesses too?',
    ],
  },
];

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('suggestions');
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show a teaser prompt after the user has stayed on the page for a while
  useEffect(() => {
    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!open && !teaserVisible) setTeaserVisible(true);
      }, 5000);
    };

    if (open) {
      setTeaserVisible(false);
    } else {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, teaserVisible]);

  // Dismiss the teaser after it has been visible for a while without interaction
  useEffect(() => {
    if (!teaserVisible) return;
    const t = setTimeout(() => setTeaserVisible(false), 12000);
    return () => clearTimeout(t);
  }, [teaserVisible]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, tab]);

  useEffect(() => {
    if (open && tab === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, tab]);

  const openChat = (openTab: Tab = 'suggestions') => {
    setTab(openTab);
    setOpen(true);
    setTeaserVisible(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setTab('chat');
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/ai-chat`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ message: text, systemPrompt: aiSystemPrompt }),
      });

      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const data = await response.json();

      if (!data.reply || typeof data.reply !== 'string') {
        throw new Error('Invalid response format');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm having trouble connecting right now. Please reach us directly at ${business.email} or ${business.phone}.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Teaser bubble — appears after a delay and opens the chat on click */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 origin-bottom-right transition-all duration-300',
          teaserVisible && !open ? 'scale-100 opacity-100 translate-y-0' : 'pointer-events-none scale-90 opacity-0 translate-y-2'
        )}
      >
        <button
          onClick={() => openChat('suggestions')}
          className="group flex items-center gap-3 rounded-full border border-border bg-card py-3 pl-4 pr-3 shadow-soft-xl transition-all duration-300 hover:border-brand/40 hover:shadow-brand-glow"
          aria-label="Open chat"
        >
          <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-semibold text-foreground">Welcome! How can we support you today?</span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-brand" />
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => (open ? setOpen(false) : openChat('suggestions'))}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-brand-glow transition-all duration-300 active:scale-90',
          open ? 'bg-ink-800 text-white' : 'bg-brand text-white'
        )}
        aria-label="Toggle AI chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] origin-bottom-right transition-all duration-300',
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
        )}
      >
        <div className="flex flex-col overflow-hidden rounded-4xl border border-border bg-card shadow-soft-xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand to-brand-600 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-heading text-sm font-bold text-white">Deni Sawa Assistant</div>
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                AI-powered · Online now
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border bg-muted/20 p-1.5">
            <button
              onClick={() => setTab('suggestions')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300',
                tab === 'suggestions' ? 'bg-white text-brand shadow-soft dark:bg-ink-800' : 'text-muted-foreground hover:text-brand'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Suggestions
            </button>
            <button
              onClick={() => setTab('chat')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300',
                tab === 'chat' ? 'bg-white text-brand shadow-soft dark:bg-ink-800' : 'text-muted-foreground hover:text-brand'
              )}
            >
              <MessagesSquare className="h-3.5 w-3.5" />
              Chat
            </button>
          </div>

          {tab === 'chat' ? (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="h-[300px] overflow-y-auto scrollbar-hide p-4 space-y-3 bg-muted/20">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex animate-chat-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mr-2 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 animate-chat-in">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="chat-bubble-ai flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 bg-card">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about our services..."
                    disabled={loading}
                    className="flex-1 rounded-full border border-input bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white transition-all duration-300 hover:bg-brand-600 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  AI assistant · For personalised advice, book a consultation
                </p>
              </div>
            </>
          ) : (
            /* Suggestions panel */
            <div className="h-[370px] overflow-y-auto scrollbar-hide p-4 space-y-5 bg-muted/20">
              <div className="flex items-start gap-2.5 px-1 pt-1">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Lightbulb className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-foreground">Suggested Topics</p>
                  <p className="text-xs text-muted-foreground">
                    Pick a topic to get started — tap an option to send it instantly.
                  </p>
                </div>
              </div>

              {suggestionGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground px-1">{group.label}</p>
                  <div className="space-y-2">
                    {group.prompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="group flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left text-xs text-muted-foreground transition-all duration-200 hover:border-brand/40 hover:text-brand"
                      >
                        {prompt}
                        <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}