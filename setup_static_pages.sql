CREATE TABLE IF NOT EXISTS static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_static_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_static_pages_updated_at ON static_pages;

CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON static_pages
FOR EACH ROW
EXECUTE PROCEDURE update_static_pages_updated_at();

-- Disable Row Level Security so the app can read/write freely
ALTER TABLE static_pages DISABLE ROW LEVEL SECURITY;

-- Insert Default Content
INSERT INTO static_pages (page_slug, content)
VALUES (
  'about',
  '{
    "stats": [
      { "label": "Active Listings", "value": 500, "suffix": "k+", "color": "blue" },
      { "label": "Company Sources", "value": 12, "suffix": "k+", "color": "indigo" },
      { "label": "Real-time Updates", "value": 24, "suffix": "/7", "color": "amber" },
      { "label": "Accuracy Rate", "value": 98, "suffix": "%", "color": "emerald" }
    ],
    "mission": {
      "heading_line1": "Democratizing the",
      "heading_line2": "Future of Work.",
      "description": "The current job market is broken. Opportunities are scattered across thousands of hidden career pages. We built the world''s most advanced scraper to find them all.",
      "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
      "features": [
        { "title": "Direct-to-Source Integrity", "description": "We bypass middle-man job boards to connect you directly with official company hiring portals." },
        { "title": "Low-Latency Intelligence", "description": "Our scraper updates every hour, ensuring you''re among the first 1% to apply for new roles." }
      ]
    },
    "tech_stack": {
      "heading": "Our Technology DNA",
      "description": "We don''t just find jobs; we analyze and verify them at scale.",
      "items": [
        { "title": "Massive Crawling", "desc": "Our bots visit 10,000+ career websites every hour using distributed cloud infrastructure." },
        { "title": "Neural Data Extraction", "desc": "We use Large Language Models (LLMs) to structure chaotic job descriptions into clean, filterable data." },
        { "title": "Integrity Shield", "desc": "Our AI detects duplicates, scams, and expired roles before they ever reach your dashboard." }
      ]
    },
    "cta": {
      "heading": "Stop Searching.\\nStart Applying."
    }
  }'::jsonb
),
(
  'terms',
  '{
    "intro": "By accessing or using JobPortal, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.",
    "license": {
      "intro": "Our platform provides a service that aggregates job listings from across the web. Regarding the content found on JobPortal:",
      "points": [
        "Job listings are provided for personal, non-commercial transitory viewing only.",
        "We do not claim ownership of the original job descriptions scraped from third-party websites.",
        "You may not use automated systems or software to extract data from JobPortal for commercial purposes (\"screen scraping\") without our express written consent.",
        "Modification or copying of our proprietary aggregation algorithms or UI/UX components is strictly prohibited."
      ]
    },
    "disclaimer": {
      "intro": "While we strive for 100% accuracy, JobPortal aggregates content from dynamic external sources.",
      "accuracy": "The job listings on JobPortal are provided \"as is\". We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose. We do not warrant that the job descriptions, salary data, or company information are error-free or current."
    },
    "limitations": {
      "text": "In no event shall JobPortal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform, even if we have been notified of the possibility of such damage.",
      "governing_law": "These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location."
    }
  }'::jsonb
),
(
  'privacy',
  '{
    "introduction": "At JobPortal, we believe in transparency and the ethical use of data. This Privacy Policy describes how we collect, use, and process information on our platform. As a job aggregation service, our primary goal is to provide users with access to publicly available career opportunities while respecting the intellectual property of original publishers and the privacy of our users.",
    "data_collection": {
      "intro": "Our platform operates as a specialized search engine and aggregator for career opportunities. We collect job-related data through:",
      "points": [
        { "title": "Public Portals", "desc": "Scraping official company websites to index active roles." },
        { "title": "Partnerships", "desc": "XML feeds and API integrations with verified employers." },
        { "title": "Job Boards", "desc": "Aggregating links from major professional networks." },
        { "title": "AI Refinement", "desc": "Parsing unstructured text to present clean metadata." }
      ],
      "note": "Note: We always provide direct attribution and links to the original source. We do not store full copies of job descriptions beyond what is necessary for search indexing."
    },
    "user_data": {
      "intro": "When you create an account or use our platform, we may collect:",
      "points": [
        { "title": "Account Information", "desc": "Full name, email address, and professional interests to provide personalized job alerts." },
        { "title": "Usage Data", "desc": "Your search queries, saved jobs, and interaction history to improve our AI recommendation engine." },
        { "title": "Device Data", "desc": "IP address, browser type, and operating system for security and analytics purposes." }
      ]
    },
    "security": {
      "intro": "We never sell your personal data to third parties. Your information is only shared with:",
      "tags": ["Employers", "Service Providers", "Legal Authorities"],
      "standards": "We implement industry-standard encryption (SSL/TLS) for all data in transit and use hashed storage for sensitive credentials. Our scraping infrastructure follows robots.txt guidelines to ensure ethical interactions with source websites."
    },
    "rights": {
      "intro": "You have the right to access, correct, or delete your personal data at any time. You can manage your notification preferences in your account settings or request a full data export by contacting our support team.",
      "contact_email": "privacy@jobportal.in"
    }
  }'::jsonb
)
ON CONFLICT (page_slug) DO UPDATE SET content = EXCLUDED.content;
