'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Lightbulb, MessagesSquare, ArrowUpRight, ArrowUp, Calendar, CheckCircle2, Phone, Mail, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { business, aiSystemPrompt, services, programs } from '@/data/content';
import { learningPrograms } from '@/data/site';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Tab = 'suggestions' | 'chat';

const welcomeMessage: Message = {
  role: 'assistant',
  content: `Welcome to Deni Sawa Partners. I can guide you through our Business Support services, Health Checks, Learning programmes and the SpecialSit Network — or simply help you take the right first step. What would you like to explore today?`,
};

const suggestionGroups = [
  {
    label: 'Health Checks',
    prompts: [
      'Tell me about the Business Health Check',
      'How does the Professional Financial Health Check work?',
      'What do I get after completing a Health Check?',
      'How long does the assessment take?',
      'Where can I start my Health Check?',
    ],
  },
  {
    label: 'Business Support',
    prompts: [
      'What does a fractional CFO actually do?',
      'What is fractional CEO support?',
      'How does Special Situations support work?',
      'What is the Deni Sawa Method?',
      'How do I know which service fits my business?',
    ],
  },
  {
    label: 'Learning & Network',
    prompts: [
      learningPrograms[0] ? `Tell me about ${learningPrograms[0].title}` : 'What learning programmes do you offer?',
      'What learning pathways do you offer?',
      'Tell me about the SpecialSit Network',
      'Who is the Executive Finance programme for?',
    ],
  },
  {
    label: 'Getting Started',
    prompts: [
      'How do I book a consultation?',
      'How do I contact the team?',
      'Is my information confidential?',
      'Where can I learn more about the firm?',
    ],
  },
];

interface BookingResult {
  reference: string;
  stored: boolean;
  whatsapp: string;
  mailto: string;
  summary: string;
}

interface BookingState {
  active: boolean;
  name: string;
  contact: string;
  service: string;
  date: string;
  time: string;
  message: string;
  error: string;
  submitting: boolean;
  result: BookingResult | null;
}

const initialBooking: BookingState = {
  active: false,
  name: '',
  contact: '',
  service: '',
  date: '',
  time: '',
  message: '',
  error: '',
  submitting: false,
  result: null,
};

const bookingServiceOptions = [
  ...services.map((s) => s.title),
  ...programs.map((p) => p.title),
  'Not sure yet',
];

const BOOKING_INTENT_RE =
  /\b(book|booking|booked|appointment|appt|schedule|scheduling|reserve|consultation|consult\b|sign me up|enrol|enroll|register|get started|get help)\b/i;
