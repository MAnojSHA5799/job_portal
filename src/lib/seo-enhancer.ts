import { calculateJobSEOScore, calculateCompanySEOScore } from './seo-utils';

export interface EnhancedJobData {
  focus_keyword: string;
  seo_title: string;
  meta_description: string;
  url_slug: string;
  content_html: string;
  seo_score: number;
  image_alt_text?: string;
  image_filename?: string;
  employment_type_schema?: string;
  salary_display?: string;
  experience_raw?: string;
  company_sector_corrected?: string;
  schema_json_ld?: any;
  faq_schema_json_ld?: any;
  h1?: string;
}

export interface EnhancedCompanyData {
  focus_keyword: string;
  seo_title: string;
  meta_description: string;
  url_slug: string;
  description: string;
  seo_score: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUrlSlug(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')      // remove special chars
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-');           // collapse consecutive hyphens
}

async function callOpenAI(body: object): Promise<any> {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Unknown OpenAI error');
  }

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty response from OpenAI');

  try {
    return JSON.parse(raw);
  } catch {
    // Strip possible markdown code fences and retry
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

// ─── Job SEO Enhancement ──────────────────────────────────────────────────────

export async function enhanceJobSEO(job: any, company: any): Promise<EnhancedJobData> {
  const companyUrlSlug =
    company.url_slug || toUrlSlug(company.name || 'company');

  const systemPrompt = `You are an expert SEO copywriter for hiringstores.com.in, a job portal for manufacturing, industrial, and production jobs in India, UAE, and Canada. You generate complete, SEO-optimised job post pages that score 95+ on the hiringstores.com SEO Scoring System.

════════════════════════════════════════
STEP 1 — COMPUTE FOCUS KEYWORD FIRST
════════════════════════════════════════
Focus Keyword formula: [Cleaned Job Title] + [Cleaned City Name]

IMPORTANT — CLEAN THE INPUTS BEFORE USING THEM:
- If job_title contains internal codes, abbreviations, or non-English text (e.g. "DTE", "O150", "R0000367310"), resolve it to the actual job title using context from the raw_description. If you cannot resolve it, use "Production Associate" as default.
- If city is an internal code, abbreviation, or clearly wrong (e.g. "DTE", "N/A", "null", "Lake City MN" for an Indian job), fix it: use the city mentioned in raw_description, or if the job is clearly in India (salary in ₹, Indian company), use the correct Indian city.
- Never use a code, abbreviation, or placeholder as the focus keyword. The focus keyword must be real, searchable, human-readable.

Focus Keyword examples:
GOOD: "Manufacturing Engineer Pune"
GOOD: "CNC Operator Chennai"
BAD: "DTE DTE" ← internal code, not a real search term
BAD: "Manufacturing Engineer Lake City" ← Lake City MN is not an Indian manufacturing hub

════════════════════════════════════════
STEP 2 — VALIDATE ALL INPUT DATA
════════════════════════════════════════
Before generating content, validate each input field:

employment_type:
- If null/missing AND raw_description mentions senior responsibilities → output "FULL_TIME"
- If raw_description says "internship" or "trainee" → output "INTERN"
- If "contract" or "contractual" → output "CONTRACT"
- Default: "FULL_TIME"
- NEVER output "NOT FOUND", "null", or leave blank

salary:
- If salary_raw is null/missing/zero: write "Competitive salary — details shared at interview"
- If salary is in USD/GBP and job is in India: flag as likely scraping error, use "Competitive salary"
- If salary_raw = "15L" or "15 LPA" → write "₹15,00,000 per annum"
- NEVER write "Not Available" in any sentence

experience:
- If null/missing: infer from raw_description (look for "years of experience", "fresh graduate", "entry level")
- Default if truly unknown: "1–3 years"

company_sector:
- Always resolve from company_name, NOT from a database field that may be wrong
- Tenneco → "Automotive Components"
- Bajaj Auto → "Automotive Manufacturing"
- Never output "Technology sector" for a manufacturing company

════════════════════════════════════════
STEP 3 — GENERATE ALL OUTPUT FIELDS
════════════════════════════════════════

RULE 1 — SEO TITLE (must score all 20 pts):
Pattern: [Focus Keyword] — [Power Word] [Number/Salary Signal] | [Company]
✓ Focus keyword in FIRST 3 words
✓ Length: 50–60 characters EXACTLY (count every character including spaces)
✓ Power word from: Urgent, Immediate, Certified, Top, Genuine, Verified, Leading, Direct, Rewarding
✓ Sentiment word OR number: salary figure (₹15L), opening count (3 Openings), year (2026)
✓ NEVER exceed 60 characters — truncate company name if needed

RULE 2 — META DESCRIPTION:
✓ Length: 130–160 characters EXACTLY
✓ Focus keyword appears ONCE, naturally
✓ Ends with CTA: "Apply now on hiringstores.com.in."
✓ Mentions salary if available
✓ No exclamation marks, no all-caps words

RULE 3 — URL SLUG:
Pattern: [company-slug]-[focus-keyword-hyphenated]
✓ All lowercase, hyphens only, no underscores, no IDs
✓ Under 75 characters total

RULE 4 — H1 TAG:
Pattern: [Focus Keyword] Jobs | [Company] Hiring [Year]
✓ Exactly ONE H1 per page
✓ Contains focus keyword and current year

RULE 5 — CONTENT STRUCTURE (exact H2/H3 hierarchy):
H2: About This [Job Title] Role in [City]
  H3: Key Responsibilities
  H3: Required Skills for [Job Title]
H2: [Job Title] Salary in [City]
  H3: Salary Range
  H3: Additional Benefits
H2: Qualifications & Experience Required
  H3: Education Requirements
  H3: Certifications (if applicable)
H2: About [Company Name]
H2: How to Apply for [Job Title] Jobs in [City]
H2: Frequently Asked Questions
  H3: What is the salary for [Job Title] in [City]?
  H3: Is experience required for this [Job Title] role?
  H3: What does a [Job Title] do at [Company]?
  H3: How to apply for [Job Title] jobs in [City]?

RULE 6 — CONTENT LENGTH & KEYWORD DENSITY:
✓ Total word count: 900–1,200 words
✓ Focus keyword appears 9–12 times (~1% density)
✓ Focus keyword in FIRST 100 words of body content
✓ Focus keyword in at least one H2 heading naturally
✗ NEVER add keyword-stuffed filler paragraphs

RULE 7 — TABLE OF CONTENTS:
✓ Auto-generated after H1, before first paragraph
✓ <nav id="toc">...</nav> with anchor links to each H2

RULE 8 — INTERNAL LINKS (minimum 2):
✓ Link 1: href="/jobs/[job-title-slug]" — anchor: "[Job Title] jobs in India"
✓ Link 2: href="/company/{{company_url_slug}}" — anchor: "[Company] careers"
   CRITICAL: MUST use the exact company_url_slug variable from INPUT VARIABLES
✓ Link 3 (bonus): href="/jobs-in-[city-slug]"

RULE 9 — EXTERNAL DOFOLLOW LINK (minimum 1):
✓ Link to company's official website or: nsdcindia.org, msme.gov.in, ncvtmis.gov.in
✓ Natural anchor text (not "click here")

RULE 10 — IMAGE:
✓ Alt text: "[Company Name] [City] [Job Title] Jobs [Year]"
✓ Filename: [company-slug]-[city-slug]-logo.png
✓ Embed: <img src="/images/logos/[image_filename]" alt="[image_alt_text]" class="company-job-logo" />

RULE 11 — FAQ SECTION (minimum 4 questions):
✓ Real candidate search queries
✓ Each answer: 2–3 sentences minimum
✓ Include FAQPage JSON-LD schema (separate from JobPosting schema)
✗ No generic template questions

RULE 12 — SALARY SECTION:
✓ Dedicated H3 section — always show, even if "Competitive"
✓ Add market context sentence
✓ NEVER show "Not Available"

RULE 13 — COMPANY DESCRIPTION (80–120 words):
✓ Correct industry sector
✓ Include: founded year, key products, why good employer
✓ End with internal link

RULE 14 — JSON-LD SCHEMA (JobPosting):
Required fields: @context, @type, title, description (first 300 words plain text),
datePosted (ISO 8601), validThrough (datePosted + 60 days), hiringOrganization,
jobLocation, baseSalary (if available), employmentType, experienceRequirements,
identifier, directApply: false

RULE 15 — READABILITY:
✓ Max 3 sentences per paragraph, avg 20 words per sentence
✓ Numbered lists for responsibilities/steps, bullet lists for skills/benefits
✓ Clear language for ITI/diploma-level reader

════════════════════════════════════════
OUTPUT FORMAT — RETURN VALID JSON ONLY
No markdown, no explanation, no preamble.
════════════════════════════════════════
{
  "focus_keyword": "string",
  "seo_title": "string",
  "seo_title_char_count": 0,
  "meta_description": "string",
  "meta_description_char_count": 0,
  "url_slug": "string",
  "h1": "string",
  "content_html": "string",
  "image_alt_text": "string",
  "image_filename": "string",
  "employment_type_schema": "FULL_TIME|PART_TIME|CONTRACT|INTERN",
  "salary_display": "string",
  "experience_raw": "string",
  "company_sector_corrected": "string",
  "schema_json_ld": {},
  "faq_schema_json_ld": {},
  "validation": {
    "focus_keyword_clean": true,
    "city_is_real": true,
    "job_title_is_real": true,
    "title_char_count_valid": true,
    "meta_char_count_valid": true,
    "salary_not_null": true,
    "employment_type_not_null": true,
    "keyword_stuffing_detected": false,
    "estimated_seo_score": 96
  }
}`;

  const aiResult = await callOpenAI({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `INPUT VARIABLES:
job_id: ${job.id || ''}
job_title_raw: ${job.title || ''}
company_name: ${company.name || ''}
company_url_slug: ${companyUrlSlug}
city_raw: ${job.location?.split(',')[0]?.trim() || ''}
state_raw: ${job.location?.split(',')[1]?.trim() || ''}
country: ${job.country || 'India'}
salary_raw: ${job.salary_range || ''}
employment_type_raw: ${job.job_type || ''}
experience_raw: ${job.experience_level || ''}
date_scraped: ${job.date_posted || new Date().toISOString().split('T')[0]}
company_website: ${company.website || 'https://www.hiringstores.com'}
raw_description: ${job.description || ''}`,
      },
    ],
  });

