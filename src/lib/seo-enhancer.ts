import { calculateSEOScore } from './seo-utils';

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
  company_sector_corrected?: string;
  schema_json_ld?: any;
  faq_schema_json_ld?: any;
}

export interface EnhancedCompanyData {
  focus_keyword: string;
  seo_title: string;
  meta_description: string;
  url_slug: string;
  description: string;
  seo_score: number;
}

export async function enhanceJobSEO(job: any, company: any): Promise<EnhancedJobData> {
  const prompt = `You are an expert SEO copywriter for hiringstores.com.in, a job portal for manufacturing, industrial, and production jobs in India, UAE, and Canada. You generate complete, SEO-optimised job post pages that score 95+ on the hiringstores.com SEO Scoring System.

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

GOOD: "Manufacturing Engineer Pune — 3 Urgent Openings | Tenneco" (57 chars ✓)
BAD:  "Manufacturing Engineer Lake City - Urgent Great ₹15L Salary" (60 chars but "Lake City" is wrong location ✗)
BAD:  "DTE Jobs in DTE | Bajaj Auto Hiring 2026" ← "DTE" is not a real job title ✗

RULE 2 — META DESCRIPTION (must score all 10 pts):
✓ Length: 130–160 characters EXACTLY — count them
✓ Focus keyword appears ONCE, naturally
✓ Ends with CTA: "Apply now on hiringstores.com.in." OR "View openings on hiringstores.com.in." OR "Check salary and apply."
✓ Mentions salary if available
✓ NEVER mention "hiringstores.com.in" brand if the actual website domain is hiringstores.com — use the correct domain
✓ No exclamation marks, no all-caps words in meta description

GOOD (157 chars): "Looking for Manufacturing Engineer Pune jobs? Tenneco is hiring now. Salary: ₹15L per annum. 3+ years experience required. Apply now on hiringstores.com.in."
BAD: "Join as a Manufacturing Engineer Lake City with a rewarding ₹15L salary package. Lucrative opportunities await. Apply now on hiringstores.com.in." ← wrong city, no experience info

RULE 3 — URL SLUG (must score all 15 pts):
Pattern: [focus-keyword-hyphenated]
✓ Focus keyword is first segment
✓ All lowercase, hyphens only, no underscores, no IDs, no special characters
✓ Under 75 characters total
✓ If duplicate: append company slug (e.g. manufacturing-engineer-pune-tenneco)

GOOD: "manufacturing-engineer-pune"
BAD:  "dte-dte" ← internal code
BAD:  "manufacturing-engineer-lake-city" ← wrong/placeholder city

RULE 4 — H1 TAG:
Pattern: [Focus Keyword] Jobs | [Company] Hiring [Year]
✓ Exactly ONE H1 per page
✓ Contains focus keyword
✓ Contains year (current year)
✓ NEVER use the H1 as a second heading inside the content — the page template renders H1 once at the top

GOOD: "Manufacturing Engineer Pune Jobs | Tenneco Hiring 2026"
BAD:  "Manufacturing Engineer Lake City | Tenneco Hiring 2026" ← wrong city
BAD:  "DTE Jobs in DTE | Bajaj Auto Hiring 2026" ← code as title

RULE 5 — CONTENT STRUCTURE (must follow EXACT heading hierarchy):
Use this exact H2/H3 structure — no deviations:

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
✓ Focus keyword appears 9–12 times (density ~1%)
✓ Focus keyword in FIRST 100 words of body content
✓ Focus keyword in at least one H2 heading naturally
✓ No keyword stuffing — keyword in bold at end of page is FORBIDDEN
✗ NEVER add a paragraph like "Seeking a [keyword]? This [keyword] role is perfect..." — this is spam

RULE 7 — TABLE OF CONTENTS:
✓ Auto-generated after H1, before first paragraph
✓ Anchor links to each H2 section using IDs
✓ HTML structure:
<nav id="toc"><ul>...</ul></nav>

✓ Include: About Role, Salary, Qualifications, About Company, How to Apply, FAQ

RULE 8 — INTERNAL LINKS (minimum 2):
✓ Link 1: category page anchor text = "[Job Title] jobs in India"
href = "/jobs/[job-title-slug]"
✓ Link 2: company page anchor text = "[Company] careers"
href = "/company/[company-slug]"
✓ Link 3 (bonus): related location page
href = "/jobs-in-[city-slug]"

RULE 9 — EXTERNAL DOFOLLOW LINK (minimum 1):
✓ Link to company's official website (rel="dofollow" — default, do not add nofollow)
✓ OR link to: NSDC (nsdcindia.org), MSME portal (msme.gov.in), NCVT (ncvtmis.gov.in)
✓ Anchor text must be natural, not "click here"

RULE 10 — IMAGE ALT TEXT:
✓ Alt text pattern: "[Company Name] [City] [Job Title] Jobs [Year]"
✓ Image filename pattern: [company-slug]-[city-slug]-logo.png
✓ NEVER alt="" or alt="logo" or alt="image"

RULE 11 — FAQ SECTION (minimum 4 questions — not 2):
✓ Questions must be real search queries a candidate would Google
✓ Each answer: 2–3 sentences minimum
✓ Question topics: salary, experience, qualifications, location/remote, company culture
✓ Include FAQPage JSON-LD schema for the FAQ section (separate from JobPosting schema)
✗ NEVER use generic template questions like "Where is this job located?" or "What is required experience?"

RULE 12 — SALARY SECTION:
✓ Always show salary in a dedicated H3 section — even if "Competitive"
✓ If salary_raw is available: show as "₹[X] per annum" or "₹[min]–₹[max] per month"
✓ Add market context: "The average [Job Title] salary in [City] is ₹[range] based on industry data"
✓ NEVER show "Not Available" as the salary in any section
✓ In "Salary & Benefits" section from template: replace "Not Available" with computed salary string

RULE 13 — COMPANY DESCRIPTION:
✓ Write 80–120 words about the company in your own words
✓ Include: industry sector (correct one, not "Technology"), founded year if known, key products/services, why good employer
✓ NEVER call a manufacturing/automotive company a "Technology sector" company
✓ End with: "View all [Company] jobs on hiringstores.com.in." with internal link

RULE 14 — JSON-LD SCHEMA (JobPosting — all required fields):
Output complete JSON-LD with:
- @context, @type: "JobPosting"
- title: cleaned job title (NOT internal code)
- description: first 300 words of content_html (plain text, no HTML tags)
- datePosted: ${job.created_at || new Date().toISOString()} in ISO 8601 format
- validThrough: ${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()} in ISO 8601 format
- hiringOrganization: { @type: "Organization", name: "${company.name}", sameAs: "${company.website || ''}" }
- jobLocation: { @type: "Place", address: { addressLocality: "${job.location?.split(',')[0] || ''}", addressRegion: "${job.location?.split(',')[1] || ''}", addressCountry: "IN" } }
- baseSalary: include if salary_raw is not null (currency: "INR", unitText: "MONTH" or "YEAR")
- employmentType: validated type from Step 2
- experienceRequirements: from raw_description or default
- identifier: { @type: "PropertyValue", name: "hiringstores.com Job ID", value: "${job.id || 'N/A'}" }
- directApply: false

RULE 15 — READABILITY:
✓ Max 3 sentences per paragraph
✓ Max 20 words per sentence average
✓ Use numbered lists for responsibilities and steps
✓ Use bullet lists for skills and benefits
✓ Write at reading level of an ITI/diploma graduate — clear, simple, no corporate jargon
✓ Paragraphs flow naturally — no repeated keyword-stuffed sentences at the end

════════════════════════════════════════
OUTPUT FORMAT — RETURN VALID JSON ONLY
════════════════════════════════════════
Return a single valid JSON object. No markdown. No explanation. No preamble.

{
"focus_keyword": "string",
"seo_title": "string",
"seo_title_char_count": number,
"meta_description": "string",
"meta_description_char_count": number,
"url_slug": "string",
"h1": "string",
"content_html": "string",
"image_alt_text": "string",
"image_filename": "string",
"employment_type_schema": "string",
"salary_display": "string",
"company_sector_corrected": "string",
"schema_json_ld": { },
"faq_schema_json_ld": { },
"validation": {
"focus_keyword_clean": true,
"city_is_real": true,
"job_title_is_real: true,
"title_char_count_valid": true,
"meta_char_count_valid": true,
"salary_not_null": true,
"employment_type_not_null": true,
"keyword_stuffing_detected": false,
"estimated_seo_score": 96
}
}`;

  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `INPUT VARIABLES:
job_id: ${job.id || ''}
job_title_raw: ${job.title || ''}
company_name: ${company.name || ''}
city_raw: ${job.location?.split(',')[0] || ''}
state_raw: ${job.location?.split(',')[1] || ''}
country: ${job.country || 'India'}
salary_raw: ${job.salary_range || ''}
employment_type_raw: ${job.job_type || ''}
experience_raw: ${job.experience_level || ''}
date_scraped: ${new Date().toISOString()}
company_website: ${company.website || ''}
raw_description: ${job.description || ''}`
        }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const aiResult = JSON.parse(data.choices[0].message.content);

  const finalScore = calculateSEOScore({
    ...job,
    seo_title: aiResult.seo_title,
    meta_description: aiResult.meta_description,
    description: aiResult.content_html,
    content_html: aiResult.content_html,
    focus_keyword: aiResult.focus_keyword,
    url_slug: aiResult.url_slug
  });

  return {
    ...aiResult,
    seo_score: finalScore.score
  };
}

