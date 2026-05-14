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
  'Leading', 'Direct', 'Rewarding'
];

export const SENTIMENT_WORDS = [
  'Best', 'Exciting', 'Rewarding', 'Proven', 'Amazing', 'Great', 'Easy', 'Top', 'Urgent'
];

export function calculateJobSEOScore(job: any): SEOResult {
  const checks: SEOCheck[] = [];
  const focusKeyword = job.focus_keyword || '';
  const title = job.seo_title || job.title || '';
  const meta = job.meta_description || '';
  const urlSlug = job.url_slug || '';
  const content = job.description || job.content_html || '';
  const salary = job.salary_range || '';

  // Helper to count words (strip HTML tags first for accuracy)
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textContent = stripHtml(content);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  const keywordCount = focusKeyword ? (textContent.match(new RegExp(focusKeyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi')) || []).length : 0;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // 1. Focus Keyword Checks (25 pts)
  const hasKeyword = !!focusKeyword;
  checks.push({
    id: 1,
    name: 'Focus Keyword is set',
    points: 5,
    passed: hasKeyword,
    message: hasKeyword ? 'Focus keyword is set.' : 'No Focus Keyword set.',
    category: 'keyword',
    autoFixAvailable: false
  });

  // Rule 1: Focus keyword in FIRST 3 words of title
  const titleWords = title.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
  const keywordInTitleStart = hasKeyword && titleWords.includes(focusKeyword.toLowerCase().split(' ')[0]);
  checks.push({
    id: 2,
    name: 'Keyword in Title (First 3 words)',
    points: 5,
    passed: keywordInTitleStart,
    message: keywordInTitleStart ? 'Title starts with focus keyword.' : 'Keyword must be in first 3 words of title.',
    category: 'title',
    autoFixAvailable: true
  });

  const keywordInMeta = hasKeyword && meta.toLowerCase().includes(focusKeyword.toLowerCase().trim());
  checks.push({
    id: 3,
    name: 'Keyword in Meta Description',
    points: 5,
    passed: keywordInMeta,
    message: keywordInMeta ? 'Keyword found in meta.' : 'Keyword missing from meta.',
    category: 'meta',
    autoFixAvailable: true
  });

  const keywordInUrl = hasKeyword && (urlSlug.toLowerCase().startsWith(focusKeyword.toLowerCase().replace(/\s+/g, '-').slice(0, 10)));
  checks.push({
    id: 4,
    name: 'URL starts with Focus Keyword',
    points: 5,
    passed: keywordInUrl,
    message: keywordInUrl ? 'URL is keyword-optimized.' : 'URL must start with focus keyword.',
    category: 'url',
    autoFixAvailable: true
  });

  // Rule 6: Focus keyword in FIRST 100 words of body content
  const introText = textContent.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  const keywordInIntro = hasKeyword && introText.includes(focusKeyword.toLowerCase());
  checks.push({
    id: 5,
    name: 'Keyword in first 100 words',
    points: 5,
    passed: keywordInIntro,
    message: keywordInIntro ? 'Keyword found in intro.' : 'Keyword missing from first 100 words.',
    category: 'content',
    autoFixAvailable: true
  });

  // 2. SEO Title Rules (15 pts)
  checks.push({
    id: 8,
    name: 'Title length 50-60 characters',
    points: 5,
    passed: title.length >= 50 && title.length <= 60,
    message: `Current: ${title.length} chars. (Target 50-60)`,
    category: 'title',
    autoFixAvailable: true
  });

  const hasPowerWord = POWER_WORDS.some((pw: string) => title.toLowerCase().includes(pw.toLowerCase()));
  checks.push({
    id: 9,
    name: 'Title contains Power Word',
    points: 5,
    passed: hasPowerWord,
    message: hasPowerWord ? 'Power word found.' : 'Add: Urgent, Immediate, Top, etc.',
    category: 'title',
    autoFixAvailable: true
  });

  const hasSentimentOrNumber = /\d+/.test(title) || SENTIMENT_WORDS.some((sw: string) => title.toLowerCase().includes(sw.toLowerCase()));
  checks.push({
    id: 10,
    name: 'Title contains Number or Salary',
    points: 5,
    passed: hasSentimentOrNumber,
    message: hasSentimentOrNumber ? 'Sentiment/Number found.' : 'Add salary figure or opening count.',
    category: 'title',
    autoFixAvailable: true
  });

  // 3. Meta Description Rules (10 pts)
  checks.push({
    id: 12,
    name: 'Meta length 130-160 characters',
    points: 5,
    passed: meta.length >= 130 && meta.length <= 160,
    message: `Current: ${meta.length} chars. (Target 130-160)`,
    category: 'meta',
    autoFixAvailable: true
  });

  const hasCTA = /apply now|apply today|view openings|check salary/i.test(meta);
  checks.push({
    id: 14,
    name: 'Meta contains correct CTA',
    points: 5,
    passed: hasCTA,
    message: hasCTA ? 'CTA found.' : 'Add: Apply now on hiringstores.com.in.',
    category: 'meta',
    autoFixAvailable: true
  });

  // 4. Content Rules (50 pts)
  checks.push({
    id: 21,
    name: 'Word count 900-1,200',
    points: 10,
    passed: wordCount >= 900 && wordCount <= 1200,
    message: `${wordCount} words. (Target 900-1200)`,
    category: 'content',
    autoFixAvailable: true
  });

  const hasH1WithKeyword = content.includes('<h1') && content.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: 22,
    name: 'H1 present with keyword',
    points: 5,
    passed: hasH1WithKeyword,
    message: hasH1WithKeyword ? 'H1 optimized.' : 'H1 missing or no keyword.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasHeadingHierarchy = content.includes('About This') && 
                             content.includes('Key Responsibilities') && 
                             content.includes('Salary Range');
  checks.push({
    id: 23,
    name: 'Expert Heading Hierarchy (H2/H3)',
    points: 5,
    passed: hasHeadingHierarchy,
    message: hasHeadingHierarchy ? 'Structure matches expert rules.' : 'Follow the H2/H3 structure.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasTOC = content.includes('id="toc"') || content.includes('<nav');
  checks.push({
    id: 24,
    name: 'Table of Contents present',
    points: 5,
    passed: hasTOC,
    message: hasTOC ? 'TOC found.' : 'TOC missing after H1.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasDensity = density >= 0.8 && density <= 1.5;
  checks.push({
    id: 7,
    name: 'Keyword Density (~1%)',
    points: 5,
    passed: hasDensity,
    message: `Density is ${density.toFixed(2)}%. (Target 9-12 times)`,
    category: 'keyword',
    autoFixAvailable: true
  });

  const hasInternalLinks = (content.match(/<a\s+href=["']\/(jobs|company)\//g) || []).length >= 2;
  checks.push({
    id: 25,
    name: 'Internal Links (Min 2)',
    points: 5,
    passed: hasInternalLinks,
    message: `${(content.match(/<a\s+href=["']\/(jobs|company)\//g) || []).length} found.`,
    category: 'content',
    autoFixAvailable: true
  });

  const hasExternalLink = (content.match(/<a\s+href=["']http/g) || []).length >= 1;
  checks.push({
    id: 26,
    name: 'External Dofollow Link',
    points: 5,
    passed: hasExternalLink,
    message: hasExternalLink ? 'Found.' : 'Link to company or portal.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasImageAlt = /alt="[^"]+"/.test(content) && content.includes('<img');
  checks.push({
    id: 27,
    name: 'Optimized Image Alt Text',
    points: 5,
    passed: hasImageAlt,
    message: hasImageAlt ? 'Alt text optimized.' : 'Missing alt text.',
    category: 'content',
    autoFixAvailable: true
  });

  const faqCount = (content.match(/<h3[^>]*>.*?<\/h3>/gi) || []).length;
  checks.push({
    id: 28,
    name: 'FAQ Section (Min 4 Qs)',
    points: 5,
    passed: faqCount >= 4,
    message: `${faqCount} sub-sections found.`,
    category: 'content',
    autoFixAvailable: true
  });

  checks.push({
    id: 29,
    name: 'Schema (JSON-LD)',
    points: 5,
    passed: true,
    message: 'Schema auto-generated.',
    category: 'content',
    autoFixAvailable: true
  });

  const totalScore = checks.reduce((acc, check) => acc + (check.passed ? check.points : 0), 0);

  return {
    score: totalScore,
    checks
  };
}

export function calculateCompanySEOScore(company: any): SEOResult {
  const checks: SEOCheck[] = [];
  const focusKeyword = company.focus_keyword || '';
  const title = company.seo_title || company.name || '';
  const meta = company.meta_description || '';
  const content = company.description || '';

  const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textContent = stripHtml(content);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  // 1. Core Fields (30 pts)
  checks.push({
    id: 1,
    name: 'Company Focus Keyword set',
    points: 10,
    passed: !!focusKeyword,
    message: focusKeyword ? 'Keyword set.' : 'Missing focus keyword.',
    category: 'keyword',
    autoFixAvailable: false
  });

  checks.push({
    id: 2,
    name: 'SEO Title optimized',
    points: 10,
    passed: title.length >= 40 && title.length <= 70,
    message: `Title length: ${title.length}`,
    category: 'title',
    autoFixAvailable: true
  });

  checks.push({
    id: 3,
    name: 'Meta Description present',
    points: 10,
    passed: meta.length >= 100,
    message: `Meta length: ${meta.length}`,
    category: 'meta',
    autoFixAvailable: true
  });

  // 2. Content Quality (40 pts)
  checks.push({
    id: 4,
    name: 'Company Description length',
    points: 20,
    passed: wordCount >= 500,
    message: `Current: ${wordCount} words. Target 500+.`,
    category: 'content',
    autoFixAvailable: true
  });

  const hasHistory = content.toLowerCase().includes('history') || content.toLowerCase().includes('founded') || content.toLowerCase().includes('heritage');
  checks.push({
    id: 5,
    name: 'Company History included',
    points: 10,
    passed: hasHistory,
    message: hasHistory ? 'History found.' : 'Include company history.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasMission = content.toLowerCase().includes('mission') || content.toLowerCase().includes('values') || content.toLowerCase().includes('culture');
  checks.push({
    id: 6,
    name: 'Mission & Values included',
    points: 10,
    passed: hasMission,
    message: hasMission ? 'Mission found.' : 'Include mission/values.',
    category: 'content',
    autoFixAvailable: true
  });

  // 3. Media & Links (30 pts)
  const hasLogo = !!company.logo_url;
  checks.push({
    id: 7,
    name: 'Company Logo set',
    points: 15,
    passed: hasLogo,
    message: hasLogo ? 'Logo found.' : 'Missing company logo.',
    category: 'content',
    autoFixAvailable: false
  });

  const hasLinks = content.includes('<a') || !!company.website;
  checks.push({
    id: 8,
    name: 'Website/Links present',
    points: 15,
    passed: hasLinks,
    message: hasLinks ? 'Links found.' : 'Add company links.',
    category: 'content',
    autoFixAvailable: true
  });

  const totalScore = checks.reduce((acc, check) => acc + (check.passed ? check.points : 0), 0);

  return {
    score: totalScore,
    checks
  };
}

// Keep backward compatibility for now if needed, but point to Job version
export function calculateSEOScore(data: any): SEOResult {
  if (data.company_id || data.job_type) {
    return calculateJobSEOScore(data);
  }
  return calculateCompanySEOScore(data);
}

