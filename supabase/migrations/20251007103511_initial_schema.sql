/*
  # Initial Schema for Hall IA Email Management

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `company_name` (text)
      - `smtp_host` (text, encrypted email server settings)
      - `smtp_port` (integer)
      - `imap_host` (text)
      - `imap_port` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text, category name)
      - `description` (text)
      - `color` (text, hex color for UI)
      - `auto_reply_enabled` (boolean)
      - `reply_template` (text)
      - `created_at` (timestamptz)
    
    - `emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category_id` (uuid, references email_categories)
      - `sender_email` (text)
      - `sender_name` (text)
      - `subject` (text)
      - `body` (text)
      - `received_at` (timestamptz)
      - `is_read` (boolean)
      - `ai_suggested_reply` (text)
      - `reply_sent` (boolean)
      - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Profiles are private to each user
    - Email categories and emails are private to each user
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  company_name text,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  imap_host text,
  imap_port integer DEFAULT 993,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

-- Create email_categories table
CREATE TABLE IF NOT EXISTS email_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#EF6855',
  auto_reply_enabled boolean DEFAULT false,
  reply_template text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON email_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON email_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON email_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON email_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES email_categories(id) ON DELETE SET NULL,
  sender_email text NOT NULL,
  sender_name text,
  subject text NOT NULL,
  body text NOT NULL,
  received_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false,
  ai_suggested_reply text,
  reply_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emails"
  ON emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_categories_user_id ON email_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_category_id ON emails(category_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);