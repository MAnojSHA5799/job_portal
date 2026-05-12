-- SQL script to add media columns to the jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
