/*
  # Simplify to a single table for email configurations

  Changes:
  - Rename columns to match desired schema
    * email_address -> email
    * smtp_password -> password
  - Add company-related fields directly to email_configurations
    * company_name, activity_description, services_offered
  - Keep existing technical columns for backward compatibility (smtp_username, imap_username, etc.)
  - Drop helper view email_configurations_simple (no longer needed)
*/

DO $$ BEGIN
  -- Rename columns if they exist and target doesn't exist yet
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'email_address'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'email'
  ) THEN
    ALTER TABLE email_configurations RENAME COLUMN email_address TO email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'smtp_password'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'password'
  ) THEN
    ALTER TABLE email_configurations RENAME COLUMN smtp_password TO password;
  END IF;

  -- Add company fields if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'activity_description'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN activity_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'services_offered'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN services_offered text;
  END IF;
END $$;

-- Drop the previously created view if present
DROP VIEW IF EXISTS email_configurations_simple;


