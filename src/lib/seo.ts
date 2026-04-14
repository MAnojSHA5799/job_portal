export interface SeoReport {
  score: number;
  checks: {
    label: string;
    passed: boolean;
    suggestion: string;
  }[];
}

export function calculateSeoScore(blog: {
  title?: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  focus_keyword?: string;
}): SeoReport {
  const checks = [];
  let score = 0;

  const title = blog.title || '';
  const excerpt = blog.excerpt || '';
  const content = blog.content || '';
  const keyword = (blog.focus_keyword || '').toLowerCase();
  const hasImage = !!blog.image_url;

  // 1. Title Length (40-70 chars)
  const titleLen = title.length;
  const titlePassed = titleLen >= 40 && titleLen <= 70;
  checks.push({
    label: 'Title Length',
    passed: titlePassed,
    suggestion: titlePassed ? 'Optimal title length.' : 'Title should be between 40-70 characters.'
  });
  if (titlePassed) score += 20;

  // 2. Excerpt/Meta Description Length (120-160 chars)
  const excerptLen = excerpt.length;
  const excerptPassed = excerptLen >= 120 && excerptLen <= 160;
  checks.push({
    label: 'Excerpt Length',
    passed: excerptPassed,
    suggestion: excerptPassed ? 'Optimal excerpt length for meta description.' : 'Excerpt should be between 120-160 characters.'
  });
  if (excerptPassed) score += 20;

  // 3. Content Length (min 300 words)
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const contentPassed = wordCount >= 300;
  checks.push({
    label: 'Content Length',
    passed: contentPassed,
    suggestion: contentPassed ? `Good content length (${wordCount} words).` : `Content is too short (${wordCount} words). Aim for 300+.`
  });
  if (contentPassed) score += 20;

  // 4. Keyword in Title
  if (keyword) {
    const kwInTitle = title.toLowerCase().includes(keyword);
    checks.push({
      label: 'Keyword in Title',
      passed: kwInTitle,
      suggestion: kwInTitle ? 'Keyword found in title.' : `Add your focus keyword "${keyword}" to the title.`
    });
    if (kwInTitle) score += 15;

    // 5. Keyword in Excerpt
    const kwInExcerpt = excerpt.toLowerCase().includes(keyword);
    checks.push({
      label: 'Keyword in Excerpt',
      passed: kwInExcerpt,
      suggestion: kwInExcerpt ? 'Keyword found in excerpt.' : `Add your focus keyword "${keyword}" to the excerpt.`
    });
    if (kwInExcerpt) score += 10;

    // 6. Keyword in Content
    const kwInContent = content.toLowerCase().includes(keyword);
    checks.push({
      label: 'Keyword in Content',
      passed: kwInContent,
      suggestion: kwInContent ? 'Keyword found in content.' : 'Focus keyword not found in the blog body.'
    });
    if (kwInContent) score += 5;
  } else {
    checks.push({
      label: 'Focus Keyword',
      passed: false,
      suggestion: 'Set a focus keyword to improve analysis.'
    });
  }

  // 7. Featured Image
  checks.push({
    label: 'Featured Image',
    passed: hasImage,
    suggestion: hasImage ? 'Featured image is set.' : 'Add a featured image to improve visual SEO.'
  });
  if (hasImage) score += 10;

  return {
    score: Math.min(score, 100),
    checks
  };
}
