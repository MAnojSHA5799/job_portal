-- SQL script to add missing SEO and metadata columns to the companies table

ALTER TABLE companies ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS url_slug TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
