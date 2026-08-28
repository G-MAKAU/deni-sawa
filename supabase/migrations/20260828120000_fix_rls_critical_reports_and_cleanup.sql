-- Fix CRITICAL security issue: health_check_reports had a policy allowing
-- ANY anonymous user to SELECT all rows (including emails, WhatsApp numbers,
-- and AI-generated health data). Report access is handled server-side via
-- service_role client in API routes that validate the report_url_token.
-- This policy was overly permissive and exposed all personal data.

DROP POLICY IF EXISTS "hc_reports_token_read" ON "public"."health_check_reports";

-- Clean up duplicate consultation_bookings INSERT policy for anon.
-- "consultation_bookings_anon_insert" already covers anon + authenticated.
DROP POLICY IF EXISTS "Anyone can create a booking" ON "public"."consultation_bookings";
