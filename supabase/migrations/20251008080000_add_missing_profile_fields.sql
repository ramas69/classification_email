/*
  # Add missing profile fields

  1. Changes
    - Add `activity_description` column to store business activity description
    - Add `services_offered` column to store list of services offered by the company
    - Add `smtp_username` column to store SMTP authentication username
    - Add `smtp_password` column to store SMTP authentication password (encrypted)
    - Add `imap_username` column to store IMAP authentication username
    - Add `imap_password` column to store IMAP authentication password (encrypted)

  2. Security
    - Password fields are stored as text (should be encrypted at application level)
    - All new fields are nullable to support gradual migration
*/

DO $$
BEGIN
  -- Add activity_description if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'activity_description'
  ) THEN
    ALTER TABLE profiles ADD COLUMN activity_description text;
  END IF;

  -- Add services_offered if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'services_offered'
  ) THEN
    ALTER TABLE profiles ADD COLUMN services_offered text;
  END IF;

  -- Add smtp_username if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'smtp_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN smtp_username text;
  END IF;

  -- Add smtp_password if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'smtp_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN smtp_password text;
  END IF;

  -- Add imap_username if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'imap_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN imap_username text;
  END IF;

  -- Add imap_password if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'imap_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN imap_password text;
  END IF;
END $$;
