# Google OAuth Test Users & Production Setup

## The Problem

When you try to authorize the app, you see:
> **Error 403: access_denied** — "Deni Sawa System has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers."

This happens because your OAuth consent screen is in **Testing** mode (default for new apps). Only users explicitly added as "test users" can authorize.

---

## Quick Fix: Add Test Users (Recommended for Dev)

1. Open [Google Cloud Console → OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select your project (**norse-bond-509308-a4**)
3. Scroll to **"Test users"** section
4. Click **"+ ADD USERS"**
4. Add these emails (one per line):
   ```
   mgworkset@gmail.com
   gichuhicm2024@gmail.com
   cmgichuhi2024@gmail.com
   ```
5. Click **Save**

> **Note:** Test users don't need to be in your Google Workspace — any Google account works.

6. Return to your app → click **"Connect Google Calendar"** → authorize again

---

## Production Setup (Optional — for live deployment)

When you're ready to deploy publicly:

### 1. Complete OAuth Consent Screen
- **App name:** Deni Sawa Booking
- **User support email:** mgworkset@gmail.com
- **Authorized domains:** `denisawa.co.ke` (your production domain)
- **App logo:** Optional
- **Developer contact:** mgworkset@gmail.com

### 2. Publish the App
1. On the OAuth Consent Screen page, click **"PUBLISH APP"**
2. Confirm: **"Push to production"**
3. Status changes from **Testing** → **In production**

### 3. (If required) Submit for Verification
- **Only needed if** you request **sensitive scopes** (e.g., `https://www.googleapis.com/auth/calendar` is **not** sensitive)
- Calendar scope is **recommended** (not sensitive) — no verification required
- If you later add Gmail, Drive, or People API scopes → verification needed

---

## Current Configuration Checklist

| Setting | Value |
|---------|-------|
| **OAuth Client ID** | `699335686069-4u4ectmpk97g5fepushqrm20j48qs4th.apps.googleusercontent.com` |
| **Project** | `norse-bond-509308-a4` |
| **Redirect URI (dev)** | `http://localhost:3000/api/admin/google-calendar/callback` |
| **Redirect URI (prod)** | `https://www.denisawa.co.ke/api/admin/google-calendar/callback` |
| **Scopes** | `https://www.googleapis.com/auth/calendar` |

---

## After Adding Test Users

1. Delete old tokens (if any):
   ```bash
   del B:\MG\deni-sawa-next\google-oauth-tokens.json
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Go to `http://localhost:3000/admin/settings`
4. Click **"Connect Google Calendar"**
5. Sign in with `mgworkset@gmail.com`
6. Grant permissions
7. You'll see "Connected!" with a link back to Settings

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "access_denied" after adding test user | Wait 1–2 minutes for propagation, or re-open auth URL |
| "redirect_uri_mismatch" | Ensure redirect URI in Cloud Console exactly matches `.env` |
| Tokens not saved | Check `google-oauth-tokens.json` exists after callback |
| Meet link not generated | Ensure OAuth shows "Connected" in Settings before scheduling |

---

## Production Redirect URI

When deploying to production, add this to **Authorized redirect URIs** in Cloud Console:
```
https://www.denisawa.co.ke/api/admin/google-calendar/callback
```

And update `.env`:
```env
GOOGLE_OAUTH_REDIRECT_URI=https://www.denisawa.co.ke/api/admin/google-calendar/callback
```