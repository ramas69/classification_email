/*
  # Create outlook_tokens table

  ## Purpose
  This migration creates a table to store Outlook OAuth tokens for users who connect
  their Microsoft/Outlook accounts using OAuth2 authentication.

  ## New Tables
  1. `outlook_tokens`
    - `id` (uuid, primary key) - Unique identifier for the token
    - `user_id` (uuid, foreign key, unique) - References auth.users, one Outlook account per user
    - `access_token` (text) - OAuth access token for API calls
    - `refresh_token` (text) - OAuth refresh token to get new access tokens
    - `token_expiry` (timestamptz) - When the access token expires
    - `email` (text) - The Outlook email address
    - `created_at` (timestamptz) - When the token was first created
    - `updated_at` (timestamptz) - When the token was last updated

  ## Security
  1. Enable RLS on `outlook_tokens` table
  2. Add policy for users to read their own tokens
  3. Add policy for users to insert their own tokens
  4. Add policy for users to update their own tokens
  5. Add policy for users to delete their own tokens

  ## Notes
  - Similar structure to gmail_tokens for consistency
  - One Outlook account per user (enforced by unique constraint on user_id)
*/

CREATE TABLE IF NOT EXISTS outlook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE outlook_tokens ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_outlook_tokens_user_id ON outlook_tokens(user_id);
