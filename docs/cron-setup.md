# Cron Job Setup Guide

This project uses cron jobs for email maintenance tasks. You can run them via **Vercel Cron** (automatic) or **cron-job.org** (free, reliable alternative).

## Environment Variables Required

Set these in your `.env` file and in your hosting platform (Vercel / cron-job.org):

```
CRON_SECRET=your-random-secret-string-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Cron Jobs

| Job | Path | Schedule | Purpose |
|---|---|---|---|
| Email cleanup | `/api/cron/cleanup-email-logs` | Daily at 03:00 UTC | Deletes email logs older than 30 days |
| Email retry | `/api/cron/retry-failed-emails` | Every 30 minutes | Retries failed emails (max 5 attempts), notifies admin after max retries |
| Keep-alive | `/api/health-check/keep-alive` | Every 12 hours | Prevents Vercel cold starts |

## Option A: Vercel Cron (Automatic)

Vercel reads `vercel_.json` and runs crons automatically on the deployed URL.

1. Rename `vercel_.json` to `vercel.json` (remove the underscore)
2. Deploy to Vercel
3. Vercel will automatically run the crons on the schedule defined in `vercel.json`
4. **Note:** Vercel Cron is only available on the **Pro** plan and above. On the free plan, use cron-job.org instead.

## Option B: cron-job.org (Free)

### Step 1: Sign Up

1. Go to [https://cron-job.org](https://cron-job.org)
2. Create a free account
3. Verify your email

### Step 2: Create Jobs

For each cron job, click **"Create cronjob"** and fill in:

#### Job 1: Email Cleanup (Daily)

| Field | Value |
|---|---|
| **URL** | `https://your-domain.vercel.app/api/cron/cleanup-email-logs` |
| **Schedule** | `0 3 * * *` (daily at 03:00 UTC) |
| **Request method** | `GET` |
| **Timezone** | `UTC` |

**Headers tab:**
| Header | Value |
|---|---|
| `Authorization` | `Bearer YOUR_CRON_SECRET` |

#### Job 2: Email Retry (Every 30 min)

| Field | Value |
|---|---|
| **URL** | `https://your-domain.vercel.app/api/cron/retry-failed-emails` |
| **Schedule** | `*/30 * * * *` (every 30 minutes) |
| **Request method** | `GET` |
| **Timezone** | `UTC` |

**Headers tab:**
| Header | Value |
|---|---|
| `Authorization` | `Bearer YOUR_CRON_SECRET` |

#### Job 3: Keep-Alive (Every 12 hours) — Optional

| Field | Value |
|---|---|
| **URL** | `https://your-domain.vercel.app/api/health-check/keep-alive` |
| **Schedule** | `0 */12 * * *` (every 12 hours) |
| **Request method** | `GET` |
| **Timezone** | `UTC` |

**Headers tab:**
| Header | Value |
|---|---|
| `Authorization` | `Bearer YOUR_CRON_SECRET` |

### Step 3: Enable & Test

1. Toggle each job to **Enabled**
2. Click **"Run now"** to test each job manually
3. Check the **Execution history** tab for success/failure status
4. Verify the response is `200 OK` with a JSON body

### Step 4: Notifications (Optional)

In cron-job.org, you can configure email notifications for:
- Failed executions
- Each execution (daily digest recommended)

Go to **Settings → Notifications** and configure as needed.

## How Each Job Works

### Email Cleanup (`/api/cron/cleanup-email-logs`)

- **Deletes** `email_log` rows where `status = 'sent'` and `sent_at` is older than 30 days
- **Deletes** `email_log` rows where `status IN ('failed', 'bounced')` and `created_at` is older than 30 days
- **Deletes** `email_log` rows where `status = 'pending'` and `created_at` is older than 7 days (stuck emails)
- Returns counts of deleted rows

### Email Retry (`/api/cron/retry-failed-emails`)

- Fetches up to 50 emails with `status IN ('pending', 'failed')` and `attempts < 5`
- Retries each email via the same SMTP pipeline (`sendEmail()`)
- On success: updates the row to `status = 'sent'`
- On failure: increments `attempts`; if `attempts >= 5`, marks as permanently `failed` and sends an admin notification email with details
- Admin notification includes: recipient, subject, error message, link to email log

### Keep-Alive (`/api/health-check/keep-alive`)

- Returns `{ ok: true, ts: <ISO timestamp> }`
- Exists solely to prevent Vercel free-tier deployments from cold-starting

## Troubleshooting

### "Unauthorized" errors

- Ensure `CRON_SECRET` is set in your environment variables
- Ensure the `Authorization: Bearer <secret>` header is configured in cron-job.org

### Emails not retrying

- Check that `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are configured
- Check the email log in admin (`/admin/email-log`) for error messages
- Failed auth errors (535) are not retried — only transient network errors

### Cleanup not deleting rows

- The cleanup only deletes rows older than 30 days (sent) or 7 days (stuck pending)
- Check the `sent_at` timestamp — if it's NULL (email was never confirmed sent), the row won't be cleaned up by the sent filter

## Cron Schedule Reference

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * * command

Examples:
0 3 * * *      → Daily at 03:00 UTC
*/30 * * * *   → Every 30 minutes
0 */12 * * *   → Every 12 hours (at minute 0)
```
