/*
  # Create email_configurations table

  ## Purpose
  This migration creates a dedicated table to store multiple email account configurations
  for each user, allowing them to manage multiple email accounts (Gmail, Outlook, SMTP/IMAP, etc.)

  ## New Tables
  1. `email_configurations`
    - `id` (uuid, primary key) - Unique identifier for the configuration
    - `user_id` (uuid, foreign key) - References the user who owns this configuration
    - `name` (text) - Friendly name for the configuration (e.g., "Gmail Personnel", "Email Pro")
    - `email_address` (text) - The email address for this configuration
    - `provider` (text) - Type of provider (gmail, outlook, smtp_imap, other)
    - `is_connected` (boolean) - Whether the configuration is currently active/connected
    - `smtp_host` (text, nullable) - SMTP server host
    - `smtp_port` (integer, nullable) - SMTP server port
    - `smtp_username` (text, nullable) - SMTP username
    - `smtp_password` (text, nullable) - SMTP password (encrypted)
    - `imap_host` (text, nullable) - IMAP server host
    - `imap_port` (integer, nullable) - IMAP server port
    - `imap_username` (text, nullable) - IMAP username
    - `imap_password` (text, nullable) - IMAP password (encrypted)
    - `gmail_token_id` (uuid, nullable) - Reference to gmail_tokens table if applicable
    - `last_sync_at` (timestamptz, nullable) - Last time emails were synced from this account
    - `created_at` (timestamptz) - When the configuration was created
    - `updated_at` (timestamptz) - When the configuration was last updated

  ## Security
  1. Enable RLS on `email_configurations` table
  2. Add policy for users to read their own configurations
  3. Add policy for users to insert their own configurations
  4. Add policy for users to update their own configurations
  5. Add policy for users to delete their own configurations
*/

-- Create email_configurations table
CREATE TABLE IF NOT EXISTS email_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email_address text NOT NULL,
  provider text NOT NULL DEFAULT 'smtp_imap',
  is_connected boolean NOT NULL DEFAULT false,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_username text,
  smtp_password text,
  imap_host text,
  imap_port integer DEFAULT 993,
  imap_username text,
  imap_password text,
  gmail_token_id uuid REFERENCES gmail_tokens(id) ON DELETE SET NULL,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;

-- Policies for email_configurations
CREATE POLICY "Users can view own email configurations"
  ON email_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email configurations"
  ON email_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email configurations"
  ON email_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email configurations"
  ON email_configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_configurations_user_id ON email_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_configurations_provider ON email_configurations(provider);
