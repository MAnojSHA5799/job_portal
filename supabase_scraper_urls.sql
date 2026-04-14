-- SQL for creating the scraper_urls table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scraper_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (Optional but recommended)
-- ALTER TABLE scraper_urls ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to manage scraper_urls (if RLS is enabled)
-- CREATE POLICY "Admins can manage scraper_urls" ON scraper_urls
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
