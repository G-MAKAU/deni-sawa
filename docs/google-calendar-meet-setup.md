# Google Calendar & Meet API Setup Guide

This guide walks you through creating a Google Cloud project, enabling the Calendar API, and setting up credentials for use with this booking system.

---

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- A domain or production URL (for production setup)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top left
3. Click **New Project**
4. Enter a project name (e.g., `deni-sawa-booking`)
5. Click **Create**
6. Wait for the project to be created, then select it from the dropdown

---

## Step 2: Enable the Google Calendar API

1. In the sidebar, go to **APIs & Services** > **Library**
2. Search for **Google Calendar API**
3. Click on it, then click **Enable**
4. Wait for the API to be enabled

> **Note:** Google Meet does not have its own API. Meet links are created automatically when you create a Calendar event with a `conferenceData` property. The Calendar API handles everything.

---

## Step 3: Create a Service Account (Recommended)

A **Service Account** is recommended for server-to-server communication (no user login required).

### 3.1 Create the Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **Service Account**
3. Fill in the details:
   - **Service account name:** `booking-calendar` (or any name you prefer)
   - **Service account ID:** auto-generated (e.g., `booking-calendar@your-project.iam.gserviceaccount.com`)
   - **Description:** `Calendar integration for booking system`
4. Click **Create and Continue**
5. For **Step 2 (Grant service account access to project):**
   - **Select a role:** Choose **Owner** (or **Editor** for least privilege)
   - Click **Continue**
6. For **Step 3 (Grant users access to service account):**
   - Leave empty, click **Done**

### 3.2 Create a Service Account Key

1. Click on the newly created service account in the credentials list
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON**
5. Click **Create**
6. A JSON file will be downloaded — **save this file as `google-service-account.json`** in your project root

> **Important:** This file contains sensitive credentials. Never commit it to version control.

### 3.3 Share Your Google Calendar with the Service Account

The service account needs access to your calendar:

