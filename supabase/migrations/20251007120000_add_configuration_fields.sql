/*
  # Add Configuration Fields to Profiles

  1. Changes
    - Add `email_password` field to store encrypted email password
    - Add `activity_description` field to store company activity description
    - Add `services` field to store company services
    - Add `is_configured` field to track if configuration is complete
    - Add `is_active` field to track if the workflow is activated

  2. Security
    - All fields respect existing RLS policies on profiles table
    - Password stored encrypted (application layer encryption recommended)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_password text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'activity_description'
  ) THEN
    ALTER TABLE profiles ADD COLUMN activity_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'services'
  ) THEN
    ALTER TABLE profiles ADD COLUMN services text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_configured'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_configured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT false;
  END IF;
END $$;
