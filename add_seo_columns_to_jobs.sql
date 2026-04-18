-- SQL script to add missing SEO and metadata columns to the jobs table

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS date_posted DATE DEFAULT CURRENT_DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS valid_through DATE DEFAULT (CURRENT_DATE + INTERVAL '60 days');
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS url_slug TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Refresh the schema cache (Supabase/PostgREST usually does this automatically, 
-- but sometimes a manual reload or waiting a few seconds is needed)
NOTIFY pgrst, 'reload schema';
