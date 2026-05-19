-- SQL migration to add media_link column to the jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS media_link TEXT;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
