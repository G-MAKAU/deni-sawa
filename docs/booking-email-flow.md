# Booking Email Flow — What Customers Receive

## Overview

When a customer books a consultation, they receive **3 communications**:

| # | Email | From | When |
|---|-------|------|------|
| 1 | Payment Confirmation | Deni Sawa Partners (your app) | Immediately after payment |
| 2 | Booking Confirmation | Deni Sawa Partners (your app) | After scheduling date/time |
| 3 | Calendar Invite | Google Calendar (automatic) | After scheduling date/time |

---

## Detailed Flow

### Step 1: Customer Initiates Booking

**API:** `POST /api/booking/initiate`

**What happens:**
- Customer selects a service, enters name/phone/email
- Payment is initiated (M-Pesa STK push or simulation)

**Email #1 — Payment Confirmation** (sent immediately):

| Field | Value |
|-------|-------|
| **Subject** | `Payment Confirmed — Select Your Booking Date (BK-XXXXXXXX-XXXX)` |
| **From** | `mgworkset@gmail.com` (Deni Sawa Partners) |
| **To** | Customer's email |
| **CC** | `mgworkset@gmail.com` (admin notification) |

**Content:**
- Payment amount (KES)
- Booking reference number
- "Select Your Booking Date" button → links to `/booking?ref=BK-...`
- Instructions to select preferred date/time

**No Meet link yet** — the customer hasn't selected a date.

---

### Step 2: Customer Schedules Date/Time

**API:** `POST /api/booking/[reference]/schedule`

**What happens:**
- Customer picks a date and time slot
- Google Calendar event is created (via DWD/OAuth2/service account)
- Meet link is generated (or static fallback used)
- Database is updated with date/time, event ID, and Meet link

**Email #2 — Booking Confirmation** (sent immediately after scheduling):

| Field | Value |
|-------|-------|
| **Subject** | `Booking Confirmed — Financial Planning (BK-XXXXXXXX-XXXX)` |
| **From** | `mgworkset@gmail.com` (Deni Sawa Partners) |
| **To** | Customer's email |
| **CC** | `mgworkset@gmail.com` (admin notification) |

**Content:**
- ✓ Success checkmark icon
- "Booking Confirmed!" heading
- Booking details table:
  - Service name
  - Date (e.g., "Thursday, September 25, 2026")
  - Time (e.g., "14:00 EAT (60 min)")
  - Reference number
  - Amount paid (KES)
- **"Join Google Meet" button** (green, links to Meet URL)
- "What happens next?" section:
  - Calendar invite has been sent
  - Arrive 5 minutes early
- "Visit Our Website" button

---

### Step 3: Google Calendar Invite (Automatic)

**Sent by:** Google Calendar (not your app)

**When:** Immediately after the calendar event is created with the customer as an attendee

| Field | Value |
|-------|-------|
| **Subject** | `Invitation: Financial Planning — Dennis Ouma` |
| **From** | `cgichuhi@denisawa.co.ke` (Google Calendar) |
| **To** | Customer's email |

**Content:**
- Event title (Service — Customer Name)
- Date and time
- Duration
- Google Meet link (click to join)
- Event description (service, client, email, phone, reference, amount)
- **Add to Calendar** button (accept/decline)
- Reminders: 24 hours before + 30 minutes before

**After customer accepts:**
- Event appears in their personal Google Calendar
- They get reminder notifications
- They can join the Meet directly from their calendar

---

## Email Summary Timeline

```
Customer initiates booking
    ↓
Email #1: Payment Confirmation (from your app)
    ↓
Customer selects date/time
    ↓
Email #2: Booking Confirmation (from your app) ─── includes Meet link
    ↓
Google Calendar sends: Calendar Invite (from Google) ─── includes Meet link
    ↓
Customer accepts calendar invite
    ↓
Event appears in their Google Calendar
    ↓
24 hours before: Reminder notification
    ↓
30 minutes before: Reminder notification
    ↓
Customer clicks Meet link → Joins directly
```

---

## If Rescheduling (Within 3-Day Window)

When a customer reschedules their booking:

1. **Old calendar event deleted** (from Google Calendar)
2. **New calendar event created** (with new date/time + Meet link)
3. **New Booking Confirmation email sent** (updated date/time/Meet link)
4. **New Calendar Invite sent** (from Google Calendar)

**No Payment Confirmation email** — payment was already confirmed.

---

## If Booking is Cancelled

**Email #3 — Booking Cancellation** (sent by admin):

| Field | Value |
|-------|-------|
| **Subject** | `Booking Cancelled — Financial Planning (BK-XXXXXXXX-XXXX)` |
| **From** | `mgworkset@gmail.com` (Deni Sawa Partners) |
| **To** | Customer's email |

**Content:**
- Cancellation notice
- Reason (if provided by admin)
- Reference number
- "Contact us to reschedule" link

**Also:**
- Google Calendar event is deleted
- Meet link becomes inactive

---

## Admin Notifications

Every email sent to a customer is also **CC'd to `mgworkset@gmail.com`** (the admin notification email). This includes:

- Payment confirmations
- Booking confirmations
- Cancellation notices

Admin can view all sent emails in **Admin Dashboard → Email Logs**.

---

## Email Delivery Status

All emails are logged in the `email_logs` database table:

| Field | Description |
|-------|-------------|
| `booking_reference` | Links to the booking |
| `email_type` | `payment_confirmation`, `booking_confirmation`, `booking_cancellation` |
| `subject` | Email subject line |
| `recipient_email` | Customer's email |
| `status` | `sent`, `failed`, `pending` |
| `sent_at` | Timestamp when sent |

Admin can view and resend emails from **Admin Dashboard → Email Logs**.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Customer didn't receive Email #1 | SMTP issue | Check Email Logs in admin, resend |
| Customer didn't receive Email #2 | SMTP issue | Check Email Logs in admin, resend |
| No calendar invite received | Calendar event not created | Check calendar ID, DWD status, service account permissions |
| Meet link shows "Ask to join" | Organizer's Meet default | Set default to "Anyone with the link" in Meet settings |
| Meet link not in email | `meet_link` is null | Check Google Calendar logs for errors |

---

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/booking/initiate/route.ts` | Sends Email #1 (Payment Confirmation) |
| `src/app/api/booking/[reference]/schedule/route.ts` | Sends Email #2 (Booking Confirmation) + creates calendar event |
| `src/app/api/admin/bookings/[reference]/route.ts` | Sends cancellation email |
| `src/lib/email.ts` | Email infrastructure (SMTP, templates, send function) |
| `src/lib/google-calendar.ts` | Calendar event creation (DWD → OAuth2 → Service Account) |