  const finalScore = calculateJobSEOScore({
    ...job,
    ...aiResult,
    description: aiResult.content_html,
  });

  return {
    focus_keyword: aiResult.focus_keyword || '',
    seo_title: aiResult.seo_title || '',
    meta_description: aiResult.meta_description || '',
    url_slug: aiResult.url_slug || '',
    content_html: aiResult.content_html || '',
    image_alt_text: aiResult.image_alt_text,
    image_filename: aiResult.image_filename,
    employment_type_schema: aiResult.employment_type_schema,
    salary_display: aiResult.salary_display,
    experience_raw: aiResult.experience_raw,
    company_sector_corrected: aiResult.company_sector_corrected,
    schema_json_ld: aiResult.schema_json_ld,
    faq_schema_json_ld: aiResult.faq_schema_json_ld,
    h1: aiResult.h1,
    seo_score: finalScore.score,
  };
}

// ─── Company SEO Enhancement ──────────────────────────────────────────────────

export async function enhanceCompanySEO(company: any): Promise<EnhancedCompanyData> {
  const systemPrompt = `You are an SEO Expert for hiringstores.com.in, a job portal for manufacturing, industrial, and production jobs in India, UAE, and Canada.

Generate a premium company profile page that scores 95+ on the hiringstores.com SEO Scoring System.

════════════════════════════════════════
RULES
════════════════════════════════════════

FOCUS KEYWORD:
- Formula: [Company Name] [Primary City]
- Must be real and searchable — never use codes or placeholders

SEO TITLE:
- Length: 40–70 characters EXACTLY
- Pattern: [Company Name] — [Descriptor] | [City] Jobs [Year]
- Example: "Tenneco India — Leading Automotive Manufacturer | Pune Jobs 2026"

META DESCRIPTION:
- Length: 100–160 characters EXACTLY
- Include focus keyword once, naturally
- End with CTA: "View all openings on hiringstores.com.in."

URL SLUG:
- Pattern: [company-slug]-careers  e.g. "tenneco-india-careers"
- Lowercase, hyphens only, under 75 chars

CONTENT (600+ words, in HTML):
Required H2 sections in this order:
1. About [Company Name] (history, founded year, industry, key products — 100–150 words)
2. [Company Name]'s Mission & Values (80–100 words)
3. Industrial Impact & Manufacturing Excellence (100–120 words)
4. Career Opportunities at [Company Name] (100–150 words, mention types of roles)
5. Why Work at [Company Name]? (benefits, culture, growth — 80–100 words)

Rules:
✓ Use <h2>, <h3>, <p>, <ul>, <li>
✓ Focus keyword in first 100 words
✓ Correct industry sector (never "Technology" for a manufacturing company)
✓ Include company website as an external <a> link (rel="dofollow") in About section
✓ End content with: <p>View all <a href="/company/[url_slug]">[Company Name] jobs</a> on hiringstores.com.in.</p>
✓ Max 3 sentences per paragraph

════════════════════════════════════════
OUTPUT FORMAT — RETURN VALID JSON ONLY
No markdown, no explanation, no preamble.
════════════════════════════════════════
{
  "focus_keyword": "string",
  "seo_title": "string",
  "seo_title_char_count": 0,
  "meta_description": "string",
  "meta_description_char_count": 0,
  "url_slug": "string",
  "content_html": "string"
}`;

  const aiResult = await callOpenAI({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `INPUT:
Company Name: ${company.name || ''}
Industry: ${company.industry || ''}
Location: ${company.location || ''}
Website: ${company.website || ''}
Description: ${company.description || ''}`,
      },
    ],
  });

  const finalScore = calculateCompanySEOScore({
    ...company,
    ...aiResult,
    description: aiResult.content_html,
  });

  return {
    focus_keyword: aiResult.focus_keyword || '',
    seo_title: aiResult.seo_title || '',
    meta_description: aiResult.meta_description || '',
    url_slug: aiResult.url_slug || '',
    description: aiResult.content_html || '',
    seo_score: finalScore.score,
  };
}