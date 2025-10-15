/*
  # Create view: email_configurations_simple

  Expose a flattened set of columns matching the provided JSON:
  - id, user_id, email, password, smtp_host, smtp_port,
    imap_host, imap_port, company_name, activity_description,
    services_offered, created_at

  Notes:
  - password is sourced from email_configurations.smtp_password
  - services_offered is sourced from profiles.services
*/

CREATE OR REPLACE VIEW email_configurations_simple AS
SELECT
  ec.id,
  ec.user_id,
  ec.email_address AS email,
  ec.smtp_password AS password,
  ec.smtp_host,
  ec.smtp_port,
  ec.imap_host,
  ec.imap_port,
  p.company_name,
  p.activity_description,
  p.services AS services_offered,
  ec.created_at
FROM email_configurations ec
JOIN profiles p ON p.id = ec.user_id;

-- RLS for views inherits from underlying tables; ensure read policy exists.
-- For clarity, grant SELECT to authenticated on the view.
GRANT SELECT ON TABLE email_configurations_simple TO authenticated;


