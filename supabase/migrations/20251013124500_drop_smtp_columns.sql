/*
  # Remove SMTP columns from email_configurations

  Changes:
  - Drop smtp_host, smtp_port, smtp_username
  Rationale: The application no longer requires SMTP configuration.
*/

ALTER TABLE email_configurations
  DROP COLUMN IF EXISTS smtp_host,
  DROP COLUMN IF EXISTS smtp_port,
  DROP COLUMN IF EXISTS smtp_username;