export async function enhanceCompanySEO(company: any): Promise<EnhancedCompanyData> {
  const prompt = `You are an expert SEO copywriter for Gethyrd.in, a job portal for manufacturing, industrial, and production jobs. You generate complete, SEO-optimised company profile pages that score 95+ on the Gethyrd SEO Scoring System. ════════════════════════════════════════ STEP 1 — COMPUTE FOCUS KEYWORD FIRST ════════════════════════════════════════ Focus Keyword formula: [Company Name] + [City Name] IMPORTANT — CLEAN THE INPUTS: - If city is missing/null, use the headquarters location from description. - Focus keyword must be real, searchable, human-readable. ════════════════════════════════════════ STEP 2 — GENERATE ALL OUTPUT FIELDS ════════════════════════════════════════ RULE 1 — SEO TITLE: Pattern: [Focus Keyword] | Leading [Industry] Company in [City] ✓ Length: 50–60 characters EXACTLY RULE 2 — META DESCRIPTION: ✓ Length: 130–160 characters EXACTLY ✓ Ends with CTA: "Explore careers on Gethyrd.in." RULE 3 — URL SLUG: Pattern: [focus-keyword-hyphenated] RULE 4 — CONTENT STRUCTURE: H2: About [Company Name] H3: Company History & Heritage H3: Core Values & Culture H2: Manufacturing Excellence & Capabilities H3: Key Products & Services H3: Industrial Impact in [City] H2: Career Opportunities at [Company Name] H3: Why Join Our Team H3: Benefits & Growth H2: Frequently Asked Questions RULE 5 — CONTENT LENGTH & KEYWORD DENSITY: ✓ Total word count: 900–1,200 words ✓ Focus keyword density ~1% RULE 6 — FAQ SECTION: ✓ Minimum 4 questions about the company, culture, and hiring. ════════════════════════════════════════ OUTPUT FORMAT — RETURN VALID JSON ONLY ════════════════════════════════════════ { focus_keyword: "string", seo_title: "string", meta_description: "string", url_slug: "string", content_html: "string" }`;

  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `INPUT:
Company Name: ${company.name || ''}
Industry: ${company.industry || ''}
Location: ${company.location || ''}
Website: ${company.website || ''}
Description: ${company.description || ''}`
        }
      ]
    })
  });

  const data = await response.json();
  const aiResult = JSON.parse(data.choices[0].message.content);

  const finalScore = calculateSEOScore({
    ...company,
    title: company.name,
    seo_title: aiResult.seo_title,
    meta_description: aiResult.meta_description,
    description: aiResult.content_html,
    focus_keyword: aiResult.focus_keyword,
    url_slug: aiResult.url_slug
  });

  return {
    ...aiResult,
    description: aiResult.content_html,
    seo_score: finalScore.score
  };
}

