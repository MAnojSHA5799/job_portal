-- SQL for creating the banners table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional: Enable Row Level Security (RLS)
-- ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read active banners
-- CREATE POLICY "Public can read active banners" ON banners
--   FOR SELECT USING (is_active = true);

-- Policy: Allow only authenticated admins to manage banners
-- CREATE POLICY "Admins can manage banners" ON banners
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
