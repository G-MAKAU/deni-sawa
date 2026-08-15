-- Deni Sawa — Storage bucket: remove the 10 MB per-file cap.
-- The bucket now allows files up to the project's storage plan quota (Supabase
-- direct uploads are still bounded by the platform's per-request upload limit).
-- Run after 20260815000002_admin_team_policies.sql.

begin;

update storage.buckets
set file_size_limit = null
where id = 'deni_sawa';

commit;
