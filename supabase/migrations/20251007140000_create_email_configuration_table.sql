/*
  # Create email_configuration table

  1. New Tables
    - `email_configuration`
      - `id` (uuid, primary key) - Unique identifier for each configuration
      - `user_id` (uuid, foreign key) - Reference to the user who owns this configuration
      - `email` (text) - Email address configured
      - `email_password` (text) - Encrypted password for email authentication
      - `smtp_host` (text) - SMTP server hostname
      - `smtp_port` (integer) - SMTP server port (default: 587)
      - `imap_host` (text) - IMAP server hostname
      - `imap_port` (integer) - IMAP server port (default: 993)
      - `company_name` (text) - Name of the company
      - `activity_description` (text) - Description of company's activity
      - `services` (text) - Services offered by the company
      - `is_configured` (boolean) - Whether the configuration is complete
      - `is_active` (boolean) - Whether the configuration is active
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `email_configuration` table
    - Add policy for users to read their own email configurations
    - Add policy for users to insert their own email configurations
    - Add policy for users to update their own email configurations
    - Add policy for users to delete their own email configurations

  3. Notes
    - Foreign key constraint ensures data integrity with profiles table
    - Users can only access their own email configuration data
    - Default values set for ports and boolean flags
    - Index added on user_id for optimal query performance
*/

CREATE TABLE IF NOT EXISTS email_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  email_password text,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  imap_host text,
  imap_port integer DEFAULT 993,
  company_name text,
  activity_description text,
  services text,
  is_configured boolean DEFAULT false,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email configuration"
  ON email_configuration
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email configuration"
  ON email_configuration
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email configuration"
  ON email_configuration
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email configuration"
  ON email_configuration
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_configuration_user_id ON email_configuration(user_id);
