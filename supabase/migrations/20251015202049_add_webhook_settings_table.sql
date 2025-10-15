/*
  # Add webhook_settings table

  1. New Tables
    - `webhook_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, references auth.users) - User who owns this webhook
      - `n8n_webhook_url` (text) - The n8n webhook URL
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `webhook_settings` table
    - Add policies for authenticated users to manage their own webhook settings
    - Unique constraint: one webhook setting per user

  3. Notes
    - Foreign key references auth.users(id) with CASCADE delete
*/

-- Create webhook_settings table
CREATE TABLE IF NOT EXISTS webhook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  n8n_webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT webhook_settings_user_id_key UNIQUE (user_id)
);

-- Enable RLS on webhook_settings
ALTER TABLE webhook_settings ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_settings
CREATE POLICY "Users can view own webhook settings"
  ON webhook_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhook settings"
  ON webhook_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook settings"
  ON webhook_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhook settings"
  ON webhook_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_webhook_settings_user_id ON webhook_settings(user_id);
