-- Add faqs column to blogs table
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
