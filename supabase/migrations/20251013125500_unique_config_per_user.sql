/*
  # Enforce single configuration per user

  Adds a unique constraint on email_configurations(user_id)
*/

-- Drop existing duplicates by keeping the most recent per user
WITH ranked AS (
  SELECT id, user_id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
  FROM email_configurations
)
DELETE FROM email_configurations ec
USING ranked r
WHERE ec.id = r.id AND r.rn > 1;

-- Add the unique constraint (if not exists pattern)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_configurations_user_id_key'
  ) THEN
    ALTER TABLE email_configurations
      ADD CONSTRAINT email_configurations_user_id_key UNIQUE (user_id);
  END IF;
END $$;


