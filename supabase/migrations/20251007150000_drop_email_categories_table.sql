/*
  # Drop email_categories table

  1. Changes
    - Drop the `email_categories` table and all its data
    - This will automatically remove foreign key constraints from the `emails` table

  2. Impact
    - All email category data will be permanently deleted
    - The `emails.category_id` column will remain but can be NULL
    - Indexes related to email_categories will be removed

  3. Notes
    - Uses CASCADE to drop all dependent objects
    - Uses IF EXISTS to prevent errors if table doesn't exist
*/

DROP TABLE IF EXISTS email_categories CASCADE;