1. Open [Google Calendar](https://calendar.google.com/)
2. Find the calendar you want to use (or create a new one)
3. Click the three dots next to the calendar name > **Settings and sharing**
4. **First — Enable external sharing:**
   - Scroll to **Access permissions for events**
   - Under **"Share with specific people or groups"**, you may see a restriction preventing you from granting high-level permissions to external accounts
   - If the permission dropdown is disabled, go to **General settings** (in the left sidebar under your calendar)
   - Scroll to **"Share with specific people"** section
   - Change the default permission level from **"See all event details"** to **"Make changes to events"**
   - Save changes, then go back to your calendar settings
5. Now scroll to **Share with specific people or groups**
6. Click **Add people and groups**
7. Enter the service account email (from step 3.1, e.g., `booking-calendar@your-project.iam.gserviceaccount.com`)
8. Set permissions to **Make changes to events**
9. Click **Send**

> **Note:** If "Make changes to events" is still greyed out, it means your calendar is a **primary calendar** (your personal Google account calendar). In that case, create a **new dedicated calendar** instead:
> 1. Click the **+** button next to "Other calendars" > **Create new calendar**
> 2. Give it a name (e.g., "Booking Calendar")
> 3. Go to that calendar's **Settings and sharing**
> 4. Now you can add the service account with full permissions
>
> **This is the recommended approach** — use a dedicated calendar for bookings, not your personal one.

> **Critical:** Without sharing your calendar, the service account cannot create or manage events.

### 3.4 Get Your Calendar ID

1. In Google Calendar settings, scroll to **Integrate calendar**
2. Copy the **Calendar ID** (looks like `your-email@gmail.com` or a long string like `abc123@group.calendar.google.com`)
3. Set this as the `GOOGLE_CALENDAR_ID` environment variable

---

## Step 4: Environment Variables

Add these to your `.env.local`:

```env
# Google Calendar
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./google-service-account.json

# Optional: Enable/disable calendar integration
GOOGLE_CALENDAR_ENABLED=true
```

---

## Alternative: OAuth 2.0 Setup (User Data Access)

If you need to access calendar data on behalf of a user (not a service account), use OAuth 2.0.

### When to Use OAuth vs Service Account

| Feature | Service Account | OAuth 2.0 |
|---------|----------------|-----------|
| Server-to-server | Yes | Yes |
| User login required | No | Yes |
| Access user's personal calendar | No (only shared calendars) | Yes |
| Best for | Backend booking systems | Apps where users log in |

### Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - **User Type:** Select **External** (unless you have a Google Workspace org)
   - Click **Create**
   - **App name:** `Deni Sawa Booking`
   - **User support email:** your email
   - **Developer contact email:** your email
   - Click **Save and Continue**
   - **Scopes:** Click **Add or Remove Scopes**, add:
     - `https://www.googleapis.com/auth/calendar` (full calendar access)
     - `https://www.googleapis.com/auth/calendar.events` (events only)
   - Click **Save and Continue**
   - **Test users:** Add your Google email (for testing in development)
   - Click **Save and Continue**

4. Now create the OAuth client:
   - **Application type:** Select **Web application**
   - **Name:** `Deni Sawa Booking OAuth`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/callback/google
     https://your-production-domain.com/api/auth/callback/google
     ```
   - Click **Create**

5. Copy the **Client ID** and **Client Secret**

### OAuth Consent Screen Settings Summary

| Field | Value |
|-------|-------|
| User Type | External |
| App name | Deni Sawa Booking |
| Scopes | `calendar`, `calendar.events` |
| Test users | Your Google email(s) |

### OAuth Client Settings Summary

| Field | Value |
|-------|-------|
| Application type | Web application |
| Name | Deni Sawa Booking OAuth |
| Authorized JavaScript origins | `http://localhost:3000`, `https://your-domain.com` |
| Authorized redirect URIs | `http://localhost:3000/api/auth/callback/google`, `https://your-domain.com/api/auth/callback/google` |

---

## Google Cloud Console Checklist

Use this checklist to ensure everything is set up correctly:

### Project Setup
- [ ] Created Google Cloud project
- [ ] Selected the correct project in the console

### APIs Enabled
- [ ] Google Calendar API is enabled

### Credentials
- [ ] Service account created (recommended) OR OAuth client created
- [ ] Service account key JSON downloaded and saved as `google-service-account.json`
- [ ] Service account email noted down

### Calendar Access
- [ ] Service account shared on Google Calendar with "Make changes to events" permission
- [ ] Calendar ID copied from calendar settings

### Environment Variables
- [ ] `GOOGLE_CALENDAR_ID` set
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` set (for service account)
- [ ] `GOOGLE_CALENDAR_ENABLED=true` set

### Testing
- [ ] Created a test booking to verify calendar event creation
- [ ] Verified Google Meet link is generated automatically
- [ ] Verified calendar event appears in Google Calendar

---

## How Google Meet Links Are Created

When a booking is scheduled, the system creates a Google Calendar event with conference data:

```typescript
const event = await calendar.events.insert({
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  conferenceDataVersion: 1,
  sendUpdates: 'all',
  requestBody: {
    summary: 'Consultation — John Doe',
    description: 'Service: Consultation\nClient: John Doe\nReference: BK-20260919-ABC',
    start: { dateTime: '2026-09-20T10:00:00+03:00', timeZone: 'Africa/Nairobi' },
    end: { dateTime: '2026-09-20T11:00:00+03:00', timeZone: 'Africa/Nairobi' },
    attendees: [{ email: 'client@example.com' }],
    conferenceData: {
      createRequest: {
        requestId: 'unique-request-id',
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  },
});
```

The `conferenceData.createRequest` automatically generates a Google Meet link, which is then stored in the booking record.

---

## Troubleshooting

### "Calendar ID not found" or "Not Found" error
- Make sure the service account is shared on the calendar
- Double-check the Calendar ID in settings

### "Access Denied" or "Forbidden" error
- Ensure the Calendar API is enabled
- Check that the service account has the correct role (Owner or Editor)
- Verify the calendar is shared with the service account email

### Meet link not being created
- Ensure `conferenceDataVersion: 1` is set in the event creation request
- Check that the calendar supports Google Meet (most Google Calendars do)

### "Make changes to events" permission is greyed out
- **Cause:** You're trying to share your primary Google account calendar. Primary calendars have restricted sharing permissions for external accounts.
- **Fix:** Create a **new dedicated calendar** for bookings:
  1. Click the **+** next to "Other calendars" > **Create new calendar**
  2. Name it (e.g., "Booking Calendar")
  3. Go to its Settings and sharing
  4. Now you can add the service account with "Make changes to events"
  5. Use this new calendar's ID as `GOOGLE_CALENDAR_ID`
- **Alternative:** If you have a Google Workspace account, ask your admin to enable external sharing on your primary calendar

### "The caller does not have permission" error
- The service account email must be shared on the specific calendar
- The role must be "Make changes to events" (not just "See all event details")

### OAuth "Access Not Configured" error
- Make sure the app is not in "Testing" mode with unapproved scopes
- Add your email as a test user in the OAuth consent screen
- For production, submit the app for Google verification

### Service account key file not found
- Make sure `google-service-account.json` is in the project root
- Check the path matches `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` in `.env.local`
- Never commit this file to Git — add it to `.gitignore`

---

## Production Deployment Notes

1. **Environment variables** must be set on your hosting platform (Vercel, cPanel, etc.)
2. **Service account JSON** must be uploaded to the server (not committed to Git)
3. **Calendar sharing** — the service account must remain shared on the calendar
4. **OAuth consent screen** — for production, switch from "Testing" to "In Production" (requires Google verification for sensitive scopes)
5. **Domain verification** — Google may require domain verification for production OAuth apps

---

## Quick Reference: Required Files & Variables

| Item | Location / Variable |
|------|-------------------|
| Service account key | `./google-service-account.json` (project root) |
| Calendar ID | `GOOGLE_CALENDAR_ID` env var |
| Key path | `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` env var |
| Enable/disable | `GOOGLE_CALENDAR_ENABLED` env var |

---

## API Scopes Required

| Scope | Description |
|-------|-------------|
| `https://www.googleapis.com/auth/calendar` | Full access to calendar |
| `https://www.googleapis.com/auth/calendar.events` | Create, read, update, delete events |
| `https://www.googleapis.com/auth/calendar.events.readonly` | Read events only |

The booking system requires full calendar access (`calendar` scope) to create events, add Meet links, and delete events when bookings are cancelled.
