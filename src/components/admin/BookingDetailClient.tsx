'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDate as format } from '@/lib/date-utils';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Save,
  Send,
  User,
  Video,
  X,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client';
import { ErrorBanner, Loading, Modal, PageHeader, StatusPill, AsyncButton, AdminCard } from '@/components/admin/ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { useConfirm } from '@/components/admin/confirm';

interface BookingDetail {
  id: number;
  reference: string;
  service_name: string;
  service_description: string | null;
  duration_minutes: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  status: string;
  booked_date: string | null;
  booked_time: string | null;
  google_event_id: string | null;
  meet_link: string | null;
  payment_confirmed_at: string | null;
  booking_confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  mpesa_receipt: string | null;
  mpesa_checkout_id: string | null;
  payment_phone: string | null;
  payment_status: string | null;
  payment_date: string | null;
  email_logs: Array<{
    id: number;
    subject: string;
    status: string;
    sent_at: string;
  }>;
}

interface BookingDetailResponse {
  booking: BookingDetail;
}

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_TONES: Record<string, 'amber' | 'blue' | 'green' | 'red'> = {
  pending_payment: 'amber',
  paid: 'blue',
  booked: 'green',
  cancelled: 'red',
};

function formatKes(amount: number): string {
  return `KES ${Number(amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[var(--a-border-soft)] last:border-0">
      <span className="text-[13px] text-[var(--a-muted)] shrink-0">{label}</span>
      <span className={cn('text-[13px] font-medium text-[var(--a-ink2)] text-right', mono && 'font-mono text-xs')}>
        {value ?? <span className="text-[var(--a-muted)]">—</span>}
      </span>
    </div>
  );
}

export function BookingDetailClient({ reference }: { reference: string }) {
  const confirm = useConfirm();
  const [booking, setBooking] = React.useState<BookingDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelSendEmail, setCancelSendEmail] = React.useState(true);

  const [editStatus, setEditStatus] = React.useState('');
  const [editDate, setEditDate] = React.useState('');
  const [editTime, setEditTime] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [resendingLogId, setResendingLogId] = React.useState<number | null>(null);
  const [sendingBookingEmail, setSendingBookingEmail] = React.useState(false);
  const [previewModal, setPreviewModal] = React.useState<{
    logId: number;
    subject: string;
    recipient: string;
    html: string;
    previewText: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [sendingFromPreview, setSendingFromPreview] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<BookingDetailResponse>(
        `/api/admin/bookings/${encodeURIComponent(reference)}`
      );
      setBooking(data.booking);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  }, [reference]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // 3-day change window: computed from created_at
  const getChangeWindowInfo = React.useCallback((createdAt: string) => {
    const created = new Date(createdAt);
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + 3);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const canChange = now < deadline;
    const hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
    return { canChange, daysLeft, hoursLeft, deadline };
  }, []);

  const startEdit = React.useCallback(() => {
    if (!booking) return;
    // Block editing for paid bookings after 3-day change window
    if (booking.status === 'paid') {
      const window = getChangeWindowInfo(booking.created_at);
      if (!window.canChange) {
        toast.error('The 3-day date/time change window has closed for this booking.');
        return;
      }
    }
    setEditStatus(booking.status);
    setEditDate(booking.booked_date ?? '');
    setEditTime(booking.booked_time ? booking.booked_time.slice(0, 5) : '');
    setEditNotes(booking.notes ?? '');
    setEditing(true);
  }, [booking, getChangeWindowInfo]);

  const cancelEdit = React.useCallback(() => {
    setEditing(false);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!booking) return;
    setSaving(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/bookings/${encodeURIComponent(reference)}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editStatus,
          booked_date: editDate || null,
          booked_time: editTime ? `${editTime}:00` : null,
          notes: editNotes || null,
        }),
      });
      setEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }, [booking, reference, editStatus, editDate, editTime, editNotes, load]);

  const handleCancelBooking = React.useCallback(async () => {
    if (!booking) return;
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/bookings/${encodeURIComponent(reference)}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'cancelled',
          cancel_reason: cancelReason.trim(),
          send_email: cancelSendEmail,
        }),
      });
      setShowCancelModal(false);
      setCancelReason('');
      setCancelSendEmail(true);
      toast.success('Booking cancelled successfully.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  }, [booking, reference, cancelReason, cancelSendEmail, load]);
  const handleResendEmail = React.useCallback(async (logId: number) => {
    setPreviewLoading(true);
    setPreviewModal(null);
    try {
      const data = await adminFetch<{ ok: boolean; subject: string; recipient: string; html: string; previewText: string; error?: string }>(
        `/api/admin/bookings/email-log/${logId}/preview`
      );
      if (!data.ok) {
        toast.error(data.error ?? 'Failed to load email preview');
        return;
      }
      setPreviewModal({ logId, subject: data.subject, recipient: data.recipient, html: data.html, previewText: data.previewText });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load email preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [adminFetch]);

  const handleConfirmResend = React.useCallback(async () => {
    if (!previewModal) return;
    setSendingFromPreview(true);
    try {
      await adminFetch(`/api/admin/bookings/email-log/${previewModal.logId}/resend`, {
        method: 'POST',
        body: JSON.stringify({ subject: previewModal.subject, html: previewModal.html }),
      });
      toast.success('Email resent successfully');
      setPreviewModal(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend email');
    } finally {
      setSendingFromPreview(false);
    }
  }, [previewModal, load, adminFetch]);

  const handleSendBookingEmail = React.useCallback(async () => {
    if (!booking) return;
    const ok = await confirm({
      title: 'Send Booking Email',
      message: `Send a "Select Your Booking Date" email to ${booking.customer_email}?`,
      confirmLabel: 'Send Email',
      danger: false,
    });
    if (!ok) return;
    setSendingBookingEmail(true);
    try {
      await adminFetch(`/api/admin/bookings/${encodeURIComponent(reference)}/send-booking-email`, { method: 'POST' });
      toast.success('Booking email sent successfully');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setSendingBookingEmail(false);
    }
  }, [booking, reference, load, confirm]);

  if (loading) {
    return <Loading label="Loading booking details…" />;
  }

  if (error && !booking) {
    return <ErrorBanner message={error} />;
  }

  if (!booking) {
    return <ErrorBanner message="Booking not found." />;
  }

  const statusTone = STATUS_TONES[booking.status] ?? 'grey';

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-4" />}

      <PageHeader
        title={`Booking ${booking.reference}`}
        subtitle={`Created ${format(new Date(booking.created_at), 'dd MMM yyyy, HH:mm')}`}
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bookings', href: '/admin/bookings' },
          { label: booking.reference },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 py-2 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <StatusPill tone={statusTone}>{booking.status.replace('_', ' ')}</StatusPill>
            {editing ? (
              <>
                <AsyncButton
                  label="Save"
                  loading={saving}
                  loadingLabel="Saving…"
                  icon={<Save className="h-3.5 w-3.5" />}
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                />
                <AsyncButton
                  label="Cancel"
                  icon={<X className="h-3.5 w-3.5" />}
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                />
              </>
            ) : (
              <>
                <AsyncButton
                  label="Edit"
                  icon={<Edit className="h-3.5 w-3.5" />}
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                />
                {booking.status === 'paid' && (
                  <AsyncButton
                    label="Send Booking Email"
                    loading={sendingBookingEmail}
                    loadingLabel="Sending…"
                    icon={<Mail className="h-3.5 w-3.5" />}
                    variant="outline"
                    size="sm"
                    onClick={handleSendBookingEmail}
                  />
                )}
                {booking.status !== 'cancelled' && (
                  <AsyncButton
                    label="Cancel Booking"
                    loading={cancelling}
                    loadingLabel="Cancelling…"
                    icon={<X className="h-3.5 w-3.5" />}
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                  />
                )}
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Details */}
        <AdminCard title="Booking Details" subtitle="Service and scheduling information">
          <div className="space-y-0">
            <InfoRow
              label="Reference"
              value={
                <span className="font-mono text-xs font-semibold text-[#E8510A]">
                  {booking.reference}
                </span>
              }
            />
            <InfoRow label="Service" value={booking.service_name} />
            {booking.service_description && (
              <InfoRow label="Description" value={booking.service_description} />
            )}
            {booking.duration_minutes != null && (
              <InfoRow label="Duration" value={`${booking.duration_minutes} minutes`} />
            )}
            <InfoRow label="Amount" value={<span className="font-semibold">{formatKes(booking.amount)}</span>} />
            <div className="py-2 border-b border-[var(--a-border-soft)]">
              <div className="flex justify-between gap-4 items-center">
                <span className="text-[13px] text-[var(--a-muted)]">Status</span>
                {editing ? (
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="h-8 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-2 text-[13px] font-medium text-[var(--a-ink2)] focus:border-[#E8510A] focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <StatusPill tone={statusTone}>{booking.status.replace('_', ' ')}</StatusPill>
                )}
              </div>
            </div>
            <div className="py-2 border-b border-[var(--a-border-soft)]">
              <div className="flex justify-between gap-4 items-center">
                <span className="text-[13px] text-[var(--a-muted)]">Booked Date</span>
                {editing ? (
                  <DatePicker
                    value={editDate}
                    onSelect={(v) => setEditDate(v)}
                    disablePast={false}
                    clearable
                    className="h-8 text-[13px]"
                  />
                ) : (
                  <span className="text-[13px] font-medium text-[var(--a-ink2)]">
                    {booking.booked_date
                      ? format(new Date(booking.booked_date), 'dd MMM yyyy')
                      : '—'}
                  </span>
                )}
              </div>
            </div>
            <div className="py-2 border-b border-[var(--a-border-soft)]">
              <div className="flex justify-between gap-4 items-center">
                <span className="text-[13px] text-[var(--a-muted)]">Booked Time</span>
                {editing ? (
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="h-8 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-2 text-[13px] font-medium text-[var(--a-ink2)] focus:border-[#E8510A] focus:outline-none"
                  />
                ) : (
                  <span className="text-[13px] font-medium text-[var(--a-ink2)]">
                    {booking.booked_time ? booking.booked_time.slice(0, 5) : '—'}
                  </span>
                )}
              </div>
            </div>
            {booking.status === 'paid' && (() => {
              const window = getChangeWindowInfo(booking.created_at);
              return (
                <div className="py-2 border-b border-[var(--a-border-soft)]">
                  <div className="flex justify-between gap-4 items-center">
                    <span className="text-[13px] text-[var(--a-muted)]">Date Change Window</span>
                    <span className={cn(
                      'text-[13px] font-medium',
                      window.canChange ? 'text-[#E8510A]' : 'text-[var(--a-muted)]'
                    )}>
                      {window.canChange
                        ? window.daysLeft > 0
                          ? `${window.daysLeft} day${window.daysLeft === 1 ? '' : 's'} remaining`
                          : `${window.hoursLeft} hour${window.hoursLeft === 1 ? '' : 's'} remaining`
                        : 'Window closed'}
                    </span>
                  </div>
                </div>
              );
            })()}
            <div className="py-2">
              <div className="flex flex-col gap-2">
                <span className="text-[13px] text-[var(--a-muted)]">Notes</span>
                {editing ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    className="rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-[13px] font-medium text-[var(--a-ink2)] focus:border-[#E8510A] focus:outline-none focus:ring-2 focus:ring-[#E8510A]/20 resize-none"
                    placeholder="Add notes…"
                  />
                ) : (
                  <span className="text-[13px] font-medium text-[var(--a-ink2)] whitespace-pre-wrap">
                    {booking.notes || <span className="text-[var(--a-muted)]">No notes</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Customer Information */}
        <AdminCard title="Customer Information" subtitle="Contact details">
          <div className="space-y-0">
            <InfoRow
              label="Name"
              value={
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[var(--a-muted)]" />
                  {booking.customer_name}
                </span>
              }
            />
            <InfoRow
              label="Email"
              value={
                <a
                  href={`mailto:${booking.customer_email}`}
                  className="flex items-center gap-1.5 text-[#E8510A] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {booking.customer_email}
                </a>
              }
            />
            <InfoRow
              label="Phone"
              value={
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[var(--a-muted)]" />
                  {booking.customer_phone}
                </span>
              }
            />
          </div>
        </AdminCard>

        {/* Payment Details */}
        <AdminCard title="Payment Details" subtitle="M-Pesa payment information">
          <div className="space-y-0">
            <InfoRow
              label="Payment Status"
              value={
                <StatusPill tone={booking.payment_status === 'success' ? 'green' : booking.payment_status === 'failed' ? 'red' : 'amber'}>
                  {booking.payment_status ?? '—'}
                </StatusPill>
              }
            />
            <InfoRow
              label="M-Pesa Receipt"
              value={
                booking.mpesa_receipt ? (
                  <span className="font-mono text-xs font-semibold text-[#5A9E28]">
                    {booking.mpesa_receipt}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow
              label="Checkout Reference"
              value={
                <span className="font-mono text-[10px] text-[var(--a-muted)]">
                  {booking.mpesa_checkout_id
                    ? booking.mpesa_checkout_id.length > 24
                      ? booking.mpesa_checkout_id.slice(0, 24) + '…'
                      : booking.mpesa_checkout_id
                    : '—'}
                </span>
              }
            />
            <InfoRow
              label="Payment Phone"
              value={
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[var(--a-muted)]" />
                  {booking.payment_phone ?? '—'}
                </span>
              }
            />
            <InfoRow
              label="Payment Date"
              value={
                booking.payment_date
                  ? format(new Date(booking.payment_date), 'dd MMM yyyy, HH:mm')
                  : '—'
              }
            />
            <InfoRow
              label="Payment Confirmed"
              value={
                booking.payment_confirmed_at
                  ? format(new Date(booking.payment_confirmed_at), 'dd MMM yyyy, HH:mm')
                  : '—'
              }
            />
          </div>
        </AdminCard>

        {/* Scheduling */}
        <AdminCard title="Scheduling" subtitle="Calendar integration">
          <div className="space-y-0">
            <InfoRow
              label="Booked Date"
              value={
                booking.booked_date
                  ? format(new Date(booking.booked_date), 'dd MMM yyyy')
                  : '—'
              }
            />
            <InfoRow
              label="Booked Time"
              value={booking.booked_time ? booking.booked_time.slice(0, 5) : '—'}
            />
            <InfoRow
              label="Booking Confirmed"
              value={
                booking.booking_confirmed_at
                  ? format(new Date(booking.booking_confirmed_at), 'dd MMM yyyy, HH:mm')
                  : '—'
              }
            />
            <InfoRow
              label="Google Calendar ID"
              value={
                booking.google_event_id ? (
                  <span className="font-mono text-[10px] text-[var(--a-muted)]">
                    {booking.google_event_id.length > 24
                      ? booking.google_event_id.slice(0, 24) + '…'
                      : booking.google_event_id}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow
              label="Google Meet"
              value={
                booking.meet_link ? (
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#5A9E28] hover:underline"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join Meeting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  '—'
                )
              }
            />
          </div>
        </AdminCard>
      </div>

      {/* Email Log */}
      {booking.email_logs && booking.email_logs.length > 0 && (
        <AdminCard title="Email Log" subtitle={`${booking.email_logs.length} email(s) sent`} className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--a-border-soft)] bg-[var(--a-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--a-ink)]">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--a-ink)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--a-ink)]">
                    Sent At
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[var(--a-ink)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border-soft)]">
                {booking.email_logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-[var(--a-subtle)]">
                    <td className="px-4 py-3 text-sm text-[var(--a-ink2)]">{log.subject}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={log.status === 'sent' ? 'green' : log.status === 'failed' ? 'red' : 'amber'}>
                        {log.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--a-muted)]">
                      {format(new Date(log.sent_at), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleResendEmail(log.id)}
                        disabled={resendingLogId === log.id}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--a-border)] bg-[var(--a-card)] px-2.5 py-1 text-[11px] font-medium text-[var(--a-ink2)] transition-colors hover:border-[#5A9E28] hover:text-[#5A9E28] disabled:opacity-50"
                      >
                        {resendingLogId === log.id ? 'Resending…' : 'Resend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* Cancel Booking Modal */}
      <Modal
        open={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(''); setCancelSendEmail(true); }}
        title="Cancel Booking"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelSendEmail(true); }}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 py-2 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 disabled:opacity-50"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={cancelling || !cancelReason.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#B91C1C] disabled:opacity-50"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cancelling…
                </>
              ) : (
                'Cancel Booking'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10">
              <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--a-ink2)]">
                Are you sure you want to cancel booking <span className="font-mono font-semibold">{booking.reference}</span>?
              </p>
              <p className="text-sm text-[var(--a-muted)]">
                This action is irreversible. The booking status will be set to &ldquo;cancelled&rdquo; and any associated scheduling will be removed.
              </p>
              {booking.meet_link && (
                <p className="text-sm text-[var(--a-muted)]">
                  The Google Meet link will also become inactive.
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--a-ink2)]">Reason for cancellation *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="e.g. Client requested to reschedule, duplicate booking, etc."
              className="w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 py-2 text-[13px] text-[var(--a-ink)] placeholder-[var(--a-muted)] focus:border-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 resize-none"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={cancelSendEmail}
              onChange={(e) => setCancelSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--a-border)] accent-[#DC2626]"
            />
            <span className="text-[13px] text-[var(--a-ink2)]">Send cancellation email to customer</span>
          </label>
        </div>
      </Modal>

      {/* Email Preview Modal */}
      <Modal
        open={!!previewModal}
        onClose={() => { if (!sendingFromPreview) setPreviewModal(null); }}
        title="Email Preview"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPreviewModal(null)}
              disabled={sendingFromPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3.5 py-2 text-[13px] font-semibold text-[var(--a-text)] transition-colors hover:border-[#E8510A]/40 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmResend}
              disabled={sendingFromPreview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8510A] px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#C44508] disabled:opacity-50"
            >
              {sendingFromPreview ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Confirm & Send
                </>
              )}
            </button>
          </>
        }
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--a-muted)]" />
            <span className="ml-2 text-sm text-[var(--a-muted)]">Loading preview…</span>
          </div>
        ) : previewModal ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-subtle)] p-3 space-y-1.5">
              <div className="flex gap-2 text-[13px]">
                <span className="font-semibold text-[var(--a-muted)] w-20 shrink-0">To:</span>
                <span className="text-[var(--a-ink2)]">{previewModal.recipient}</span>
              </div>
              <div className="flex gap-2 text-[13px]">
                <span className="font-semibold text-[var(--a-muted)] w-20 shrink-0">Subject:</span>
                <span className="text-[var(--a-ink2)] font-medium">{previewModal.subject}</span>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--a-border)] overflow-hidden">
              <div className="bg-[var(--a-subtle)] px-3 py-1.5 border-b border-[var(--a-border)]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--a-muted)]">Email Preview</span>
              </div>
              <div
                className="bg-white p-4 max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewModal.html }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
