import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = resolve('./google-oauth-tokens.json');

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
}

function isOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

function loadTokens(): OAuthTokens | null {
  if (!existsSync(TOKEN_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function saveTokens(tokens: OAuthTokens): void {
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(): string | null {
  if (!isOAuthConfigured()) return null;
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string): Promise<boolean> {
  if (!isOAuthConfigured()) return false;
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    saveTokens(tokens as unknown as OAuthTokens);
    return true;
  } catch (err) {
    console.error('google-calendar-oauth: token exchange failed:', err);
    return false;
  }
}

export async function getOAuthCalendarClient() {
  if (!isOAuthConfigured()) return null;

  const tokens = loadTokens();
  if (!tokens) return null;

  const oauth2Client = getOAuth2Client();

  // Set credentials (handles auto-refresh if expired)
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Listen for token refresh events to persist new tokens
  oauth2Client.on('tokens', (newTokens) => {
    const merged: OAuthTokens = {
      access_token: newTokens.access_token ?? tokens.access_token,
      refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
      expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
      token_type: 'Bearer',
    };
    saveTokens(merged);
  });

  // Proactively refresh if token is expired or about to expire (within 5 min)
  if (!tokens.expiry_date || tokens.expiry_date <= Date.now() + 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const merged: OAuthTokens = {
        access_token: credentials.access_token ?? tokens.access_token,
        refresh_token: credentials.refresh_token ?? tokens.refresh_token,
        expiry_date: credentials.expiry_date ?? tokens.expiry_date,
        token_type: 'Bearer',
      };
      saveTokens(merged);
      oauth2Client.setCredentials(merged);
    } catch (err) {
      console.error('google-calendar-oauth: proactive token refresh failed:', err);
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Returns a Calendar client using Domain-Wide Delegation (DWD).
 * Uses the service account key to impersonate the Workspace user.
 * Works on Vercel with GOOGLE_SERVICE_ACCOUNT_KEY_JSON env var.
 * Requires GOOGLE_DWD_IMPERSONATE env var to enable.
 */
export async function getDWDCalendarClient() {
  const impersonate = process.env.GOOGLE_DWD_IMPERSONATE;
  if (!impersonate) return null;

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? './google-service-account.json';

  if (!keyJson && !existsSync(/*turbopackIgnore: true*/ keyFile)) {
    return null;
  }

  const auth = new GoogleAuth({
    // Use env var if available (Vercel), otherwise fall back to file
    ...(keyJson ? { credentials: JSON.parse(keyJson) } : { keyFile: resolve(/*turbopackIgnore: true*/ keyFile) }),
    scopes: SCOPES,
    clientOptions: {
      subject: impersonate,
    },
  });

  return google.calendar({ version: 'v3', auth });
}

export function isDWDConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DWD_IMPERSONATE &&
    (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  );
}

export function isGoogleOAuthReady(): boolean {
  if (!isOAuthConfigured()) return false;
  const tokens = loadTokens();
  return tokens !== null;
}

export { isOAuthConfigured };
