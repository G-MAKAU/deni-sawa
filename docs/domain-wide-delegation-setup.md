# Domain-Wide Delegation (DWD) — Step-by-Step Setup

## What is DWD?

Domain-Wide Delegation lets the service account **impersonate a Workspace user** (`cgichuhi@denisawa.co.ke`) without any user consent screen. This means:
- Calendar events are created **as the Workspace user** (they are the organizer)
- Google Meet links are **open** ("Anyone with the link" — no "Ask to join")
- No OAuth tokens needed — service account key is used directly
- Works on Vercel — just store the key as an env var

---

## Prerequisites

| Requirement | Status |
|-------------|--------|
| Google Cloud project (`norse-bond-509308-a4`) | ✅ Exists |
| Service account (`booking-calendar@norse-bond-509308-a4.iam.gserviceaccount.com`) | ✅ Exists |
| Service account key (`google-service-account.json`) | ✅ Exists |
| Google Workspace super admin access (`cgichuhi@denisawa.co.ke`) | ✅ Needed |

---

## Step 1: Enable DWD on Service Account

**Go to:** [Google Cloud Console → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=norse-bond-509308-a4)

1. Select your project: **norse-bond-509308-a4**
2. Click on: **booking-calendar@norse-bond-509308-a4.iam.gserviceaccount.com**
3. Click: **Details** tab
4. Click: **Advanced settings** (at the bottom)
5. Find: **Domain-Wide Delegation** section
6. Click: **Enable Domain-Wide Delegation** (checkbox or toggle)
7. Copy the **Client ID** (a long number like `123456789012`)

> **Screenshot location:** The Client ID appears right below the "Enable Domain-Wide Delegation" checkbox.

**Save the Client ID** — you need it for Step 2.

---

## Step 2: Authorize in Google Workspace Admin Console

**Go to:** [Google Admin Console → API Controls](https://admin.google.com/ac/security/apidataaccess)

> **Important:** You must be signed in as `cgichuhi@denisawa.co.ke` (super admin).

1. In the left sidebar, click: **Security**
2. Click: **API controls** (or **API data access**)
3. Scroll down to: **Domain-wide delegation**
4. Click: **Manage domain-wide delegation**
5. Click: **Add new** (or **Add a client**)
6. In the **Client ID** field, paste the Client ID from Step 1
7. In the **OAuth Scopes** field, enter exactly:
   ```
   https://www.googleapis.com/auth/calendar
   ```
8. Click: **Authorize**

> **If you see multiple scopes separated by commas**, that's fine. The calendar scope is the only required one.

**Verify:** The new client should appear in the list with the calendar scope.

---

## Step 3: Set Meet Default to "Anyone with the link"

**Go to:** [Google Meet Settings](https://meet.google.com/settings)

> Sign in as `cgichuhi@denisawa.co.ke` (the Workspace user being impersonated).

1. Under **Default meeting access**, select: **Anyone with the link**
2. Click **Save**

> This ensures all events created by this user have open Meet links by default.

---

## Step 4: Share Calendar with Service Account (Fallback)

This is a **fallback** in case DWD fails. The service account can also access the calendar directly.

### Option A: Via Google Group (Recommended)

1. **Go to:** [Google Admin Console → Groups](https://admin.google.com/Groups)
2. Click: **Create group**
3. Fill in:
   - **Group name:** `Calendar Access`
   - **Group email:** `calendar-access@denisawa.co.ke` (or similar)
   - **Description:** Service account calendar access
4. Click: **Create**
5. Open the group → **Members** → **Add members**
6. Add: `booking-calendar@norse-bond-509308-a4.iam.gserviceaccount.com`
7. Set role: **Member** (or Owner)
8. Click: **Add**

Then share the calendar with the group:

1. Go to [Google Calendar](https://calendar.google.com) as `cgichuhi@denisawa.co.ke`
2. Find the calendar (or create one: **+ Create calendar**)
3. Click: **⋮** → **Settings and sharing**
4. Scroll to: **Share with specific people or groups**
5. Click: **+ Add people and groups**
6. Enter: `calendar-access@denisawa.co.ke`
7. Select permission: **Make changes and manage sharing**
8. Click: **Send**

### Option B: Direct Share (If Group Fails)

If the per-calendar sharing UI only shows 2 options for the service account:

1. Sign in as `gichuhicm2024@gmail.com` (the original calendar owner)
2. Share the calendar with `booking-calendar@norse-bond-509308-a4.iam.gserviceaccount.com`
3. Select: **Make changes and manage sharing**
4. Click: **Send**

> Personal Gmail calendars don't have the same external user restrictions as Workspace calendars.

---

## Step 5: Enable DWD in Your App

**Add to `.env`:**

```env
GOOGLE_DWD_IMPERSONATE=cgichuhi@denisawa.co.ke
GOOGLE_CALENDAR_ID=cgichuhi@denisawa.co.ke
```

**Restart the dev server:**

```bash
npm run dev
```

---

## Step 6: Test

1. Go to `http://localhost:3000/booking`
2. Create a test booking
3. Complete payment → schedule a date/time
4. Check:
   - ✅ Calendar event appears on `cgichuhi@denisawa.co.ke`'s calendar
   - ✅ Customer receives email with "Join Google Meet" button
   - ✅ Meet link opens directly (no "Ask to join")
   - ✅ Customer receives calendar invite

---

## Deploy to Vercel

Add these environment variables in [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**:

| Name | Value | Environments |
|------|-------|-------------|
| `GOOGLE_CALENDAR_ID` | `cgichuhi@denisawa.co.ke` | All |
| `GOOGLE_DWD_IMPERSONATE` | `cgichuhi@denisawa.co.ke` | All |
| `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | **Full JSON content** of `google-service-account.json` | All |
| `GOOGLE_MEET_LINK` | Static fallback (optional) | All |

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `unauthorized_client` | DWD not authorized in Admin Console | Complete Step 2 |
| `calendarId must be defined` | `GOOGLE_CALENDAR_ID` not set | Set in `.env` or Vercel |
| `No Google Calendar client configured` | No calendar credentials | Set `GOOGLE_SERVICE_ACCOUNT_KEY` or `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` |
| Meet link still shows "Ask to join" | Organizer's Meet default not set | Complete Step 3 |
| Service account can't write to calendar | Calendar not shared with service account | Complete Step 4 |

---

## How It Works

```
Customer schedules booking
    ↓
schedule/route.ts calls createCalendarEvent()
    ↓
getBestCalendarClient() checks:
    ↓
    1. GOOGLE_DWD_IMPERSONATE set? → YES → getDWDCalendarClient()
       ↓
       Uses service account key + impersonates cgichuhi@denisawa.co.ke
       ↓
       Creates event as cgichuhi@denisawa.co.ke (organizer)
       ↓
       Meet link generated (open access)
       ↓
       Calendar invite sent to customer
    ↓
    2. No? → Check OAuth2 → Check Service Account
```

---

## Current Priority Chain

```
1. DWD (GOOGLE_DWD_IMPERSONATE set) → Best: Meet links, attendees, no consent
2. OAuth2 (tokens exist) → Good: Meet links, needs initial consent
3. Service account (direct) → Fallback: No Meet links, no attendees
4. Static link (GOOGLE_MEET_LINK) → Last resort: Same link for all bookings
```
