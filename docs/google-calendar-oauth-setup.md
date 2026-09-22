# Google Calendar OAuth2 Setup — Auto-Generated Meet Links

This guide walks you through setting up OAuth2 for Google Calendar so each booking automatically gets a unique Google Meet link.

---

## Why OAuth2?

The service account approach (used for calendar busy-time checks) **cannot** create Google Meet links or invite attendees. OAuth2 authenticates as the calendar owner, enabling:

- **Auto-generated Google Meet links** for every booking
- **Calendar invite emails** sent to customers automatically
- **Attendee management** on calendar events

---

## Prerequisites

- A Google account that owns or has edit access to the calendar
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- The `GOOGLE_CALENDAR_ID` already configured (same one used for service account)

---

## Step 1: Create OAuth2 Credentials

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** (for testing) or **Internal** (for Google Workspace)
   - Fill in the app name (e.g. "Deni Sawa Booking")
   - Add your Google account as a test user
   - Save
4. Back to creating the OAuth client:
   - **Application type**: Web application
   - **Name**: e.g. "Deni Sawa Booking OAuth"
   - **Authorized redirect URIs**: Add your callback URL:
     ```
     http://localhost:3000/api/admin/google-calendar/callback
     ```
     For production, also add:
     ```
     https://yourdomain.com/api/admin/google-calendar/callback
     ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

---

## Step 2: Set Environment Variables

Add these to your `.env` file:

```env
# Google Calendar OAuth2 (for Meet links)
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/admin/google-calendar/callback
```

For production, update `GOOGLE_OAUTH_REDIRECT_URI` to your production domain.

---

## Step 3: Authorize the Application

1. Start your dev server: `npm run dev`
2. Open this URL in your browser (replace with your actual port):
   ```
   http://localhost:3000/api/admin/google-calendar/auth
   ```
3. You'll see a JSON response with an `authUrl`. Open that URL in your browser.
4. Sign in with the Google account that owns the calendar.
5. Grant the requested permissions (calendar access).
6. After authorization, you'll see a "Connected!" page.
7. The tokens are saved to `google-oauth-tokens.json` in the project root.

> **Important**: The first time you authorize, Google may show a "This app isn't verified" warning. Click **"Advanced"** → **"Go to [app name] (unsafe)"** to proceed. This is normal for apps in testing mode.

---

## Step 4: Verify It Works

1. Create a test booking through the public booking page
2. After scheduling, check the server logs for:
   ```
   google-calendar: create event success
   ```
3. Check the calendar — the event should have a Google Meet link
4. Check the booking confirmation email — it should include the Meet link

---

## How It Works

1. When a booking is scheduled, `createCalendarEvent()` is called
2. If OAuth2 is configured and tokens exist, it creates the event with:
   - The customer as an attendee
   - A Google Meet conference link
   - Email notifications to the attendee
3. If OAuth2 is not configured, it falls back to the service account (no Meet link)
4. Tokens are auto-refreshed when expired — no manual intervention needed

---

## Token Management

- Tokens are stored in `google-oauth-tokens.json` (auto-created after authorization)
- The file is gitignored — never committed to version control
- Tokens auto-refresh when expired (handled by the Google API client)
- If tokens become invalid, re-authorize using Step 3

### Revoke Tokens

To disconnect and re-authorize:
1. Delete `google-oauth-tokens.json`
2. Go to [Google Account → Security → Third-party apps](https://myaccount.google.com/permissions)
3. Find the app and remove access
4. Re-authorize using Step 3

---

## Troubleshooting

### "OAuth is not configured"
- Ensure `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI` are set in `.env`
- Restart the dev server after changing `.env`

### "Token exchange failed"
- Verify the redirect URI in Google Cloud Console matches your `.env` exactly
- Ensure the authorization code hasn't expired (codes expire after ~10 minutes)

### "No Meet link generated"
- Check that OAuth2 is connected (call `/api/admin/google-calendar/auth` — it should return `connected: true`)
- Verify the Google account has Google Meet enabled
- Check server logs for errors during event creation

### "Access not granted" / consent screen issues
- Ensure your Google account is added as a test user in the OAuth consent screen
- For production, publish the OAuth consent screen in Google Cloud Console

### Calendar events not showing
- Verify `GOOGLE_CALENDAR_ID` is correct
- Ensure the OAuth'd account has edit access to the calendar
- Check that the service account (if still used for busy times) also has access

---

## Production Checklist

- [ ] Publish the OAuth consent screen in Google Cloud Console
- [ ] Update `GOOGLE_OAUTH_REDIRECT_URI` to production domain
- [ ] Add production redirect URI to Google Cloud Console authorized redirect URIs
- [ ] Ensure `google-oauth-tokens.json` is not in version control
- [ ] Test the full flow: booking → payment → schedule → Meet link in email

---

## Architecture

```
Booking scheduled
    ↓
createCalendarEvent()
    ↓
OAuth2 available? ──Yes──→ Create event with attendees + Meet link
    │                           ↓
    No                     Meet link saved to booking
    │                           ↓
    ↓                     Email sent with Meet link
Service account
(event only, no Meet link)
```
