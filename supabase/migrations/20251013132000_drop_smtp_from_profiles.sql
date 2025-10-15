/*
  # Remove SMTP fields from profiles

  Changes:
  - Drop columns smtp_host, smtp_port from public.profiles
*/

ALTER TABLE profiles
  DROP COLUMN IF EXISTS smtp_host,
  DROP COLUMN IF EXISTS smtp_port;


