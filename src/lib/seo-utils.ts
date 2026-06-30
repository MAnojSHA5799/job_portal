export interface SEOResult {
  score: number;
  checks: SEOCheck[];
}

export interface SEOCheck {
  id: number;
  name: string;
  points: number;
  passed: boolean;
  message: string;
  category: 'keyword' | 'title' | 'meta' | 'url' | 'content';
  autoFixAvailable: boolean;
}

export const POWER_WORDS = [
  'Urgent', 'Immediate', 'Certified', 'Top', 'Genuine', 'Verified',
  'Leading', 'Direct', 'Rewarding', 'Fresher', 'Fresher Job', 'Apply Now',
  'Energy', 'Best', 'Recent Year',
];

export const SENTIMENT_WORDS = [
  'Best', 'Exciting', 'Rewarding', 'Proven', 'Amazing', 'Great', 'Easy', 'Top', 'Urgent',
];

const stripHtml = (html: string): string =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const escapeRegex = (str: string): string =>
  str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export function calculateJobSEOScore(job: any): SEOResult {
  const checks: SEOCheck[] = [];
  const focusKeyword = (job.focus_keyword || '').trim();
  const title = (job.seo_title || job.title || '').trim();
  const meta = (job.meta_description || '').trim();
  const urlSlug = (job.url_slug || '').trim();
  const content = (job.description || job.content_html || '').trim();

  const textContent = stripHtml(content);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  const keywordCount = focusKeyword
    ? (textContent.match(new RegExp(escapeRegex(focusKeyword), 'gi')) || []).length
    : 0;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // ─── 1. KEYWORD CHECKS (25 pts) ───────────────────────────────────────────

  const hasKeyword = !!focusKeyword;
  checks.push({
    id: 1,
    name: 'Focus Keyword is set',
    points: 5,
    passed: hasKeyword,
    message: hasKeyword ? 'Focus keyword is set.' : 'No Focus Keyword set.',
    category: 'keyword',
    autoFixAvailable: false,
  });

  const titleWords = title.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
  const keywordFirstWord = focusKeyword.toLowerCase().split(' ')[0];
  const keywordInTitleStart =
    hasKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase()) && titleWords.includes(keywordFirstWord);
  checks.push({
    id: 2,
    name: 'Keyword in Title (First 3 words)',
    points: 5,
    passed: keywordInTitleStart,
    message: keywordInTitleStart
      ? 'Title starts with focus keyword.'
      : 'Keyword must be in first 3 words of title.',
    category: 'title',
    autoFixAvailable: true,
  });

  const keywordInMeta =
    hasKeyword && meta.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: 3,
    name: 'Keyword in Meta Description',
    points: 5,
    passed: keywordInMeta,
    message: keywordInMeta ? 'Keyword found in meta.' : 'Keyword missing from meta.',
    category: 'meta',
    autoFixAvailable: true,
  });

  const normalizedKeywordSlug = focusKeyword.toLowerCase().replace(/\s+/g, '-');
  const urlLenValid = urlSlug.length >= 60 && urlSlug.length <= 75;
  const keywordInUrl =
    hasKeyword && urlSlug.toLowerCase().includes(normalizedKeywordSlug);
  checks.push({
    id: 4,
    name: 'URL optimized with Focus Keyword (60-75 chars)',
    points: 5,
    passed: keywordInUrl && urlLenValid,
    message: (keywordInUrl && urlLenValid)
      ? 'URL is keyword-optimized and correct length.'
      : `Current length: ${urlSlug.length} chars (Target 60-75). Must also contain focus keyword.`,
    category: 'url',
    autoFixAvailable: true,
  });

  const introText = textContent.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  const keywordInIntro =
    hasKeyword && introText.includes(focusKeyword.toLowerCase());
  checks.push({
    id: 5,
    name: 'Keyword in first 100 words',
    points: 5,
    passed: keywordInIntro,
    message: keywordInIntro
      ? 'Keyword found in intro.'
      : 'Keyword missing from first 100 words.',
    category: 'content',
    autoFixAvailable: true,
  });

  // ─── 2. SEO TITLE RULES (15 pts) ──────────────────────────────────────────

  const titleLenValid = title.length >= 50 && title.length <= 60;
  checks.push({
    id: 8,
    name: 'Title length 50–60 characters',
    points: 5,
    passed: titleLenValid,
    message: `Current: ${title.length} chars. (Target 50–60, pixel wise max 580px)`,
    category: 'title',
    autoFixAvailable: true,
  });

  const hasPowerWord = POWER_WORDS.some((pw) =>
    title.toLowerCase().includes(pw.toLowerCase())
  );
  checks.push({
    id: 9,
    name: 'Title contains Power Word (Boosts SEO Score without just filling length)',
    points: 10,
    passed: hasPowerWord,
    message: hasPowerWord
      ? 'Power word found.'
      : 'Add a Power word (Fresher Job, Apply Now, Energy, Top, Best, Immediate, Recent Year) to increase SEO Score without just filling length.',
    category: 'title',
    autoFixAvailable: true,
  });

  // ─── 3. META DESCRIPTION RULES (10 pts) ───────────────────────────────────

  const metaLenValid = meta.length >= 140 && meta.length <= 160;
  checks.push({
    id: 12,
    name: 'Meta length 140–160 characters',
    points: 5,
    passed: metaLenValid,
    message: `Current: ${meta.length} chars. (Target 140–160, pixel wise max 920px)`,
    category: 'meta',
    autoFixAvailable: true,
  });

  const hasCTA = /apply now|apply today|view openings|check salary/i.test(meta);
  checks.push({
    id: 14,
    name: 'Meta contains CTA',
    points: 5,
    passed: hasCTA,
    message: hasCTA
      ? 'CTA found in meta.'
      : 'Add CTA: "Apply now on hiringstores.com.in."',
    category: 'meta',
    autoFixAvailable: true,
  });

  // ─── 4. CONTENT RULES (50 pts) ────────────────────────────────────────────

  const wordCountValid = wordCount >= 500 && wordCount <= 800;
  checks.push({
    id: 21,
    name: 'Word count 500–800',
    points: 10,
    passed: wordCountValid,
    message: `${wordCount} words. (Target 500–800)`,
    category: 'content',
    autoFixAvailable: true,
  });

  const hasH1WithKeyword =
    content.includes('<h1') ||
    (job.h1 && job.h1.toLowerCase().includes(focusKeyword.toLowerCase())) ||
    (hasKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase().split(' ')[0]));
  checks.push({
    id: 22,
    name: 'H1 present with keyword',
    points: 5,
    passed: hasH1WithKeyword,
    message: hasH1WithKeyword ? 'H1 optimized.' : 'H1 missing or keyword absent.',
    category: 'content',
    autoFixAvailable: true,
  });

  const hasHeadingHierarchy =
    content.includes('About This') &&
    content.includes('Key Responsibilities') &&
    content.includes('Salary Range');
  checks.push({
    id: 23,
    name: 'Expert Heading Hierarchy (H2/H3)',
    points: 5,
    passed: hasHeadingHierarchy,
    message: hasHeadingHierarchy
      ? 'Heading structure matches expert rules.'
      : 'Follow the required H2/H3 structure.',
    category: 'content',
    autoFixAvailable: true,
  });

  const hasTOC = content.includes('id="toc"') || content.includes('<nav');
  checks.push({
    id: 24,
    name: 'Table of Contents present',
    points: 5,
    passed: hasTOC,
    message: hasTOC ? 'TOC found.' : 'TOC missing after H1.',
    category: 'content',
    autoFixAvailable: true,
  });

  // Keyword Density: three-zone logic
  // < 0.5%  → Too Low
  // 0.5–2.0% → Sweet Spot ✅
  // > 3.0%  → Keyword Stuffing ⚠️
  const densityPass = density >= 0.5 && density <= 2.0;
  let densityMsg = '';
  if (!focusKeyword) {
    densityMsg = 'Set a focus keyword to measure density.';
  } else if (wordCount === 0) {
    densityMsg = 'No content to analyse. Add a job description.';
  } else if (density < 0.5) {
    densityMsg = `⚠️ Too Low — ${density.toFixed(2)}% (${keywordCount}× in ${wordCount} words). Add the keyword a few more times. Target: 0.5–2.0%.`;
  } else if (density > 3.0) {
    densityMsg = `🚨 Keyword Stuffing! — ${density.toFixed(2)}% (${keywordCount}× in ${wordCount} words). Remove some occurrences. Target: 0.5–2.0%.`;
  } else {
    densityMsg = `✅ Perfect — ${density.toFixed(2)}% (${keywordCount}× in ${wordCount} words). Sweet spot: 0.5–2.0%.`;
  }
  checks.push({
    id: 7,
    name: 'Keyword Density (~1%)',
    points: 5,
    passed: densityPass,
    message: densityMsg,
    category: 'keyword',
    autoFixAvailable: true,
  });

  const internalLinkRegex = /<a\s[^>]*href=["'](https?:\/\/(www\.)?hiringstores\.com\.in|\/(jobs|company|jobs-in-))/g;
  const hasCareerLink = /<a\s[^>]*href=["'][^"']*careers?[^"']*["']/i.test(content);
  const internalLinkCount = (content.match(internalLinkRegex) || []).length;
  const passedLinks = internalLinkCount >= 2 && !hasCareerLink;
  checks.push({
    id: 25,
    name: 'Internal Links (min 2)',
    points: 5,
    passed: passedLinks,
    message: passedLinks 
      ? `${internalLinkCount} internal link(s) found.` 
      : 'Add Hiringstores link and official website and not Career link.',
    category: 'content',
    autoFixAvailable: true,
  });

  const externalLinkCount = (content.match(/<a\s[^>]*href=["']https?:\/\//g) || []).length;
  checks.push({
    id: 26,
    name: 'External Dofollow Link',
    points: 5,
    passed: externalLinkCount >= 1,
    message: externalLinkCount >= 1
      ? `${externalLinkCount} external link(s) found.`
      : 'Add at least one external dofollow link.',
    category: 'content',
    autoFixAvailable: true,
  });

  const hasImageAlt =
    (/alt="[^"]+"/.test(content) && content.includes('<img')) ||
    !!job.image_alt_text ||
    !!job.image_filename;
  checks.push({
    id: 27,
    name: 'Optimized Image Alt Text',
    points: 5,
    passed: hasImageAlt,
    message: hasImageAlt 
      ? 'writing a concise, accurate description that includes relevant context rather than stuffing it with Focus keywords' 
      : 'writing a concise, accurate description that includes relevant context rather than stuffing it with Focus keywords',
    category: 'content',
    autoFixAvailable: true,
  });

  const h3Count = (content.match(/<h3[^>]*>.*?<\/h3>/gi) || []).length;
  checks.push({
    id: 28,
    name: 'FAQ Section (min 4 questions)',
    points: 5,
    passed: h3Count >= 4,
    message: `${h3Count} H3 sub-section(s) found. (Target: 4+)`,
    category: 'content',
    autoFixAvailable: true,
  });

  const hasSchema =
    !!job.schema_json_ld && Object.keys(job.schema_json_ld).length > 0;
  checks.push({
    id: 29,
    name: 'Schema JSON-LD present',
    points: 5,
    passed: hasSchema,
    message: hasSchema ? 'Schema JSON-LD found.' : 'Schema JSON-LD missing.',
    category: 'content',
    autoFixAvailable: true,
  });

  const totalScore = checks.reduce(
    (acc, check) => acc + (check.passed ? check.points : 0),
    0
  );

  // Max possible = 5+5+5+5+5 + 5+5+5 + 5+5 + 10+5+5+5+5+5+5+5+5+5 = 100
  return { score: Math.min(totalScore, 100), checks };
}

export function calculateCompanySEOScore(company: any): SEOResult {
  const checks: SEOCheck[] = [];
  const focusKeyword = (company.focus_keyword || '').trim();
  const title = (company.seo_title || company.name || '').trim();
  const meta = (company.meta_description || '').trim();
  const content = (company.description || '').trim();

  const textContent = stripHtml(content);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  // ─── 1. CORE FIELDS (30 pts) ──────────────────────────────────────────────

  checks.push({
    id: 1,
    name: 'Company Focus Keyword set',
    points: 10,
    passed: !!focusKeyword,
    message: focusKeyword ? 'Focus keyword set.' : 'Missing focus keyword.',
    category: 'keyword',
    autoFixAvailable: false,
  });

  const titleLenValid = title.length >= 40 && title.length <= 70;
  checks.push({
    id: 2,
    name: 'SEO Title optimized (40–70 chars)',
    points: 10,
    passed: titleLenValid,
    message: `Title length: ${title.length} chars. (Target: 40–70)`,
    category: 'title',
    autoFixAvailable: true,
  });

  const metaLenValid = meta.length >= 100 && meta.length <= 160;
  checks.push({
    id: 3,
    name: 'Meta Description present (100–160 chars)',
    points: 10,
    passed: metaLenValid,
    message: `Meta length: ${meta.length} chars. (Target: 100–160)`,
    category: 'meta',
    autoFixAvailable: true,
  });

  // ─── 2. CONTENT QUALITY (40 pts) ──────────────────────────────────────────

  checks.push({
    id: 4,
    name: 'Description length (500+ words)',
    points: 20,
    passed: wordCount >= 500,
    message: `${wordCount} words. (Target: 500+)`,
    category: 'content',
    autoFixAvailable: true,
  });

  const hasHistory =
    /history|founded|heritage|established/i.test(content);
  checks.push({
    id: 5,
    name: 'Company History included',
    points: 10,
    passed: hasHistory,
    message: hasHistory ? 'History section found.' : 'Include company founding/history.',
    category: 'content',
    autoFixAvailable: true,
  });

  const hasMission =
    /mission|values|culture|vision/i.test(content);
  checks.push({
    id: 6,
    name: 'Mission & Values included',
    points: 10,
    passed: hasMission,
    message: hasMission ? 'Mission/values found.' : 'Include mission and values.',
    category: 'content',
    autoFixAvailable: true,
  });

  // ─── 3. MEDIA & LINKS (30 pts) ────────────────────────────────────────────

  const hasLogo = !!company.logo_url;
  checks.push({
    id: 7,
    name: 'Company Logo set',
    points: 15,
    passed: hasLogo,
    message: hasLogo ? 'Company logo found.' : 'Upload a company logo.',
    category: 'content',
    autoFixAvailable: false,
  });

  const hasLinks = content.includes('<a') || !!company.website;
  checks.push({
    id: 8,
    name: 'Website / Links present',
    points: 15,
    passed: hasLinks,
    message: hasLinks ? 'Links found.' : 'Add the company website link.',
    category: 'content',
    autoFixAvailable: true,
  });

  const totalScore = checks.reduce(
    (acc, check) => acc + (check.passed ? check.points : 0),
    0
  );

  // Max possible = 10+10+10+20+10+10+15+15 = 100
  return { score: Math.min(totalScore, 100), checks };
}

/** Backward-compatible wrapper — prefer the specific functions directly. */
export function calculateSEOScore(data: any): SEOResult {
  const isJob =
    'job_type' in data ||
    'experience_level' in data ||
    'seo_title' in data ||
    'focus_keyword' in data;
  return isJob ? calculateJobSEOScore(data) : calculateCompanySEOScore(data);
}