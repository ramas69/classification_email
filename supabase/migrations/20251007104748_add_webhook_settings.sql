/*
  # Add webhook settings table

  1. New Tables
    - `webhook_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Reference to auth.users
      - `n8n_webhook_url` (text) - N8N webhook URL
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `webhook_settings` table
    - Add policy for users to read their own webhook settings
    - Add policy for users to insert their own webhook settings (only if they don't have one)
    - Add policy for users to update their own webhook settings
  
  3. Constraints
    - Only one webhook configuration per user (unique constraint on user_id)
*/

CREATE TABLE IF NOT EXISTS webhook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  n8n_webhook_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE webhook_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook settings"
  ON webhook_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhook settings"
  ON webhook_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook settings"
  ON webhook_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