const hasBookingIntent = (text: string) => BOOKING_INTENT_RE.test(text);

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('suggestions');
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [booking, setBooking] = useState<BookingState>(initialBooking);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendMessageRef = useRef<typeof sendMessage>(async () => {});

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  // Allow any page button to open the chat (see src/lib/chat.ts) — e.g. the hero
  // "Get a free consultation" / "Explore your options" buttons send their context here.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || typeof detail.message !== 'string') return;
      setOpen(true);
      setTab('chat');
      setTeaserVisible(false);
      setTimeout(() => sendMessageRef.current(detail.message), 60);
    };
    window.addEventListener('denisawa:chat', handler);
    return () => window.removeEventListener('denisawa:chat', handler);
  }, []);

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

  // Show the scroll-to-top button once the page is scrolled down.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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

    const content = text.trim();
    const userMessage: Message = { role: 'user', content };
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setTab('chat');
    setLoading(true);

    if (hasBookingIntent(content)) {
      setBooking((b) =>
        b.result ? { ...initialBooking, active: true } : b.active ? b : { ...initialBooking, active: true }
      );
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, systemPrompt: aiSystemPrompt, history }),
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

  const setBookingField = (field: keyof Pick<BookingState, 'name' | 'contact' | 'service' | 'date' | 'time' | 'message'>, value: string) => {
    setBooking((b) => ({ ...b, [field]: value, error: '' }));
  };

  const resetBooking = () => {
    setBooking({ ...initialBooking, active: true });
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = booking.name.trim();
    const contact = booking.contact.trim();
    const service = booking.service.trim();

    if (!name || !contact || !service) {
      setBooking((b) => ({ ...b, error: 'Please fill in your name, a phone number or email, and your service of interest.' }));
      return;
    }

    setBooking((b) => ({ ...b, submitting: true, error: '' }));

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          service,
          preferredDate: booking.date,
          preferredTime: booking.time,
          message: booking.message.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        const err = (Array.isArray(data.errors) && data.errors[0]) || "We couldn't complete your booking. Please try again or call us directly.";
        setBooking((b) => ({ ...b, submitting: false, error: err }));
        return;
      }

      setBooking((b) => ({ ...b, submitting: false, result: data as BookingResult }));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Thank you, ${name} — your consultation request is confirmed (Reference: ${data.reference}). A member of our team will reach out to confirm your appointment. You can also send the details straight to us using the buttons below.`,
        },
      ]);
    } catch {
      setBooking((b) => ({ ...b, submitting: false, error: 'Something went wrong. Please try again or reach us directly.' }));
    }
  };

  return (
    <>
      {/* Teaser bubble — desktop only (keeps mobile clean), appears after a delay */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 hidden origin-bottom-right transition-all duration-300 md:block',
          teaserVisible && !open ? 'scale-100 opacity-100 translate-y-0' : 'pointer-events-none scale-90 opacity-0 translate-y-2'
        )}
      >
        <button
          onClick={() => openChat('suggestions')}
          className="group flex items-center gap-3 rounded-full border border-brand/15 bg-card py-3 pl-4 pr-3 shadow-soft-xl transition-all duration-300 hover:border-brand/40 hover:shadow-brand-glow"
          aria-label="Open chat"
        >
          <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">How can we help you today?</span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-brand" />
        </button>
      </div>

      {/* Scroll to top — sits to the left of the chat toggle, appears on scroll */}
      <div
        className={cn(
          'fixed bottom-6 right-[88px] z-50 transition-all duration-300',
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        )}
      >
        <button
          onClick={scrollToTop}
          className="flex h-14 w-14 items-center justify-center rounded-md border border-card-border bg-card text-foreground/70 shadow-soft-xl transition-all duration-300 hover:border-brand/40 hover:text-brand active:scale-90"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => (open ? setOpen(false) : openChat('suggestions'))}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-brand-glow transition-all duration-300 active:scale-90',
          open ? 'bg-charcoaldeep' : 'bg-gradient-to-br from-brand to-brand-600'
        )}
        aria-label="Toggle AI chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-[100] w-[calc(100vw-1.5rem)] max-w-[400px] origin-bottom-right transition-all duration-300',
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
        )}
      >
        <div className="flex max-h-[min(680px,calc(100dvh-8.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft-xl">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-charcoaldeep via-charcoal to-navydeep p-4">
            <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-brand/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-growth/20 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-heading text-sm font-bold text-white">Deni Sawa Assistant</div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-growth" />
                  AI concierge · From Special Situations to Best-in-Class
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border bg-muted/20 p-1.5">
            <button
              onClick={() => setTab('suggestions')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300',
                tab === 'suggestions' ? 'bg-brand text-white shadow-sm' : 'text-muted-foreground hover:text-brand'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Suggestions
            </button>
            <button
              onClick={() => setTab('chat')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300',
                tab === 'chat' ? 'bg-brand text-white shadow-sm' : 'text-muted-foreground hover:text-brand'
              )}
            >
              <MessagesSquare className="h-3.5 w-3.5" />
              Chat
            </button>
          </div>

          {tab === 'chat' ? (
            <>
              {/* Messages */}
              <div ref={scrollRef} className={cn('overflow-y-auto scrollbar-hide p-4 space-y-3 bg-muted/20', booking.active ? 'h-[100px] flex-none' : 'min-h-[180px] max-h-[300px] flex-1')}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn('flex animate-chat-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                        msg.role === 'user'
                          ? 'rounded-2xl rounded-tr-sm bg-brand text-white'
                          : 'rounded-2xl rounded-tl-sm border border-border bg-card text-foreground'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 animate-chat-in">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-3 shadow-sm">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking form — opens when the user expresses intent to book */}
              {booking.active &&
                (booking.result ? (
                  <div className="shrink-0 border-t border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green">
                      <CheckCircle2 className="h-4 w-4" /> Consultation requested
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reference{' '}
                      <span className="font-mono font-semibold text-foreground">{booking.result.reference}</span>
                      {' — '}
                      {booking.result.stored
                        ? 'saved to our system.'
                        : 'our team will confirm your appointment shortly.'}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        href={booking.result.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-full bg-green px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-green-600"
                      >
                        <Phone className="h-3.5 w-3.5" /> Send via WhatsApp
                      </a>
                      <a
                        href={booking.result.mailto}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-all duration-300 hover:border-brand hover:text-brand"
                      >
                        <Mail className="h-3.5 w-3.5" /> Send via Email
                      </a>
                    </div>
                    <button
                      onClick={resetBooking}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-brand"
                    >
                      <RefreshCw className="h-3 w-3" /> Book another consultation
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={submitBooking}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border bg-muted/20"
                  >
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                      <div className="flex items-center justify-between px-4 pt-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-brand">Book a consultation</p>
                        <button
                          type="button"
                          onClick={() => setBooking((b) => ({ ...b, active: false }))}
                          className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-brand"
                        >
                          Close
                        </button>
                      </div>
                      <div className="space-y-2 p-4">
                        <Input
                          value={booking.name}
                          onChange={(e) => setBookingField('name', e.target.value)}
                          placeholder="Full name *"
                        />
                        <Input
                          value={booking.contact}
                          onChange={(e) => setBookingField('contact', e.target.value)}
                          placeholder="Phone or email *"
                        />
                        <select
                          value={booking.service}
                          onChange={(e) => setBookingField('service', e.target.value)}
                          className="h-12 w-full rounded-2xl border border-input bg-background/50 px-4 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Service of interest *</option>
                          {bookingServiceOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <DatePicker
                            value={booking.date}
                            onSelect={(iso) => setBookingField('date', iso)}
                          />
                          <TimePicker
                            value={booking.time}
                            onChange={(time) => setBookingField('time', time)}
                          />
                        </div>
                        <Textarea
                          value={booking.message}
                          onChange={(e) => setBookingField('message', e.target.value)}
                          placeholder="Anything you'd like us to know (optional)"
                          rows={2}
                          className="min-h-[64px] py-2"
                        />
                        {booking.error && <p className="text-xs font-medium text-red-500">{booking.error}</p>}
                        <button type="submit" disabled={booking.submitting} className="btn-brand w-full text-sm !py-2.5">
                          {booking.submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4" /> Confirm consultation request
                            </>
                          )}
                        </button>
                        <p className="text-center text-[10px] text-muted-foreground">
                          Prefer to talk? Call{' '}
                          <a
                            href={`tel:${business.phone.replace(/\s/g, '')}`}
                            className="font-medium text-brand hover:underline"
                          >
                            {business.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                  </form>
                ))}

              {/* Input */}
              <div className="border-t border-border bg-card p-3">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about our services…"
                    disabled={loading}
                    className="h-11 flex-1 rounded-full border border-border bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-md ring-1 ring-white/30 transition-all duration-300 hover:bg-brand-600 hover:shadow-brand-glow active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:ring-0"
                    aria-label="Send message"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  AI concierge · Confidential &amp; judgement-free
                </p>
              </div>
            </>
          ) : (
            /* Suggestions panel */
            <div className="h-[400px] overflow-y-auto scrollbar-hide p-4 space-y-5 bg-muted/20">
              <div className="flex items-start gap-2.5 px-1 pt-1">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-foreground">How can we help you today?</p>
                  <p className="text-xs text-muted-foreground">
                    Explore a topic below — or ask us anything in chat.
                  </p>
                </div>
              </div>

              {suggestionGroups.map((group, gi) => (
                <div key={group.label}>
                  <p className="mb-2 flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <span
                      className={cn(
                        'h-3 w-0.5 rounded-full',
                        ['bg-brand', 'bg-growth', 'bg-navy', 'bg-charcoaldeep'][gi % 4]
                      )}
                    />
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.prompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="group flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 text-left text-xs font-medium text-foreground transition-all duration-200 hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                      >
                        {prompt}
                        <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand group-hover:opacity-100" />
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