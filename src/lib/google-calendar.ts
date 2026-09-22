import { google, type calendar_v3 } from 'googleapis';
import { resolve } from 'path';
import {
  getOAuthCalendarClient,
  getDWDCalendarClient,
  isGoogleOAuthReady,
  isDWDConfigured,
} from './google-calendar-oauth';

let serviceAccountClient: calendar_v3.Calendar | null = null;

function isServiceAccountConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  );
}

function getServiceAccountClient(): calendar_v3.Calendar {
  if (serviceAccountClient) return serviceAccountClient;

  const keyFile = resolve(/*turbopackIgnore: true*/
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? './google-service-account.json'
  );
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  serviceAccountClient = google.calendar({ version: 'v3', auth });
  return serviceAccountClient;
}

/**
 * Get the best available calendar client.
 * Priority: DWD (best: proper Meet links) → OAuth2 → Service Account.
 */
async function getBestCalendarClient(): Promise<{
  cal: calendar_v3.Calendar;
  useOAuth: boolean;
}> {
  // 1. Try DWD first (best: proper Meet links, no consent needed)
  if (isDWDConfigured()) {
    const dwdCal = await getDWDCalendarClient();
    if (dwdCal) return { cal: dwdCal, useOAuth: true };
  }

  // 2. Try OAuth2 (if DWD not configured)
  if (isGoogleOAuthReady()) {
    const oAuthCal = await getOAuthCalendarClient();
    if (oAuthCal) return { cal: oAuthCal, useOAuth: true };
  }

  // 3. Fallback to service account (no Meet links)
  if (isServiceAccountConfigured()) {
    return { cal: getServiceAccountClient(), useOAuth: false };
  }

  // Return a dummy that will fail gracefully
  throw new Error('No Google Calendar client configured');
}

export interface CalendarEventResult {
  eventId: string | null;
  meetLink: string | null;
}

export interface CreateEventOptions {
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  durationMinutes: number;
  attendeeEmail?: string;
  attendeeName?: string;
}

/**
 * Creates a Google Calendar event.
 * When OAuth2 is available, also creates a Google Meet link.
 * Falls back to service account (no Meet link, no attendees).
 */
export async function createCalendarEvent(
  options: CreateEventOptions
): Promise<CalendarEventResult> {
  let cal: calendar_v3.Calendar;
  let useOAuth: boolean;
  try {
    const client = await getBestCalendarClient();
    cal = client.cal;
    useOAuth = client.useOAuth;
  } catch {
    return { eventId: null, meetLink: null };
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const startDT = new Date(
    `${options.startDate}T${options.startTime}:00+03:00`
  );
  const endDT = new Date(
    startDT.getTime() + options.durationMinutes * 60 * 1000
  );

  const event: calendar_v3.Schema$Event = {
    summary: options.summary,
    description: options.description,
    start: { dateTime: startDT.toISOString(), timeZone: 'Africa/Nairobi' },
    end: { dateTime: endDT.toISOString(), timeZone: 'Africa/Nairobi' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  // OAuth2 can add attendees and create Meet links
  if (useOAuth && options.attendeeEmail) {
    event.attendees = [
      { email: options.attendeeEmail, displayName: options.attendeeName },
    ];
    event.conferenceData = {
      createRequest: {
        requestId: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  try {
    const insertParams: calendar_v3.Params$Resource$Events$Insert = {
      calendarId,
      requestBody: event,
    };

    // Only request conferenceData when OAuth2 is active
    if (useOAuth) {
      insertParams.conferenceDataVersion = 1;
      insertParams.sendUpdates = 'all';
    }

    const response = await cal.events.insert(insertParams);

    return {
      eventId: response.data.id ?? null,
      meetLink: response.data.hangoutLink ?? null,
    };
  } catch (err) {
    console.error('google-calendar: create event failed:', err);
    return { eventId: null, meetLink: null };
  }
}

/**
 * Deletes a Google Calendar event by ID.
 * Silently fails if not configured.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!eventId) return;

  let cal: calendar_v3.Calendar;
  try {
    const client = await getBestCalendarClient();
    cal = client.cal;
  } catch {
    return;
  }

  try {
    await cal.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      eventId,
    });
  } catch (err) {
    console.error('google-calendar: delete event failed:', err);
  }
}

export interface BusyBlock {
  start: string; // HH:MM (24h)
  end: string; // HH:MM (24h)
}

/**
 * Queries Google Calendar for busy time blocks on a given date.
 * Returns array of { start, end } in HH:MM format (Africa/Nairobi).
 * Returns [] gracefully if not configured or on error.
 */
export async function getCalendarBusyTimes(
  date: string
): Promise<BusyBlock[]> {
  let cal: calendar_v3.Calendar;
  try {
    const client = await getBestCalendarClient();
    cal = client.cal;
  } catch {
    return [];
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID!;

  const timeMin = new Date(`${date}T00:00:00+03:00`);
  const timeMax = new Date(`${date}T23:59:59+03:00`);

  try {
    const response = await cal.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    const events = response.data.items ?? [];
    const busyBlocks: BusyBlock[] = [];

    for (const event of events) {
      const start = event.start?.dateTime;
      const end = event.end?.dateTime;
      if (!start || !end) continue;

      const startD = new Date(start);
      const endD = new Date(end);

      const startHH = String(startD.getUTCHours() - 3).padStart(2, '0');
      const startMM = String(startD.getUTCMinutes()).padStart(2, '0');
      const endHH = String(endD.getUTCHours() - 3).padStart(2, '0');
      const endMM = String(endD.getUTCMinutes()).padStart(2, '0');

      busyBlocks.push({
        start: `${startHH}:${startMM}`,
        end: `${endHH}:${endMM}`,
      });
    }

    return busyBlocks;
  } catch (err) {
    console.error('google-calendar: get busy times failed:', err);
    return [];
  }
}

/**
 * Returns the Google OAuth consent URL, or null if not configured.
 */
export { getGoogleAuthUrl, isGoogleOAuthReady, getDWDCalendarClient, isDWDConfigured } from './google-calendar-oauth';
