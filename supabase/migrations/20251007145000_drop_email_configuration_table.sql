/*
  # Drop email_configuration table

  1. Changes
    - Drop the `email_configuration` table and all associated policies

  2. Security
    - Remove all RLS policies associated with this table
*/

DROP TABLE IF EXISTS email_configuration CASCADE;
