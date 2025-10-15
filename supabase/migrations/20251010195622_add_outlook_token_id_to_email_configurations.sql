/*
  # Add outlook_token_id to email_configurations

  ## Purpose
  Add a reference to the outlook_tokens table in email_configurations
  so we can link Outlook configurations to their OAuth tokens.

  ## Changes
  1. Add `outlook_token_id` column to email_configurations table
  2. Add foreign key constraint to outlook_tokens table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'outlook_token_id'
  ) THEN
    ALTER TABLE email_configurations 
    ADD COLUMN outlook_token_id uuid REFERENCES outlook_tokens(id) ON DELETE SET NULL;
  END IF;
END $$;
