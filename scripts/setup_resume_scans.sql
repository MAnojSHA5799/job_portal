-- Create a table for storing resume scans
create table if not exists resume_scans (
  id uuid default gen_random_uuid() primary key,
  file_url text,
  resume_text text,
  ats_score numeric,
  analysis_result jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table resume_scans enable row level security;

-- Create policies (Public can insert, Admin can view)
create policy "Anyone can insert scans" on resume_scans for insert with check (true);
create policy "Admins can view all scans" on resume_scans for select using (true); -- Assuming public read for now, can be restricted later
