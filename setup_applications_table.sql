-- Create the job_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert an application (Public access for applying)
CREATE POLICY "Enable insert for all users" ON public.job_applications
    FOR INSERT WITH CHECK (true);

-- Allow anyone to select applications (For the Admin Dashboard using anon key)
-- NOTE: In a production app, you should restrict this to authenticated admins only.
CREATE POLICY "Enable select for all users" ON public.job_applications
    FOR SELECT USING (true);

-- Allow anyone to update applications (For the Admin Dashboard status updates)
CREATE POLICY "Enable update for all users" ON public.job_applications
    FOR UPDATE USING (true);

-- Allow anyone to delete applications
CREATE POLICY "Enable delete for all users" ON public.job_applications
    FOR DELETE USING (true);
