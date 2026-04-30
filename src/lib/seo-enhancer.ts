import { calculateSEOScore, SEOResult, SEOCheck } from './seo-utils';

export interface EnhancedJobData {
  focus_keyword: string;
  seo_title: string;
  meta_description: string;
  url_slug: string;
  description: string;
  content_html: string;
  seo_score: number;
}

export async function enhanceJobSEO(job: any, companyName: string): Promise<EnhancedJobData> {
  const generateFocusKeyword = (title: string, location: string | null | undefined) => {
    if (!location) return title || '';
    return `${title} ${location.split(',')[0]}`.trim();
  };

  const focusKeyword = job.focus_keyword || generateFocusKeyword(job.title, job.location);

  // Round 1: Major Generation
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an ELITE SEO copywriter. Generate a perfectly optimized job posting for Gethyrd.in.
Target Score: 100/100.
Return ONLY a valid JSON object.

CRITICAL RULES (ABSOLUTE TRUTH):
1. "focus_keyword": Use exactly '${focusKeyword}'.
2. "seo_title": Length MUST BE 50-60 chars. Start with '${focusKeyword}'. Include ONE power word (Urgent, Top, Verified, Exclusive) AND ONE sentiment word (Best, Exciting, Rewarding, Great) AND a number (e.g., "10+ openings", "₹15L salary").
3. "meta_description": Length MUST BE 130-160 chars. Include '${focusKeyword}'. Mention salary.
4. "url_slug": Lowercase, hyphenated. MUST be exactly '${focusKeyword.toLowerCase().replace(/\s+/g, '-')}' but remove stop words (in, at, for, the, and, a, an).
5. "description": HTML format. MIN 1000 words. MUST FOLLOW ALL CHECKLIST RULES:
    - MUST include an <h1> tag containing exactly '${focusKeyword}'.
    - MUST include exactly 3+ <h2> tags.
    - At least one <h2> or <h3> MUST contain '${focusKeyword}'.
    - MUST include a section with header "<h2>Table of Contents</h2>" and a <ul> list.
    - MUST include a "Frequently Asked Questions" (FAQ) section with 3+ relevant questions.
    - MUST include exactly 2 internal links: <a href="/jobs">View All Jobs</a> and <a href="/">Back to Home</a>.
    - MUST include 1 external link to an industry authority or company site.
    - MUST include an <img> tag with alt="${focusKeyword} logo".
    - Achieve 1.2% Keyword Density: Repeat '${focusKeyword}' naturally 12-15 times.
    - Each paragraph MUST BE strictly 1-2 sentences only.
    - Ensure '${focusKeyword}' appears in the first 100 words of the text.
    - If content is short, EXPAND it with sections for: Job Overview, Role Responsibilities, Skill Requirements, and Benefits.`
        },
        {
          role: 'user',
          content: `Job Title: ${job.title}, Company: ${companyName}, Location: ${job.location}, Salary: ${job.salary_range || 'Competitive'}, Raw Description: ${job.description}`
        }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const aiResponse = JSON.parse(data.choices[0].message.content);
  
  let finalDescription = aiResponse.description || aiResponse.content_html || '';
  let finalSeoTitle = aiResponse.seo_title || '';
  let finalMeta = aiResponse.meta_description || '';
  let finalSlug = aiResponse.url_slug || focusKeyword.toLowerCase().replace(/\b(in|at|for|the|and|a|an|with|by|to|from)\b/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // Programmatic Fixes
  if (!finalDescription.includes('Table of Contents')) {
    finalDescription = `<h2>Table of Contents</h2><ul><li><a href="#overview">Role Overview</a></li><li><a href="#requirements">Requirements</a></li><li><a href="#apply">How to Apply</a></li></ul>` + finalDescription;
  }
  
  if (!finalDescription.includes('<img')) {
    finalDescription += `<br/><img src="/logo.png" alt="${focusKeyword} logo" style="max-width:200px;" />`;
  }

  if (!finalDescription.includes('FAQ') && !finalDescription.includes('Frequently Asked Questions')) {
    finalDescription += `<h3>Frequently Asked Questions</h3><p><strong>Is this a full-time role?</strong> Yes, this is a ${job.job_type || 'Full-time'} position.</p><p><strong>Where is it located?</strong> The job is based in ${job.location}.</p>`;
  }

  finalDescription += `<div style="margin-top:40px; border-top:1px solid #eee; padding-top:20px; color:#666; font-size:12px;">
    <p>Seeking a <strong>${focusKeyword}</strong>? This <strong>${focusKeyword}</strong> role in <strong>${job.location}</strong> is perfect for those looking for a <strong>${focusKeyword}</strong> career. Apply now for this <strong>${focusKeyword}</strong> opportunity.</p>
  </div>`;

  if (finalSeoTitle.length > 60) {
    finalSeoTitle = finalSeoTitle.split('|')[0].split('-')[0].trim();
    if (finalSeoTitle.length > 60) finalSeoTitle = finalSeoTitle.substring(0, 60);
  }
  if (finalSeoTitle.length < 50) finalSeoTitle = (finalSeoTitle + " - Apply Now on Gethyrd").substring(0, 60);
  
  if (finalMeta.length > 160) finalMeta = finalMeta.substring(0, 157) + '...';
  if (finalMeta.length < 130) finalMeta = (finalMeta + " View full job details and salary information for this position on Gethyrd.in today. Apply now!").substring(0, 160);

  // Round 2: Iterative Fixing (3 Rounds for maximum quality)
  let retryCount = 0;
  const MAX_RETRIES = 3; 

  while (retryCount < MAX_RETRIES) {
    const currentScore = calculateSEOScore({
      ...job,
      seo_title: finalSeoTitle,
      meta_description: finalMeta,
      description: finalDescription,
      content_html: finalDescription,
      focus_keyword: focusKeyword,
      url_slug: finalSlug
    });

    const failedChecks = currentScore.checks.filter(c => !c.passed && c.autoFixAvailable);
    if (failedChecks.length === 0) break;

    console.log(`Round ${retryCount + 1}: Fixing ${failedChecks.length} SEO issues...`);

    for (const check of failedChecks) {
      const fixResponse = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o', // Upgraded to gpt-4o for fixing to ensure 100% score
          messages: [
            { 
              role: 'system', 
              content: `You are an ELITE SEO fixer. Your task is to fix a SPECIFIC SEO issue: "${check.name}".
MANDATORY CONSTRAINTS:
1. Focus Keyword: "${focusKeyword}"
2. Company: "${companyName}"
3. Rule to follow: ${check.message}
4. Return ONLY the updated field content. No explanation. No quotes.` 
            },
            { 
              role: 'user', 
              content: `Field to fix: ${check.category.toUpperCase()}
Current Content: 
${check.category === 'title' ? finalSeoTitle : check.category === 'meta' ? finalMeta : finalDescription}` 
            }
          ]
        })
      });
      const fixData = await fixResponse.json();
      if (fixData.choices && fixData.choices[0]) {
        const fixedContent = fixData.choices[0].message.content.replace(/"/g, '').trim();

        if (check.category === 'title') finalSeoTitle = fixedContent;
        else if (check.category === 'meta') finalMeta = fixedContent;
        else if (check.category === 'content') finalDescription = fixedContent.replace(/```html|```/g, '').trim();
      }
    }
    retryCount++;
  }

  const finalScore = calculateSEOScore({
    ...job,
    seo_title: finalSeoTitle,
    meta_description: finalMeta,
    description: finalDescription,
    content_html: finalDescription,
    focus_keyword: focusKeyword,
    url_slug: finalSlug
  });

  return {
    focus_keyword: focusKeyword,
    seo_title: finalSeoTitle,
    meta_description: finalMeta,
    url_slug: finalSlug,
    description: finalDescription,
    content_html: finalDescription,
    seo_score: finalScore.score
  };
}
