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

════════════════════════════════════════
STEP 2 — VALIDATE ALL INPUT DATA
════════════════════════════════════════
Before generating content, validate each input field:
employment_type: Default "FULL_TIME"
salary: NEVER write "Not Available". If missing, use "Competitive salary — details shared at interview"
experience: Default "1–3 years"
company_sector: Resolve from company_name (e.g. Tenneco -> Automotive Components)

════════════════════════════════════════
STEP 3 — GENERATE ALL OUTPUT FIELDS
════════════════════════════════════════

RULE 1 — SEO TITLE (must score all 20 pts):
Pattern: [Focus Keyword] — [Power Word] [Number/Salary Signal] | [Company]
✓ Focus keyword in FIRST 3 words
✓ Length: 50–60 characters EXACTLY
✓ Power word from: Urgent, Immediate, Certified, Top, Genuine, Verified, Leading, Direct, Rewarding
✓ Sentiment word OR number: salary figure (₹15L), opening count (3 Openings), year (2026)
✓ NEVER exceed 60 characters — truncate company name if needed

RULE 2 — META DESCRIPTION (must score all 10 pts):
✓ Length: 130–160 characters EXACTLY
✓ Focus keyword appears ONCE, naturally
✓ Ends with CTA: "Apply now on hiringstores.com.in."
✓ No exclamation marks, no all-caps words

RULE 3 — URL SLUG (must score all 15 pts):
Pattern: [focus-keyword-hyphenated]
✓ All lowercase, hyphens only, no underscores, no IDs
✓ Under 75 characters total

RULE 4 — H1 TAG:
Pattern: [Focus Keyword] Jobs | [Company] Hiring [Year]
✓ Exactly ONE H1 per page

RULE 5 — CONTENT STRUCTURE (must follow EXACT heading hierarchy):
Use this exact H2/H3 structure:
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
H3: [4 detailed FAQ questions]

RULE 6 — CONTENT LENGTH & KEYWORD DENSITY:
✓ Total word count: 900–1,200 words
✓ Focus keyword appears 9–12 times (density ~1%)
✓ Focus keyword in FIRST 100 words of body content
✓ Focus keyword in at least one H2 heading naturally

RULE 7 — TABLE OF CONTENTS:
✓ Auto-generated after H1, before first paragraph
✓ Anchor links to each H2 section using IDs: About Role, Salary, Qualifications, About Company, How to Apply, FAQ

RULE 8 — INTERNAL LINKS (minimum 2):
✓ Link 1: category page anchor text = "[Job Title] jobs in India", href = "/jobs/[job-title-slug]"
✓ Link 2: company page anchor text = "[Company] careers", href = "/company/[company-slug]"

RULE 9 — EXTERNAL DOFOLLOW LINK (minimum 1):
✓ Link to company's official website or official portals like nsdcindia.org

RULE 10 — IMAGE ALT TEXT & FILENAME:
✓ Alt: "[Company Name] [City] [Job Title] Jobs [Year]"
✓ Filename: [company-slug]-[city-slug]-logo.png

RULE 11 — FAQ SECTION:
✓ Minimum 4 questions with 2-3 sentence answers. Include FAQPage JSON-LD.

OUTPUT FORMAT — RETURN VALID JSON ONLY
{
  "focus_keyword": "string",
  "seo_title": "string (50-60 chars)",
  "meta_description": "string (130-160 chars)",
  "url_slug": "string",
  "h1": "string",
  "content_html": "FULL HTML CONTENT (900-1200 words)",
  "image_alt_text": "string",
  "image_filename": "string",
  "employment_type_schema": "FULL_TIME",
  "salary_display": "string",
  "company_sector_corrected": "string",
  "schema_json_ld": {},
  "faq_schema_json_ld": {}
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
raw_description: ${job.description || ''}`
        }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const aiResult = JSON.parse(data.choices[0].message.content);

  const finalScore = calculateJobSEOScore({
    ...job,
    ...aiResult,
    description: aiResult.content_html
  });

  return {
    ...aiResult,
    seo_score: finalScore.score
  };
}

export async function enhanceCompanySEO(company: any): Promise<EnhancedCompanyData> {
  const prompt = `You are an SEO Expert for hiringstores.com. Generate a premium company profile.

REQUIREMENTS:
1. CONTENT: 600+ words.
2. SECTIONS: History, Mission, Values, Industrial Impact, Careers.
3. FOCUS KEYWORD: [Company Name] [City].
4. HTML: Use h2, h3, p, ul.

OUTPUT FORMAT: RETURN VALID JSON ONLY
{
  "focus_keyword": "string",
  "seo_title": "50-60 chars",
  "meta_description": "130-160 chars",
  "url_slug": "string",
  "content_html": "string"
}
`;

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
Description: ${company.description || ''}`
        }
      ]
    })
  });

  const data = await response.json();
  const aiResult = JSON.parse(data.choices[0].message.content);

  const finalScore = calculateCompanySEOScore({
    ...company,
    ...aiResult,
    description: aiResult.content_html
  });

  return {
    ...aiResult,
    description: aiResult.content_html,
    seo_score: finalScore.score
  };
}
