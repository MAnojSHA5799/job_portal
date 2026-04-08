# 🗄️ Supabase Database Setup

Follow these steps to create all the necessary tables for your Job Portal.

### Step 1: Open Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click on the **SQL Editor** icon in the left sidebar (it looks like a `>_` symbol).

### Step 2: Paste and Run the SQL
1. Click **New query**.
2. Copy the entire SQL block below and paste it into the editor.
3. Click **Run** at the bottom right.

```sql
-- 1. Create Companies Table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Create Jobs Table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_range TEXT,
  job_type TEXT DEFAULT 'Full-time',
  experience_level TEXT,
  category TEXT,
  apply_link TEXT,
  source_url TEXT,
  seo_score INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Create Sources Table
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_scrape TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. Create Scraper Logs Table
CREATE TABLE scraper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id),
  status TEXT NOT NULL, -- 'success', 'failed'
  jobs_found INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. Create Salary Stats Table
CREATE TABLE salary_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT NOT NULL,
  location TEXT NOT NULL,
  min_salary NUMERIC,
  avg_salary NUMERIC,
  max_salary NUMERIC,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

### Step 3: Enable Email/Password Auth
1. Go to **Authentication** -> **Providers**.
2. Ensure **Email** is "Enabled".
3. Disable "Confirm Email" if you want users to log in immediately without verifying their email address (recommended for rapid development).

---

### 🛡️ Admin Access
Once you've created your first account, go to **Authentication** -> **Users** in Supabase. Any user you register can be an admin by adding `"role": "admin"` to their **User Metadata**, or I can set it up in the code to automatically treat specific emails as admins.

### 🧪 Step 4: Add Sample Data (Optional)
If you want to see the dashboard in action immediately, run this SQL in the Editor after the tables are created:

```sql
-- 1. Insert a Sample Company
INSERT INTO companies (name, industry, location, website)
VALUES ('TechCorp', 'Software', 'San Francisco, CA', 'https://techcorp.com');

-- 2. Insert a Sample Job
INSERT INTO jobs (title, company_id, description, location, salary_range, category, is_approved)
SELECT 
  'Senior Frontend Engineer', 
  id, 
  'We are looking for a React expert...', 
  'Remote', 
  '$140k - $180k', 
  'Engineering',
  true
FROM companies WHERE name = 'TechCorp' LIMIT 1;
```
