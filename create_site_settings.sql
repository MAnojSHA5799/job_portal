-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS public.site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Seed default AdSense rows
INSERT INTO public.site_settings (key, value) VALUES
  ('adsense_publisher_id',     ''),
  ('adsense_slot_job_list_1',  ''),
  ('adsense_slot_job_list_2',  ''),
  ('adsense_slot_job_list_3',  '')
ON CONFLICT (key) DO NOTHING;

-- Allow public read (for layout.tsx server fetch)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage site_settings"
  ON public.site_settings
  FOR ALL
  USING (true);
