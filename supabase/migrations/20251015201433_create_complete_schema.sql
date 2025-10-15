/*
  # Create complete database schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `company_name` (text) - User's company name
      - `activity_description` (text) - Business activity description
      - `services_offered` (text) - Services offered
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `gmail_tokens`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, references auth.users) - User who owns this token
      - `email` (text) - Gmail email address
      - `access_token` (text) - OAuth access token
      - `refresh_token` (text) - OAuth refresh token
      - `token_expiry` (timestamptz) - When the access token expires
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `outlook_tokens`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, references auth.users) - User who owns this token
      - `email` (text) - Outlook email address
      - `access_token` (text) - OAuth access token
      - `refresh_token` (text) - OAuth refresh token
      - `token_expiry` (timestamptz) - When the access token expires
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `email_configurations`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, references auth.users) - User who owns this configuration
      - `name` (text) - Friendly name for the configuration
      - `email` (text) - Email address
      - `provider` (text) - Provider type (gmail, outlook, smtp_imap)
      - `is_connected` (boolean) - Connection status
      - `imap_host` (text) - IMAP server host
      - `imap_port` (integer) - IMAP server port
      - `imap_username` (text) - IMAP username
      - `imap_password` (text) - IMAP password (encrypted)
      - `password` (text) - Generic password field
      - `gmail_token_id` (uuid) - Reference to gmail_tokens
      - `outlook_token_id` (uuid) - Reference to outlook_tokens
      - `company_name` (text) - Company name
      - `activity_description` (text) - Business activity description
      - `services_offered` (text) - Services offered
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - Unique constraint: one configuration per user

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - All foreign keys reference auth.users with CASCADE delete

  3. Notes
    - All tables correctly reference auth.users(id)
    - Includes both OAuth token storage and traditional IMAP credentials
    - Company information can be stored in both profiles and email_configurations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  activity_description text,
  services_offered text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create gmail_tokens table
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on gmail_tokens
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for gmail_tokens
CREATE POLICY "Users can view own gmail tokens"
  ON gmail_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail tokens"
  ON gmail_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail tokens"
  ON gmail_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail tokens"
  ON gmail_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create outlook_tokens table
CREATE TABLE IF NOT EXISTS outlook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on outlook_tokens
ALTER TABLE outlook_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for outlook_tokens
CREATE POLICY "Users can view own outlook tokens"
  ON outlook_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outlook tokens"
  ON outlook_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outlook tokens"
  ON outlook_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outlook tokens"
  ON outlook_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create email_configurations table
CREATE TABLE IF NOT EXISTS email_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Configuration principale',
  email text NOT NULL,
  provider text NOT NULL DEFAULT 'smtp_imap',
  is_connected boolean NOT NULL DEFAULT false,
  imap_host text,
  imap_port integer DEFAULT 993,
  imap_username text,
  imap_password text,
  password text,
  gmail_token_id uuid REFERENCES gmail_tokens(id) ON DELETE SET NULL,
  outlook_token_id uuid REFERENCES outlook_tokens(id) ON DELETE SET NULL,
  company_name text,
  activity_description text,
  services_offered text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT email_configurations_user_id_key UNIQUE (user_id)
);

-- Enable RLS on email_configurations
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

-- Create indexes for faster lookups
CREATE INDEX idx_gmail_tokens_user_id ON gmail_tokens(user_id);
CREATE INDEX idx_outlook_tokens_user_id ON outlook_tokens(user_id);
CREATE INDEX idx_email_configurations_user_id ON email_configurations(user_id);
CREATE INDEX idx_email_configurations_provider ON email_configurations(provider);
