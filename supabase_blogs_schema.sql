-- SQL for creating the blogs table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (Optional but recommended)
-- ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read published blogs
-- CREATE POLICY "Public can read published blogs" ON blogs
--   FOR SELECT USING (is_published = true);

-- Policy: Allow only admins to manage blogs
-- CREATE POLICY "Admins can manage blogs" ON blogs
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
