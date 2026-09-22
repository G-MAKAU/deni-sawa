'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Calendar,
  CreditCard,
  Loader2,
  Phone,
  Mail,
  User,
  PartyPopper,
  Video,
  Sun,
  Sunset,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { site } from '@/data/site';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingService {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  duration_minutes: number;
  allow_custom_amount: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

type Step = 'service' | 'payment' | 'calendar' | 'success';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(amount: number): string {
  return `KES ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Stepper                                                            */
/* ------------------------------------------------------------------ */

const steps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'service', label: 'Service', icon: Check },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'calendar', label: 'Schedule', icon: Calendar },
  { key: 'success', label: 'Done', icon: PartyPopper },
];

function BookingStepper({ current }: { current: Step }) {
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                  done && 'bg-growth text-white',
                  active && 'bg-brand text-white shadow-[0_2px_12px_rgba(232,81,10,0.35)]',
                  !done && !active && 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-6 transition-colors duration-300 sm:w-10',
                  i < idx ? 'bg-growth' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Service Selection                                          */
/* ------------------------------------------------------------------ */

function ServiceSelection({
  services,
  selected,
  onSelect,
  onContinue,
  loading,
}: {
  services: BookingService[];
  selected: BookingService | null;
  onSelect: (s: BookingService) => void;
  onContinue: () => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState('');

  const filtered = services.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.short_description && s.short_description.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Choose Your Service
        </h2>
        <p className="mt-2 text-muted-foreground">
          Select the service you&apos;d like to book and review the details below.
        </p>
      </div>

      {!loading && services.length > 3 && (
        <div className="mx-auto mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border-2 border-border bg-card p-5"
            >
              <div className="h-5 w-3/4 rounded bg-muted-foreground/15" />
              <div className="mt-3 h-4 w-full rounded bg-muted-foreground/10" />
              <div className="mt-2 h-4 w-2/3 rounded bg-muted-foreground/10" />
              <div className="mt-4 flex items-center gap-4">
                <div className="h-6 w-20 rounded bg-muted-foreground/15" />
                <div className="h-4 w-16 rounded bg-muted-foreground/10" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No services match &ldquo;{search}&rdquo;</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-2 text-sm font-semibold text-brand hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          filtered.map((service) => {
            const isSelected = selected?.id === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelect(service)}
                className={cn(
                  'group relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-300',
                  isSelected
                    ? 'border-brand bg-brand/[0.04] shadow-[0_0_0_1px_rgba(232,81,10,0.15)]'
                    : 'border-border bg-card hover:border-brand/40 hover:shadow-card'
                )}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
                <h3 className="pr-8 font-heading text-lg font-bold text-foreground">
                  {service.name}
                </h3>
                {service.short_description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {service.short_description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4">
                  {service.allow_custom_amount ? (
                    <div>
                      <span className="text-xl font-bold text-brand">From {formatPrice(service.price)}</span>
                      <p className="text-xs text-muted-foreground">You can set your own amount</p>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-brand">{formatPrice(service.price)}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration_minutes} min
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" disabled={!selected || loading} onClick={onContinue} className="px-10">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Payment                                                    */
/* ------------------------------------------------------------------ */

function PaymentForm({
  service,
  allowCustomAmount,
  minimumAmount,
  onBack,
  onPay,
  loading,
  error,
}: {
  service: BookingService;
  allowCustomAmount: boolean;
  minimumAmount: number;
  onBack: () => void;
  onPay: (data: { name: string; phone: string; email: string; amount: number; notes: string }) => void;
  loading: boolean;
  error: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState(minimumAmount);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [pendingData, setPendingData] = useState<{ name: string; phone: string; email: string; amount: number; notes: string } | null>(null);

  const formatPhoneDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254') && digits.length === 12) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return raw;
  };

  const handleSubmit = () => {
    const errs: string[] = [];
    if (allowCustomAmount) {
      const parsed = parseFloat(String(amount));
      if (isNaN(parsed) || parsed <= 0) {
        errs.push('Please enter a valid amount.');
      } else if (parsed < minimumAmount) {
        errs.push(`Amount must be at least KES ${minimumAmount.toLocaleString()}.`);
      }
    }
    if (!name.trim()) errs.push('Please enter your full name.');
    if (!phone.trim()) {
      errs.push('Please enter your phone number.');
    } else if (!/^\+?[0-9][0-9\s()-]{6,19}$/.test(phone.trim())) {
      errs.push('Please enter a valid phone number.');
    }
    if (!email.trim()) {
      errs.push('Please enter your email address.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.push('Please enter a valid email address.');
    }
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    const data = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      amount: allowCustomAmount ? parseFloat(String(amount)) : service.price,
      notes: notes.trim(),
    };
    setPendingData(data);
    setConfirming(true);
  };

  const confirmPayment = () => {
    if (!pendingData) return;
    setConfirming(false);
    onPay(pendingData);
  };

  const displayAmount = allowCustomAmount ? parseFloat(String(amount)) || minimumAmount : service.price;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Your Details & Payment
        </h2>
        <p className="mt-2 text-muted-foreground">
          Enter your details and pay via M-Pesa to confirm your booking.
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Selected Service</p>
              <p className="mt-1 font-heading text-lg font-bold text-foreground">{service.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand">{formatPrice(displayAmount)}</p>
              <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {service.duration_minutes} min
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {allowCustomAmount && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Amount (KES)</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min={minimumAmount}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Minimum: {formatPrice(minimumAmount)}</p>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="John Kamau" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" disabled={loading} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number (M-Pesa)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" disabled={loading} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Safaricom number — you&apos;ll receive an M-Pesa prompt</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" disabled={loading} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Confirmation and calendar invite will be sent here</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or questions..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20 resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-muted-foreground">{notes.length}/500 characters</p>
          </div>
        </div>

        {(validationErrors.length > 0 || error) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            {validationErrors.length > 0 ? (
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button size="lg" onClick={handleSubmit} disabled={loading} className="px-8">
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>) : (<>Pay {formatPrice(displayAmount)} <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You&apos;ll receive an M-Pesa prompt on your phone. Enter your PIN to complete payment.
        </p>
      </div>

      {/* Phone Number Confirmation Modal */}
      {confirming && pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                <Phone className="h-7 w-7 text-brand" />
              </div>
            </div>
            <h3 className="text-center font-heading text-lg font-bold text-foreground">Confirm M-Pesa Number</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              An M-Pesa payment prompt will be sent to this number. Please confirm it&apos;s correct.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-background p-4 text-center">
              <p className="font-mono text-xl font-bold text-foreground">{formatPhoneDisplay(pendingData.phone)}</p>
            </div>
            <div className="mt-2 rounded-lg bg-brand/[0.04] p-3 text-center">
              <p className="text-sm text-muted-foreground">Amount: <span className="font-bold text-foreground">{formatPrice(pendingData.amount)}</span></p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setConfirming(false); setPendingData(null); }}>
                Edit Number
              </Button>
              <Button className="flex-1" onClick={confirmPayment} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <>Confirm & Pay</>}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2b: Waiting for payment                                       */
/* ------------------------------------------------------------------ */

function PaymentWaiting({
  reference,
  onPollResult,
}: {
  reference: string;
  onPollResult: (paid: boolean) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (elapsed === 0) return;
    if (elapsed > 180) { if (timerRef.current) clearInterval(timerRef.current); onPollResult(false); return; }
    if (elapsed % 5 === 0) {
      fetch(`/api/booking/${reference}`).then((r) => r.json()).then((d) => {
        if (d.ok && d.booking?.status === 'paid') { if (timerRef.current) clearInterval(timerRef.current); onPollResult(true); }
      }).catch(() => {});
    }
  }, [elapsed, reference, onPollResult]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mx-auto max-w-md text-center">
      <div className="mb-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
      <h2 className="font-heading text-xl font-bold text-foreground">Waiting for Payment</h2>
      <p className="mt-2 text-sm text-muted-foreground">Check your phone for the M-Pesa prompt and enter your PIN.</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reference</p>
        <p className="mt-1 font-mono text-lg font-bold text-foreground">{reference}</p>
        <div className="mt-3 h-px bg-border" />
        <p className="mt-3 text-sm text-muted-foreground">
          Elapsed: <span className="font-mono font-semibold text-foreground">{mins}:{String(secs).padStart(2, '0')}</span>
        </p>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">You&apos;ll receive a confirmation email once payment is verified.</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Calendar (redesigned)                                      */
/* ------------------------------------------------------------------ */

function BookingCalendar({
  reference,
  serviceName,
  createdAt,
  isReschedule,
  rescheduleInfo,
  onBack,
  onSuccess,
}: {
  reference: string;
  serviceName: string;
  createdAt: string | null;
  isReschedule?: boolean;
  rescheduleInfo?: { date: string | null; time: string };
  onBack: () => void;
  onSuccess: (booking: { reference: string; date: string; time: string; service: string; duration: number; meetLink: string | null }) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState('');
  const [dateMessage, setDateMessage] = useState<{ type: 'holiday' | 'blocked' | 'weekend'; text: string } | null>(null);

  // 3-day change window
  const changeWindowInfo = (() => {
    if (!createdAt) return { canChange: true, daysLeft: 3, hoursLeft: 72 };
    const created = new Date(createdAt);
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 3);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    return { canChange: now < deadline, daysLeft, hoursLeft };
  })();

  const isoDate = selectedDate ? toISODate(selectedDate) : null;

  // Fetch slots when date changes
  useEffect(() => {
    if (!isoDate) { setSlots([]); setSelectedTime(null); setDateMessage(null); return; }
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedTime(null);
    setError('');
    setDateMessage(null);
    fetch(`/api/booking/${reference}/slots?date=${isoDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.ok) {
          setError(d.error ?? 'Failed to load slots.');
          setSlots([]);
          return;
        }
        if (d.holiday) {
          setDateMessage({ type: 'holiday', text: `${d.holiday} — no availability` });
          setSlots([]);
        } else if (d.blocked) {
          setDateMessage({ type: 'blocked', text: d.blockedReason ? `${d.blockedReason} — no availability` : 'This date is blocked — no availability' });
          setSlots([]);
        } else if (d.weekend) {
          setDateMessage({ type: 'weekend', text: 'Weekends — no availability' });
          setSlots([]);
        } else {
          setSlots(d.slots ?? []);
        }
      })
      .catch(() => { if (!cancelled) setError('Failed to load time slots.'); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [isoDate, reference]);

  const morningSlots = slots.filter((s) => { const h = parseInt(s.time.split(':')[0], 10); return h < 12; });
  const afternoonSlots = slots.filter((s) => { const h = parseInt(s.time.split(':')[0], 10); return h >= 12; });
  const availableCount = slots.filter((s) => s.available).length;

  const handleSchedule = async () => {
    if (!isoDate || !selectedTime) return;
    setScheduling(true);
    setError('');
    try {
      const res = await fetch(`/api/booking/${reference}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: isoDate, time: selectedTime }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess(data.booking);
      } else {
        setError(data.error ?? 'Failed to schedule. Please try again.');
      }
    } catch {
      setError('Failed to schedule. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Pick Your Date & Time</h2>
        <p className="mt-2 text-muted-foreground">Select a weekday and choose an available time slot.</p>
        {!changeWindowInfo.canChange ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-2.5">
            <span className="text-sm font-medium text-[#DC2626]">
              The 3-day change window has closed. Please contact us to reschedule.
            </span>
          </div>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E8510A]/30 bg-[#E8510A]/5 px-4 py-2.5">
            <Clock className="h-4 w-4 text-[#E8510A]" />
            <span className="text-sm font-medium text-[#E8510A]">
              {changeWindowInfo.daysLeft > 0
                ? `${changeWindowInfo.daysLeft} day${changeWindowInfo.daysLeft === 1 ? '' : 's'} remaining to choose your date`
                : `${changeWindowInfo.hoursLeft} hour${changeWindowInfo.hoursLeft === 1 ? '' : 's'} remaining to choose your date`}
            </span>
          </div>
        )}
      </div>

      {isReschedule && rescheduleInfo?.date && (
        <div className="mx-auto max-w-3xl mb-6">
          <div className="rounded-xl border border-[#5A9E28]/30 bg-[#5A9E28]/5 p-4">
            <p className="text-sm font-semibold text-[#5A9E28] mb-1">Currently Scheduled</p>
            <p className="text-sm text-[var(--a-ink2)]">
              {new Date(rescheduleInfo.date + 'T12:00:00Z').toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {rescheduleInfo.time ? ` at ${rescheduleInfo.time} EAT` : ''}
            </p>
            <p className="text-xs text-[var(--a-muted)] mt-1">Select a new date and time below to reschedule.</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Calendar Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d ?? undefined); setSelectedTime(null); setError(''); }}
                defaultMonth={isReschedule && rescheduleInfo?.date ? new Date(rescheduleInfo.date + 'T12:00:00Z') : undefined}
                disabled={(d) => {
                  if (!changeWindowInfo.canChange) return true;
                  const day = d.getDay();
                  if (day === 0 || day === 6) return true;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const check = new Date(d);
                  check.setHours(0, 0, 0, 0);
                  return check <= today;
                }}
                className="w-full [--cell-size:2.75rem] md:[--cell-size:3rem]"
                classNames={{
                  selected: 'bg-brand text-white font-bold hover:bg-brand-600 hover:text-white shadow-[0_2px_8px_rgba(232,81,10,0.35)]',
                  today: 'border-2 border-brand/50 font-bold text-brand bg-brand/[0.06]',
                }}
              />
            </CardContent>
          </Card>

          {/* Time Slots Panel */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand" />
                    <span className="text-sm font-semibold text-foreground">Available Times</span>
                  </div>
                  {slots.length > 0 && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                      {availableCount} open
                    </span>
                  )}
                </div>
                {!isoDate && (
                  <div className="py-8 text-center">
                    <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Select a date to see available times</p>
                  </div>
                )}

                {isoDate && loadingSlots && (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex h-10 animate-pulse items-center rounded-xl bg-muted px-3">
                        <div className="h-3 w-12 rounded bg-muted-foreground/15" />
                      </div>
                    ))}
                  </div>
                )}

                {isoDate && !loadingSlots && slots.length === 0 && !error && (
                  <div className="py-8 text-center">
                    {dateMessage ? (
                      <div className="space-y-2">
                        <div className={cn(
                          'mx-auto flex h-10 w-10 items-center justify-center rounded-full',
                          dateMessage.type === 'holiday' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                          dateMessage.type === 'blocked' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                          dateMessage.type === 'weekend' && 'bg-muted text-muted-foreground',
                        )}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{dateMessage.text}</p>
                        <p className="text-xs text-muted-foreground">Please select a different date</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No slots available on this date</p>
                    )}
                  </div>
                )}

                {morningSlots.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5 text-brand" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Morning</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {morningSlots.map((slot) => (
                        <SlotButton key={slot.time} slot={slot} selected={selectedTime} onSelect={setSelectedTime} />
                      ))}
                    </div>
                  </div>
                )}

                {afternoonSlots.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sunset className="h-3.5 w-3.5 text-brand" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Afternoon</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {afternoonSlots.map((slot) => (
                        <SlotButton key={slot.time} slot={slot} selected={selectedTime} onSelect={setSelectedTime} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {selectedDate && selectedTime && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="rounded-2xl border-2 border-brand/20 bg-brand/[0.03] p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-brand">Your Selection</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium text-foreground">{serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground">{formatDate(isoDate!)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium text-foreground">{selectedTime} EAT</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">{error}</div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={onBack} disabled={scheduling}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button size="lg" onClick={handleSchedule} disabled={!selectedDate || !selectedTime || scheduling || !changeWindowInfo.canChange} className="px-8">
            {scheduling ? (<><Loader2 className="h-4 w-4 animate-spin" /> {isReschedule ? 'Rescheduling...' : 'Confirming...'}</>) : (<>{isReschedule ? 'Reschedule Booking' : 'Confirm Booking'} <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function SlotButton({ slot, selected, onSelect }: { slot: TimeSlot; selected: string | null; onSelect: (t: string) => void }) {
  return (
    <button
      type="button"
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
      className={cn(
        'rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200',
        !slot.available && 'cursor-not-allowed bg-muted text-muted-foreground/40 line-through',
        slot.available && selected !== slot.time && 'border border-border bg-card text-foreground hover:border-brand/40 hover:bg-brand/5',
        slot.available && selected === slot.time && 'border-2 border-brand bg-brand/10 text-brand font-bold shadow-[0_0_0_1px_rgba(232,81,10,0.1)]'
      )}
    >
      {slot.time}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: Success                                                    */
/* ------------------------------------------------------------------ */

function BookingSuccessView({ booking }: { booking: { reference: string; date: string; time: string; service: string; duration: number; meetLink: string | null } }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="mx-auto max-w-md text-center">
      <div className="mb-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-growth/10">
          <PartyPopper className="h-10 w-10 text-growth" />
        </div>
      </div>

      <h2 className="font-heading text-2xl font-bold text-foreground">You&apos;re Booked!</h2>
      <p className="mt-2 text-muted-foreground">A confirmation email has been sent to your inbox.</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="bg-gradient-to-r from-brand to-brand-600 px-6 py-4">
          <p className="text-sm font-semibold text-white/80">Your Appointment</p>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="text-sm font-semibold text-foreground">{booking.service}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-semibold text-foreground">{formatDate(booking.date)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="text-sm font-semibold text-foreground">{booking.time} EAT ({booking.duration} min)</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reference</span>
              <span className="font-mono text-sm font-bold text-foreground">{booking.reference}</span>
            </div>
          </div>
        </div>
      </div>

      {booking.meetLink && (
        <div className="mt-6">
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-growth px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_30px_rgba(90,158,40,0.35)] transition-all duration-300 hover:shadow-[0_6px_40px_rgba(90,158,40,0.5)] hover:brightness-110 active:scale-[0.97]"
          >
            <Video className="h-4 w-4" />
            Join Google Meet
          </a>
          <p className="mt-3 text-xs text-muted-foreground">A calendar invite has also been sent to your email.</p>
        </div>
      )}

      {!booking.meetLink && (
        <div className="mt-6 rounded-xl border border-brand/20 bg-brand/[0.04] p-4">
          <p className="text-sm text-muted-foreground">
            A calendar invite will arrive in your email shortly. Please arrive 5 minutes before your scheduled time.
          </p>
        </div>
      )}

      {/* What to Expect — Email Flow */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left shadow-card">
        <h3 className="mb-4 text-sm font-bold text-foreground">What to Expect Next</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-growth/10">
              <Mail className="h-4 w-4 text-growth" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Booking Confirmation Email</p>
              <p className="text-xs text-muted-foreground">Sent to your email with all booking details and your Google Meet link.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8510A]/10">
              <Calendar className="h-4 w-4 text-[#E8510A]" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Calendar Invite Email</p>
              <p className="text-xs text-muted-foreground">A Google Calendar invitation. <strong>Please accept it</strong> so it appears in your calendar with reminders.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A9E28]/10">
              <Video className="h-4 w-4 text-[#5A9E28]" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Google Meet Link</p>
              <p className="text-xs text-muted-foreground">Included in both emails. Click to join directly on your scheduled date.</p>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-[#E8510A]/5 border border-[#E8510A]/20 px-4 py-3">
          <p className="text-xs text-[#E8510A] font-medium">Important: Accept the calendar invite so you receive reminders before your appointment.</p>
        </div>
      </div>

      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/">Return to Deni Sawa <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function BookingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </main>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');

  const [step, setStep] = useState<Step>(refParam ? 'calendar' : 'service');
  const [services, setServices] = useState<BookingService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [reference, setReference] = useState(refParam ?? '');
  const [bookingCreatedAt, setBookingCreatedAt] = useState<string | null>(null);
  const [isReschedule, setIsReschedule] = useState(false);
  const [rescheduleInfo, setRescheduleInfo] = useState<{ date: string | null; time: string }>({ date: null, time: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [successBooking, setSuccessBooking] = useState<{
    reference: string; date: string; time: string; service: string; duration: number; meetLink: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/booking/services').then((r) => r.json()).then((d) => { if (d.ok) setServices(d.services); }).catch(() => {}).finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!refParam) return;
    fetch(`/api/booking/${refParam}`).then((r) => r.json()).then((d) => {
      if (!d.ok) return;
      const b = d.booking;
      if (b.status === 'booked') {
        const created = new Date(b.created_at);
        const deadline = new Date(created);
        deadline.setDate(deadline.getDate() + 3);
        const canEdit = new Date() < deadline;
        if (canEdit) {
          setReference(refParam);
          setBookingCreatedAt(b.created_at);
          setSelectedService({ id: 0, name: b.booking_services?.name ?? 'Consultation', slug: '', description: null, short_description: null, price: b.amount, duration_minutes: b.booking_services?.duration_minutes ?? 60, allow_custom_amount: false });
          setIsReschedule(true);
          setRescheduleInfo({ date: b.booked_date, time: b.booked_time?.slice(0, 5) ?? '' });
          setStep('calendar');
        } else {
          setSuccessBooking({ reference: b.reference, date: b.booked_date, time: b.booked_time?.slice(0, 5) ?? '', service: b.booking_services?.name ?? 'Consultation', duration: b.booking_services?.duration_minutes ?? 60, meetLink: b.meet_link ?? null });
          setStep('success');
        }
      } else if (b.status === 'paid') { setReference(refParam); setBookingCreatedAt(b.created_at); setStep('calendar'); }
      else if (b.status === 'pending_payment') { setReference(refParam); setStep('payment'); }
    }).catch(() => {});
  }, [refParam]);

  const handlePay = async (data: { name: string; phone: string; email: string; amount: number; notes: string }) => {
    if (!selectedService) return;
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/booking/initiate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: selectedService.id, name: data.name, phone: data.phone, email: data.email, amount: data.amount, notes: data.notes }) });
      const result = await res.json();
      if (result.ok) {
        setReference(result.reference);
        setPaymentLoading(false);
        setStep('payment');
      } else { setPaymentError(result.errors?.join(' ') ?? 'Payment initiation failed.'); setPaymentLoading(false); }
    } catch { setPaymentError('An error occurred. Please try again.'); setPaymentLoading(false); }
  };

  const handlePollResult = useCallback((paid: boolean) => {
    if (paid) setStep('calendar');
    else { setPaymentError('Payment timed out.'); setStep('service'); }
  }, []);

  const handleSuccess = useCallback(
    (booking: { reference: string; date: string; time: string; service: string; duration: number; meetLink: string | null }) => {
      setSuccessBooking(booking);
      setStep('success');
    },
    []
  );

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-bgalt">
        <div className="container-lux py-10 text-center sm:py-14">
          <span className="eyebrow mb-4 items-start gap-2 text-brand"><span className="divider-accent" />Book a Consultation</span>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Schedule Your Appointment</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Choose a service, pay via M-Pesa, and pick a time that works for you.</p>
        </div>
      </section>

      <div className="border-b border-border bg-background py-5">
        <div className="container-lux"><BookingStepper current={step} /></div>
      </div>

      <div className="container-lux py-10 sm:py-14">
        <AnimatePresence mode="wait">
          {step === 'service' && <ServiceSelection key="service" services={services} selected={selectedService} onSelect={setSelectedService} onContinue={() => setStep('payment')} loading={loadingServices} />}
          {step === 'payment' && !reference && <PaymentForm key="payment-form" service={selectedService!} allowCustomAmount={selectedService!.allow_custom_amount} minimumAmount={selectedService!.price} onBack={() => setStep('service')} onPay={handlePay} loading={paymentLoading} error={paymentError} />}
          {step === 'payment' && reference && <PaymentWaiting key="payment-wait" reference={reference} onPollResult={handlePollResult} />}
          {step === 'calendar' && <BookingCalendar key="calendar" reference={reference} serviceName={selectedService?.name ?? ''} createdAt={bookingCreatedAt} isReschedule={isReschedule} rescheduleInfo={rescheduleInfo} onBack={() => setStep('service')} onSuccess={handleSuccess} />}
          {step === 'success' && successBooking && <BookingSuccessView key="success" booking={successBooking} />}
        </AnimatePresence>
      </div>
    </main>
  );
}
