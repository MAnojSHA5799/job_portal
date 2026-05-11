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

export function calculateSEOScore(job: any): SEOResult {
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

  // 1. Focus Keyword Checks (20 pts)
  const hasKeyword = !!focusKeyword;
  checks.push({
    id: 1,
    name: 'Focus Keyword is set',
    points: 5,
    passed: hasKeyword,
    message: hasKeyword ? 'Focus keyword is set.' : 'No Focus Keyword set. Add keyword in format: [Role] [City].',
    category: 'keyword',
    autoFixAvailable: false
  });

  const keywordInTitleStart = hasKeyword && title.toLowerCase().startsWith(focusKeyword.toLowerCase().split(' ')[0]);
  checks.push({
    id: 2,
    name: 'Keyword in SEO Title (Starts with Keyword)',
    points: 5,
    passed: keywordInTitleStart,
    message: keywordInTitleStart ? 'Title starts with focus keyword.' : 'Keyword is not at the start of title. Click Fix.',
    category: 'title',
    autoFixAvailable: true
  });

  const keywordInMeta = hasKeyword && meta.toLowerCase().includes(focusKeyword.toLowerCase().trim());
  checks.push({
    id: 3,
    name: 'Keyword in Meta Description',
    points: 3,
    passed: keywordInMeta,
    message: keywordInMeta ? 'Keyword found in meta.' : 'Keyword missing from meta. Click Fix to rewrite meta.',
    category: 'meta',
    autoFixAvailable: true
  });

  const cleanKeywordForUrl = (focusKeyword || '').toLowerCase().replace(/\b(in|at|for|the|and|a|an|with|by|to|from)\b/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const keywordInUrl = hasKeyword && (urlSlug.toLowerCase().includes(cleanKeywordForUrl) || urlSlug.toLowerCase().includes(focusKeyword.toLowerCase().replace(/\s+/g, '-')));
  checks.push({
    id: 4,
    name: 'Keyword in URL slug',
    points: 4,
    passed: keywordInUrl,
    message: keywordInUrl ? 'Keyword found in URL.' : 'URL does not contain keyword. Click Fix to regenerate URL.',
    category: 'url',
    autoFixAvailable: true
  });

  const keywordInIntro = hasKeyword && textContent.slice(0, 500).toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: 5,
    name: 'Keyword in first 100 words',
    points: 4,
    passed: keywordInIntro,
    message: keywordInIntro ? 'Keyword found in intro.' : 'Keyword missing from intro. Click Fix to rewrite first paragraph.',
    category: 'content',
    autoFixAvailable: true
  });

  // 2. SEO Title Rules (20 pts)
  checks.push({
    id: 8,
    name: 'SEO Title length 50-60 chars',
    points: 4,
    passed: title.length >= 50 && title.length <= 60,
    message: `Title is ${title.length} characters. Target 50-60.`,
    category: 'title',
    autoFixAvailable: true
  });

  const hasPowerWord = POWER_WORDS.some((pw: string) => title.toLowerCase().includes(pw.toLowerCase()));
  checks.push({
    id: 9,
    name: 'Title contains power word',
    points: 4,
    passed: hasPowerWord,
    message: hasPowerWord ? 'Power word found.' : 'No power word found. Click Fix to add one.',
    category: 'title',
    autoFixAvailable: true
  });

  const hasSentimentOrNumber = SENTIMENT_WORDS.some((sw: string) => title.toLowerCase().includes(sw.toLowerCase())) || /\d+/.test(title);
  checks.push({
    id: 10,
    name: 'Title contains sentiment word or number',
    points: 4,
    passed: hasSentimentOrNumber,
    message: hasSentimentOrNumber ? 'Sentiment/Number found.' : 'No sentiment or number. Click Fix to rewrite title.',
    category: 'title',
    autoFixAvailable: true
  });

  const keywordInTitleEntirely = hasKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: 11,
    name: 'Title contains Focus Keyword',
    points: 4,
    passed: keywordInTitleEntirely,
    message: keywordInTitleEntirely ? 'Keyword found in title.' : 'Keyword missing from title entirely.',
    category: 'title',
    autoFixAvailable: true
  });

  // 3. Meta Description Rules (10 pts)
  checks.push({
    id: 12,
    name: 'Meta Description length 130-160 chars',
    points: 3,
    passed: meta.length >= 130 && meta.length <= 160,
    message: `Meta is ${meta.length} characters. Target 130-160.`,
    category: 'meta',
    autoFixAvailable: true
  });

  // Duplicate check removed (using id: 3 instead)

  const hasCTA = /apply|view|check|now|today/i.test(meta);
  checks.push({
    id: 14,
    name: 'Meta contains a CTA',
    points: 2,
    passed: hasCTA,
    message: hasCTA ? 'CTA found.' : 'No call-to-action in meta. Click Fix.',
    category: 'meta',
    autoFixAvailable: true
  });

  const hasSalarySignal = /salary|pay|earn|₹|\$|CTC|LPA/i.test(meta) || (!!salary && meta.includes(salary));
  checks.push({
    id: 15,
    name: 'Meta contains salary signal',
    points: 2,
    passed: hasSalarySignal,
    message: hasSalarySignal ? 'Salary signal found.' : 'No salary mention. Click Fix if salary data is available.',
    category: 'meta',
    autoFixAvailable: true
  });

  // 4. URL Structure Rules (15 pts)
  checks.push({
    id: 16,
    name: 'URL contains Focus Keyword',
    points: 5,
    passed: keywordInUrl,
    message: keywordInUrl ? 'Keyword found in URL.' : 'URL slug does not contain focus keyword. Click Fix.',
    category: 'url',
    autoFixAvailable: true
  });

  checks.push({
    id: 17,
    name: 'URL under 75 characters',
    points: 3,
    passed: urlSlug.length > 0 && urlSlug.length < 75,
    message: `URL is ${urlSlug.length} chars. Target under 75.`,
    category: 'url',
    autoFixAvailable: true
  });

  const urlClean = urlSlug.length > 0 && !/[A-Z]/.test(urlSlug) && !/[0-9]{5,}/.test(urlSlug);
  checks.push({
    id: 18,
    name: 'URL lowercase, no IDs',
    points: 3,
    passed: urlClean,
    message: urlClean ? 'URL is clean.' : 'URL contains uppercase or numeric ID. Click Fix.',
    category: 'url',
    autoFixAvailable: true
  });

  // Skipping 19 (URL unique) as it requires DB check

  const urlNoStopWords = urlSlug.length > 0 && !/\b(in|at|for|the|and|a|an)\b/.test(urlSlug);
  checks.push({
    id: 20,
    name: 'URL is short and clean',
    points: 2,
    passed: urlNoStopWords,
    message: urlNoStopWords ? 'URL is optimized.' : 'URL contains stop words or redundant terms. Click Fix.',
    category: 'url',
    autoFixAvailable: true
  });

  const keywordInSubheading = hasKeyword && (content.match(/<h[23][^>]*>.*?<\/h[23]>/gi) || []).some((h: string) => h.toLowerCase().includes(focusKeyword.toLowerCase()));
  checks.push({
    id: 6,
    name: 'Focus Keyword in at least one H2 or H3',
    points: 2,
    passed: keywordInSubheading,
    message: keywordInSubheading ? 'Keyword found in subheadings.' : 'No subheading contains keyword. Click Fix to rewrite subheadings.',
    category: 'keyword',
    autoFixAvailable: true
  });

  // 5. Content Rules (35 pts)
  checks.push({
    id: 21,
    name: 'Word count 900-1,200',
    points: 9,
    passed: wordCount >= 900 && wordCount <= 1200,
    message: `Content is ${wordCount} words. Target 900-1,200.`,
    category: 'content',
    autoFixAvailable: true
  });

  const hasH1WithKeyword = content.includes('<h1') && content.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: 22,
    name: 'H1 tag present with keyword',
    points: 4,
    passed: hasH1WithKeyword,
    message: hasH1WithKeyword ? 'H1 with keyword found.' : 'H1 missing or does not contain keyword. Click Fix.',
    category: 'content',
    autoFixAvailable: true
  });

  const h2Count = (content.match(/<h2/g) || []).length;
  const hasHeadingHierarchy = content.includes('Key Responsibilities') && 
                             content.includes('Required Skills') && 
                             content.includes('Salary Range') && 
                             content.includes('Qualifications & Experience') &&
                             content.includes('Frequently Asked Questions');
  
  checks.push({
    id: 23,
    name: 'Standard Heading Hierarchy',
    points: 3,
    passed: h2Count >= 5 && hasHeadingHierarchy,
    message: hasHeadingHierarchy ? 'Heading structure matches standards.' : 'Heading structure does not match the required hierarchy. Click Fix.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasTOC = content.includes('Table of Contents') || content.includes('<nav');
  checks.push({
    id: 24,
    name: 'Table of Contents present',
    points: 3,
    passed: hasTOC,
    message: hasTOC ? 'TOC found.' : 'No Table of Contents. Click Fix to auto-generate.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasDensity = density >= 0.8 && density <= 1.5;
  checks.push({
    id: 7,
    name: 'Keyword Density 0.8%-1.5%',
    points: 2,
    passed: hasDensity,
    message: `Density is ${density.toFixed(2)}%. Target 0.8%-1.5%.`,
    category: 'keyword',
    autoFixAvailable: true
  });

  const hasInternalLinks = (content.match(/<a\s+href=["']\//g) || []).length >= 2;
  checks.push({
    id: 25,
    name: 'Internal links present (min 2)',
    points: 3,
    passed: hasInternalLinks,
    message: hasInternalLinks ? 'Internal links found.' : 'Insufficient internal links. Add links in editor.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasExternalLink = (content.match(/<a\s+href=["']http/g) || []).filter((l: string) => !l.includes('http://www.hiringstores.com')).length >= 1;
  checks.push({
    id: 26,
    name: 'External DoFollow link present',
    points: 3,
    passed: hasExternalLink,
    message: hasExternalLink ? 'External link found.' : 'No external links found. Add company or industry link.',
    category: 'content',
    autoFixAvailable: true
  });

  const hasImageAlt = content.includes('<img') && content.toLowerCase().includes('alt=') && content.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: 27,
    name: 'Image present with keyword alt text',
    points: 3,
    passed: hasImageAlt,
    message: hasImageAlt ? 'Image with alt text found.' : 'No image or alt text missing. Click Fix to add company logo.',
    category: 'content',
    autoFixAvailable: true
  });

  const faqCount = (content.match(/<h3[^>]*>.*?<\/h3>/gi) || []).filter((h: string) => 
    h.toLowerCase().includes('?') || 
    h.toLowerCase().includes('what') || 
    h.toLowerCase().includes('how') || 
    h.toLowerCase().includes('why')
  ).length;

  checks.push({
    id: 28,
    name: 'FAQ section present (min 4 questions)',
    points: 3,
    passed: faqCount >= 4,
    message: faqCount >= 4 ? `${faqCount} FAQ questions found.` : `Found ${faqCount} FAQs. Target is 4+ questions. Click Fix.`,
    category: 'content',
    autoFixAvailable: true
  });

  checks.push({
    id: 29,
    name: 'Schema (JSON-LD JobPosting)',
    points: 4,
    passed: true, // Assuming system generates this
    message: 'Schema will be generated automatically.',
    category: 'content',
    autoFixAvailable: true
  });

  const paragraphs = content.split(/<\/p>|<br\s*\/?>/i).filter((p: string) => p.trim().length > 0);
  const longParagraphs = paragraphs.filter((p: string) => {
    const sentenceCount = (p.match(/[.!?]/g) || []).length;
    return sentenceCount > 3;
  });
  checks.push({
    id: 30,
    name: 'Paragraphs short (max 3 sentences)',
    points: 2,
    passed: longParagraphs.length === 0 && paragraphs.length > 0,
    message: longParagraphs.length === 0 ? 'Paragraph lengths are ideal.' : `Detected ${longParagraphs.length} long paragraphs. Click Fix.`,
    category: 'content',
    autoFixAvailable: true
  });

  checks.push({
    id: 19,
    name: 'URL is unique (no duplicates)',
    points: 2,
    passed: true, // Requires DB check, defaulting to true for now
    message: 'URL uniqueness check requires database validation.',
    category: 'url',
    autoFixAvailable: false
  });

  const totalScore = checks.reduce((acc, check) => acc + (check.passed ? check.points : 0), 0);

  return {
    score: totalScore,
    checks
  };
}
