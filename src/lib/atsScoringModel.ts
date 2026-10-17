/**
 * ATS Scoring Model & Resume Compliance Validator
 * 
 * Implements strict ATS checks for:
 * 1. File Name Format (e.g., FirstName_LastName_Role.pdf)
 * 2. Email Quality (Professional handle vs informal handles like 'cooldude123@gmail.com')
 * 3. Headings Format (Consistent date format, no spelling errors in headings)
 * 4. Standard Sections (Summary/Objective, Experience, Education, Skills, Projects, Certifications)
 * 5. Content Quality (Action verbs, numbers & quantifiable results, bullet points, no long paragraphs)
 * 6. Keywords & Skills Match (Role-specific keyword gap analysis)
 */

export interface ATSCheckResult {
  id: string;
  name: string;
  category: 'filename' | 'email' | 'headings' | 'sections' | 'content' | 'keywords';
  status: 'pass' | 'warning' | 'error';
  score: number; // 0 to 100
  title: string;
  message: string;
  details?: string[];
  fix: string;
  suggestedValue?: string;
  currentValue?: string;
}

export interface ComprehensiveATSReport {
  overallScore: number;
  statusLevel: 'excellent' | 'good' | 'risk';
  candidateName: string;
  detectedRole: string;
  candidateEmail: string;
  fileName: string;
  checks: {
    fileName: ATSCheckResult;
    emailQuality: ATSCheckResult;
    headingsAndDates: ATSCheckResult;
    standardSections: ATSCheckResult;
    contentQuality: ATSCheckResult;
    keywordsAndSkills: ATSCheckResult;
  };
  breakdown: {
    formattingScore: number;
    experienceScore: number;
    skillsScore: number;
    educationScore: number;
    contactScore: number;
  };
  summary: string;
  actionItems: {
    highPriority: ATSCheckResult[];
    mediumPriority: ATSCheckResult[];
    lowPriority: ATSCheckResult[];
  };
}

// -------------------------------------------------------------
// 1. FILE NAME VALIDATOR
// Format expected: FirstName_LastName_Role.pdf (or FirstName-LastName-Role.pdf)
// -------------------------------------------------------------
export function validateFileName(
  fileName: string,
  candidateName?: string,
  role?: string
): ATSCheckResult {
  if (!fileName) {
    return {
      id: 'file_name_format',
      name: 'File Naming Convention',
      category: 'filename',
      status: 'error',
      score: 0,
      title: 'Missing File Name',
      message: 'No file name was detected. ATS systems require a clean, formatted file name.',
      fix: 'Save your file as FirstName_LastName_Role.pdf (e.g. John_Doe_Software_Engineer.pdf).'
    };
  }

  const cleanBase = fileName.replace(/\.[^/.]+$/, ''); // remove extension
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // Generate suggested file name if candidate info is available or infer from file tokens
  let inferredCandidate = candidateName;
  let inferredRole = role;

  if (!inferredCandidate || !inferredRole) {
    // Strip random numbers/timestamps and copy suffixes
    const rawTokens = cleanBase
      .replace(/^\d{6,}[-_]?/g, '') // remove leading timestamp
      .replace(/\(\d+\)|__\d+_?|_copy/gi, '') // remove (1), __1_
      .split(/[-_\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0 && !/^\d+$/.test(t) && !/^(cv|resume|biodata|document)$/i.test(t));

    if (rawTokens.length >= 2) {
      if (!inferredCandidate) {
        inferredCandidate = rawTokens.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
      }
      if (!inferredRole && rawTokens.length > 2) {
        inferredRole = rawTokens.slice(2).map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
      }
    } else if (rawTokens.length === 1 && !inferredCandidate) {
      inferredCandidate = rawTokens[0].charAt(0).toUpperCase() + rawTokens[0].slice(1).toLowerCase();
    }
  }

  let suggested = 'FirstName_LastName_Role.pdf';
  if (inferredCandidate && inferredRole) {
    const cleanCandidate = inferredCandidate
      .trim()
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .slice(0, 2)
      .join('_');
    const cleanRole = inferredRole
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .slice(0, 3)
      .join('_');
    suggested = `${cleanCandidate || 'FirstName_LastName'}_${cleanRole || 'Role'}.${ext || 'pdf'}`;
  } else if (inferredCandidate) {
    const cleanCandidate = inferredCandidate
      .trim()
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .slice(0, 2)
      .join('_');
    suggested = `${cleanCandidate || 'FirstName_LastName'}_Resume.${ext || 'pdf'}`;
  }

  // Detect red flags in file name
  const issues: string[] = [];
  const hasTimestampOrNumbers = /^\d{6,}|_\d{6,}/.test(cleanBase) || /\b\d{8,}\b/.test(cleanBase);
  const isGeneric = /^(resume|cv|document|my_resume|my_cv|updated_cv|final_cv|latest_resume|biodata)$/i.test(
    cleanBase.replace(/[\-_]/g, '')
  );
  const hasParenthesesOrCopy = /\(\d+\)|__\d+_?|_copy/i.test(fileName);
  const hasSpecialChars = /[^a-zA-Z0-9_\-\.\s]/.test(fileName);
  const hasSpaces = /\s/.test(fileName);

  if (hasTimestampOrNumbers) {
    issues.push('Contains random timestamp or numeric ID prefixes (e.g., "1792046756427_")');
  }
  if (isGeneric) {
    issues.push('Generic name detected (e.g., "CV.pdf" or "Resume.pdf") without candidate name or role');
  }
  if (hasParenthesesOrCopy) {
    issues.push('Contains copy artifacts like "(1)" or duplicate underscores ("__1_")');
  }
  if (hasSpecialChars) {
    issues.push('Contains illegal special characters that ATS parsers may reject');
  }
  if (hasSpaces) {
    issues.push('Contains spaces instead of clean underscores or hyphens');
  }

  // Strict check: Does it follow FirstName_LastName_Role pattern?
  // e.g. Abhay_Singh_Project_Manager or Abhay_Singh_ProjectManager or Abhay-Singh-Project-Manager
  const parts = cleanBase.split(/[-_]+/).filter(Boolean);
  const isValidStandardPattern =
    parts.length >= 3 &&
    !hasTimestampOrNumbers &&
    !hasParenthesesOrCopy &&
    !isGeneric &&
    parts.every(p => /^[A-Za-z0-9]+$/.test(p) && !/^\d+$/.test(p));

  if (isValidStandardPattern && issues.length === 0) {
    return {
      id: 'file_name_format',
      name: 'File Naming Convention',
      category: 'filename',
      status: 'pass',
      score: 100,
      title: 'File Name Compliant',
      message: `File name "${fileName}" complies with the standard ATS "FirstName_LastName_Role.pdf" format.`,
      currentValue: fileName,
      suggestedValue: fileName,
      fix: 'No change needed. Your file name is clean and recruiter-ready.'
    };
  }

  return {
    id: 'file_name_format',
    name: 'File Naming Convention',
    category: 'filename',
    status: 'error',
    score: 30,
    title: 'File Name Format Error',
    message: `File name "${fileName}" violates ATS naming conventions. ATS software and recruiters expect "FirstName_LastName_Role.pdf".`,
    currentValue: fileName,
    suggestedValue: suggested,
    details: issues.length ? issues : ['Does not contain FirstName, LastName, and target Role separated by underscores.'],
    fix: `Rename your file to: "${suggested}". Avoid timestamps, generic "CV_IT" tags, or parentheses.`
  };
}

// -------------------------------------------------------------
// 2. EMAIL QUALITY VALIDATOR
// Good: rahul.sharma@gmail.com, first.last@domain.com
// Bad: cooldude123@gmail.com, badboy@..., gaming tags, random spam handles
// -------------------------------------------------------------
export function validateEmailQuality(
  email: string,
  candidateName?: string
): ATSCheckResult {
  if (!email || !email.includes('@')) {
    return {
      id: 'email_quality',
      name: 'Email Professionalism',
      category: 'email',
      status: 'error',
      score: 0,
      title: 'Email Address Missing',
      message: 'No valid email address was detected in the resume.',
      fix: 'Add a professional email address (e.g., rahul.sharma@gmail.com) in your contact header.'
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const [handle] = cleanEmail.split('@');

  // Check for unprofessional / informal handles
  const unprofessionalKeywords = [
    'cooldude', 'coolguy', 'badboy', 'rockstar', 'killer', 'gamer',
    'player', 'sweety', 'sweetie', 'prince', 'princess', 'king', 'queen',
    'hacker', 'lover', 'sexy', 'hotguy', 'hotgirl', 'charming', 'crazy',
    'boss', 'smartboy', 'devil', 'angel', 'hero', 'ninja', 'guru',
    'superman', 'batman', 'handsome', 'dude', 'stud', 'bro', 'legend',
    'swag', 'attitude', 'baba', 'jaan', 'cutie', 'rowdy', 'gangster'
  ];

  const matchedUnprofessional = unprofessionalKeywords.filter(kw => handle.includes(kw));

  // Check for excessive random numbers (> 4 digits at end or throughout)
  const excessiveDigits = (handle.match(/\d/g) || []).length > 4;

  let suggestedEmail = 'firstname.lastname@gmail.com';
  if (candidateName) {
    const nameParts = candidateName
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(p => p.length > 2);
    if (nameParts.length >= 2) {
      suggestedEmail = `${nameParts[0]}.${nameParts[nameParts.length - 1]}@gmail.com`;
    } else if (nameParts.length === 1) {
      suggestedEmail = `${nameParts[0]}@gmail.com`;
    }
  }

  if (matchedUnprofessional.length > 0) {
    return {
      id: 'email_quality',
      name: 'Email Professionalism',
      category: 'email',
      status: 'error',
      score: 20,
      title: 'Unprofessional Email Handle (Error)',
      message: `Email "${email}" contains informal / unprofessional slang (${matchedUnprofessional.map(m => `"${m}"`).join(', ')}). ATS filters and recruiters instantly reject informal emails like "cooldude123@gmail.com".`,
      currentValue: email,
      suggestedValue: suggestedEmail,
      details: [
        `Informal slang handle detected: "${matchedUnprofessional.join(', ')}"`,
        'Recruiters perceive slang/informal emails as unprofessional and immature.',
        'Acceptable formats: "rahul.sharma@gmail.com", "firstname.lastname@domain.com"'
      ],
      fix: `Create and use a professional email address like "${suggestedEmail}" or "firstname.lastname@gmail.com".`
    };
  }

  if (excessiveDigits) {
    return {
      id: 'email_quality',
      name: 'Email Professionalism',
      category: 'email',
      status: 'warning',
      score: 65,
      title: 'Email Contains Excessive Numbers',
      message: `Email "${email}" has excessive trailing digits. While readable, a clean name-based email without long numbers scores significantly higher with recruiters.`,
      currentValue: email,
      suggestedValue: suggestedEmail,
      details: [
        'Contains more than 4 numeric characters.',
        'Clean emails like "rahul.sharma@gmail.com" look more established.'
      ],
      fix: `Consider switching to a cleaner format such as "${suggestedEmail}".`
    };
  }

  return {
    id: 'email_quality',
    name: 'Email Professionalism',
    category: 'email',
    status: 'pass',
    score: 100,
    title: 'Professional Email Format (Good)',
    message: `Email "${email}" is professional and ATS-compliant (e.g. rahul.sharma@gmail.com standard).`,
    currentValue: email,
    suggestedValue: email,
    fix: 'No change needed. Your email handle is professional and clean.'
  };
}

// -------------------------------------------------------------
// 3. HEADINGS FORMAT & DATE CONSISTENCY VALIDATOR
// - Consistent date format (e.g., MMM YYYY - MMM YYYY vs Duration only vs Year only)
// - No spelling errors in section headings
// -------------------------------------------------------------
export function validateHeadingsAndDates(resumeText: string): ATSCheckResult {
  const issues: string[] = [];
  const fixes: string[] = [];

  // 1. Heading spelling typos
  const commonTypos: { [key: string]: string } = {
    experiance: 'Experience',
    experence: 'Experience',
    educaton: 'Education',
    edcuation: 'Education',
    skils: 'Skills',
    skilss: 'Skills',
    competancies: 'Competencies',
    profesional: 'Professional',
    proffessional: 'Professional',
    summery: 'Summary',
    objactive: 'Objective',
    certifcation: 'Certifications',
    achivements: 'Achievements',
    refrences: 'References',
    intrests: 'Interests',
    languags: 'Languages',
    portifolio: 'Portfolio',
    academics: 'Academic'
  };

  const foundTypos: string[] = [];

  for (const [typo, correct] of Object.entries(commonTypos)) {
    // Check if typo appears as an isolated word or heading
    const regex = new RegExp(`\\b${typo}\\b`, 'i');
    if (regex.test(resumeText)) {
      foundTypos.push(`"${typo}" (should be "${correct}")`);
    }
  }

  if (foundTypos.length > 0) {
    issues.push(`Spelling error in section headings: ${foundTypos.join(', ')}`);
    fixes.push(`Correct the misspelled headings: ${foundTypos.join(', ')}.`);
  }

  // 2. Date Format Consistency Check
  // Inspect how dates are written in the resume
  const datePatterns = {
    // Month Year - Month Year (e.g. Dec 2023 - May 2024, Jan 2020 - Present)
    monthYear: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\,]+\d{4}\s*[\-\–\—\to]+\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\,]+\d{4}|Present|Current)\b/gi,
    // MM/YYYY - MM/YYYY (e.g. 06/2022 - 05/2024, 09/2021 - Present)
    numericMonthYear: /\b\d{1,2}\/\d{4}\s*[\-\–\—\to]+\s*(\d{1,2}\/\d{4}|Present|Current)\b/gi,
    // Year only (e.g. 2017 - 2021)
    yearOnly: /\b(19\d{2}|20\d{2})\s*[\-\–\—\to]+\s*(19\d{2}|20\d{2}|Present|Current)\b/gi,
    // Duration only without dates (e.g. "2 Years 2 Months", "6 months")
    durationOnly: /\b\d+\s+(years?|months?)\s*(\d+\s+months?)?\b/gi
  };

  const monthYearMatches = (resumeText.match(datePatterns.monthYear) || []).length;
  const numericMatches = (resumeText.match(datePatterns.numericMonthYear) || []).length;
  const yearOnlyMatches = (resumeText.match(datePatterns.yearOnly) || []).length;
  const durationOnlyMatches = (resumeText.match(datePatterns.durationOnly) || []).length;

  const distinctDateStyles = [
    monthYearMatches > 0 ? 'Month Year (e.g., Dec 2023 – May 2024)' : null,
    numericMatches > 0 ? 'MM/YYYY (e.g., 06/2022 - Present)' : null,
    yearOnlyMatches > 0 ? 'Year only (e.g., 2017 – 2021)' : null,
    durationOnlyMatches > 0 ? 'Duration only without start/end dates (e.g., "2 Years 2 Months")' : null
  ].filter(Boolean);

  // If duration only without calendar start/end date exists in experience:
  if (durationOnlyMatches > 0 && monthYearMatches > 0) {
    issues.push(
      'Inconsistent date formatting: Found duration only (e.g., "2 Years 2 Months") in one position, but calendar dates ("Dec 2023 – May 2024") in another.'
    );
    fixes.push(
      'Always provide explicit Start Month/Year – End Month/Year for all positions (e.g. "Jun 2022 – Present"), rather than just a duration like "2 Years 2 Months".'
    );
  } else if (distinctDateStyles.length > 2) {
    issues.push(
      `Multiple conflicting date formats used across sections: ${distinctDateStyles.join(' vs ')}.`
    );
    fixes.push(
      'Standardize all dates to one unified format (e.g. "MMM YYYY - MMM YYYY" or "MM/YYYY - Present") across both Work Experience and Education.'
    );
  }

  if (issues.length > 0) {
    return {
      id: 'headings_and_dates',
      name: 'Headings & Date Consistency',
      category: 'headings',
      status: 'error',
      score: 45,
      title: 'Headings or Date Inconsistencies Detected',
      message: 'ATS parsers require consistent date formatting and correctly spelled standard headings.',
      details: issues,
      fix: fixes.join(' ')
    };
  }

  return {
    id: 'headings_and_dates',
    name: 'Headings & Date Consistency',
    category: 'headings',
    status: 'pass',
    score: 100,
    title: 'Headings & Dates Consistent',
    message: 'All headings are spelled correctly and dates follow a consistent, parseable timeline.',
    fix: 'No change needed. Your headings and timeline structure are clean.'
  };
}

// -------------------------------------------------------------
// 4. STANDARD SECTIONS VALIDATOR
// Required sections:
// - Summary or Objective
// - Experience or Internship
// - Education
// - Skills
// - Projects
// - Certifications
// -------------------------------------------------------------
export function validateStandardSections(resumeText: string): ATSCheckResult {
  const sectionsToCheck = [
    {
      id: 'summary',
      name: 'Summary / Objective',
      regex: /(professional summary|career objective|summary|executive summary|about me|profile)/i,
      weight: 15,
      critical: true
    },
    {
      id: 'experience',
      name: 'Experience / Internship',
      regex: /(professional experience|work experience|employment history|experience|internship experience|internships)/i,
      weight: 30,
      critical: true
    },
    {
      id: 'education',
      name: 'Education',
      regex: /(education|educational qualification|academic background|academics|qualifications)/i,
      weight: 20,
      critical: true
    },
    {
      id: 'skills',
      name: 'Skills & Competencies',
      regex: /(core competencies|technical skills|skills|it skills|key skills|competencies)/i,
      weight: 20,
      critical: true
    },
    {
      id: 'projects',
      name: 'Projects / Portfolio',
      regex: /(projects|portfolio|key projects|web projects|academic projects)/i,
      weight: 10,
      critical: false
    },
    {
      id: 'certifications',
      name: 'Certifications',
      regex: /(certifications|licenses & certifications|professional certifications|accreditations|certificates)/i,
      weight: 10,
      critical: false
    }
  ];

  const foundSections: string[] = [];
  const missingSections: { name: string; critical: boolean }[] = [];
  let score = 100;

  for (const sec of sectionsToCheck) {
    if (sec.regex.test(resumeText)) {
      foundSections.push(sec.name);
    } else {
      missingSections.push({ name: sec.name, critical: sec.critical });
      score -= sec.weight;
    }
  }

  score = Math.max(score, 0);

  if (missingSections.length > 0) {
    const criticalMissing = missingSections.filter(s => s.critical);
    const nonCriticalMissing = missingSections.filter(s => !s.critical);

    const status = criticalMissing.length > 0 ? 'error' : 'warning';
    const missingNames = missingSections.map(s => `"${s.name}"`).join(', ');

    return {
      id: 'standard_sections',
      name: 'Standard Sections Completeness',
      category: 'sections',
      status,
      score,
      title: `Missing Section${missingSections.length > 1 ? 's' : ''}: ${missingNames}`,
      message: `Your resume is missing standard ATS section${missingSections.length > 1 ? 's' : ''}: ${missingNames}.`,
      details: [
        `Found sections: ${foundSections.join(', ')}`,
        `Missing sections: ${missingNames}`,
        nonCriticalMissing.some(m => m.name === 'Certifications')
          ? 'Certifications (e.g. PMP, Scrum Master, AWS, Google) add heavy ATS ranking weight for tech and management roles.'
          : ''
      ].filter(Boolean),
      fix: `Add dedicated heading${missingSections.length > 1 ? 's' : ''} for: ${missingNames}. Standard section titles ensure automated ATS parsers don't drop your credentials.`
    };
  }

  return {
    id: 'standard_sections',
    name: 'Standard Sections Completeness',
    category: 'sections',
    status: 'pass',
    score: 100,
    title: 'All Standard Sections Present',
    message: 'Your resume includes all 6 core standard sections (Summary, Experience, Education, Skills, Projects, Certifications).',
    details: [`Detected sections: ${foundSections.join(', ')}`],
    fix: 'No change needed. All essential ATS resume sections are present.'
  };
}

// -------------------------------------------------------------
// 5. CONTENT QUALITY VALIDATOR
// - Action verbs
// - Numbers and results (quantified achievements)
// - Bullet points
// - No long paragraphs
// -------------------------------------------------------------
export function validateContentQuality(resumeText: string): ATSCheckResult {
  const issues: string[] = [];
  const details: string[] = [];
  let score = 100;

  // 1. Numbers and Measurable Results Check (Quantifiable metrics)
  // Check for %, $, ₹, +, numbers, multipliers
  const metricRegex = /\b(\d+(\.\d+)?%|\$\d+[\d,]*|\₹\d+[\d,]*|\b\d+x\b|\b\d+\+\b|\b\d{2,}\b\s*(clients|projects|developers|members|users|leads|revenue|sales|reduction|increase|boost|savings|uptime))/i;
  const hasNumbers = metricRegex.test(resumeText);

  // Check specifically in experience section (lines with bullet points)
  const experienceLines = resumeText
    .split('\n')
    .filter(line => /^[\s\t]*[•\-\*\\⁃\‣]\s*/.test(line) || /^\s*\d+\.\s*/.test(line));

  const bulletsWithMetrics = experienceLines.filter(line => metricRegex.test(line));

  if (!hasNumbers || bulletsWithMetrics.length === 0) {
    issues.push(
      'Zero quantifiable results found in your experience bullet points. ATS algorithms and recruiters rank resumes with measurable numbers, percentages, and metrics 40% higher.'
    );
    details.push('Missing: % growth/reduction, team sizes, project volume, budget amounts, or efficiency gains.');
    score -= 30;
  } else if (bulletsWithMetrics.length < 3 && experienceLines.length >= 5) {
    issues.push(
      `Only ${bulletsWithMetrics.length} out of ${experienceLines.length} bullet points contain measurable metrics or numbers.`
    );
    score -= 15;
  }

  // 2. Action Verbs Check
  const weakPhrases = [
    'responsible for',
    'helped with',
    'worked on',
    'assisted in',
    'handled duties of',
    'tasked with',
    'involved in'
  ];
  const foundWeakPhrases = weakPhrases.filter(wp =>
    new RegExp(`\\b${wp}\\b`, 'i').test(resumeText)
  );

  const strongActionVerbs = [
    'spearheaded', 'orchestrated', 'engineered', 'optimized', 'delivered',
    'streamlined', 'accelerated', 'implemented', 'managed', 'executed',
    'championed', 'transformed', 'negotiated', 'formulated', 'automated',
    'developed', 'coordinated', 'architected'
  ];
  const foundActionVerbs = strongActionVerbs.filter(av =>
    new RegExp(`\\b${av}\\b`, 'i').test(resumeText)
  );

  if (foundActionVerbs.length > 0) {
    details.push(`Action verbs identified: ${foundActionVerbs.slice(0, 5).join(', ')}`);
  }

  if (foundWeakPhrases.length > 0) {
    issues.push(
      `Passive or weak phrasing detected: ${foundWeakPhrases.map(w => `"${w}"`).join(', ')}. Replace with strong action verbs.`
    );
    score -= 15;
  }

  // Check verb repetition (e.g. "Managed" used > 5 times)
  const managedCount = (resumeText.match(/\bmanaged\b/gi) || []).length;
  const coordinatedCount = (resumeText.match(/\bcoordinated\b/gi) || []).length;
  if (managedCount > 4 || coordinatedCount > 4) {
    issues.push(
      `Repetitive action verbs: "Managed" used ${managedCount} times, "Coordinated" used ${coordinatedCount} times. Vary your verbs (e.g., "Spearheaded", "Orchestrated", "Delivered", "Optimized").`
    );
    score -= 10;
  }

  // 3. Bullet Points Check
  const hasBullets = experienceLines.length >= 3;
  if (!hasBullets) {
    issues.push(
      'Work experience lacks bullet point formatting. ATS parsers prefer clean bullet lists over block paragraphs.'
    );
    score -= 25;
  } else if (experienceLines.length > 20) {
    issues.push(
      `Too many bullet points (${experienceLines.length} total). Aim for 4-6 high-impact bullets per role to avoid recruiter fatigue.`
    );
    score -= 10;
  }

  // 4. Long Paragraphs Check (> 5 lines or > 65 words in a continuous block)
  const paragraphs = resumeText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const denseParagraphs = paragraphs.filter(p => {
    // Exclude skills listings or portfolio link lists
    if (p.includes('http') || p.split(',').length > 5) return false;
    const words = p.split(/\s+/).length;
    return words > 70 && !p.includes('•') && !p.includes('');
  });

  if (denseParagraphs.length > 0) {
    issues.push(
      `Detected ${denseParagraphs.length} long, dense paragraph(s) (e.g., in Summary or Experience). ATS and recruiters skim; dense text blocks get skipped.`
    );
    details.push('Break dense paragraphs into 2-3 concise lines or structured bullet points.');
    score -= 15;
  }

  score = Math.max(score, 10);

  if (issues.length > 0) {
    const isError = score < 60 || !hasNumbers || !hasBullets;
    return {
      id: 'content_quality',
      name: 'Content Quality & Impact',
      category: 'content',
      status: isError ? 'error' : 'warning',
      score,
      title: isError ? 'Content Quality Deficiencies (Error)' : 'Content Quality Improvements Needed',
      message: issues[0],
      details: [...issues, ...details],
      fix: 'Rewrite experience bullets using the formula: [Strong Action Verb] + [Context/Project] + [Quantifiable Result with % or numbers]. Break down long paragraphs into bullet points.'
    };
  }

  return {
    id: 'content_quality',
    name: 'Content Quality & Impact',
    category: 'content',
    status: 'pass',
    score: 100,
    title: 'High Content Quality',
    message: 'Your resume features strong action verbs, quantifiable metrics, bulleted structure, and concise paragraphs.',
    fix: 'No change needed. Your content impact is strong.'
  };
}

// -------------------------------------------------------------
// 6. KEYWORDS & SKILLS MATCH VALIDATOR
// Matches skills against target role industry standard keywords
// -------------------------------------------------------------
export function validateKeywordsAndSkills(
  resumeText: string,
  detectedRole?: string
): ATSCheckResult {
  const role = (detectedRole || '').toLowerCase();
  const lowerText = resumeText.toLowerCase();

  // Keyword dictionary by domain
  const benchmarkKeywords: { [key: string]: string[] } = {
    projectManager: [
      'agile', 'scrum', 'jira', 'trello', 'asana', 'sprint planning',
      'backlog grooming', 'kpis', 'roi', 'budget management', 'risk mitigation',
      'stakeholder management', 'scope management', 'milestone tracking',
      'vendor management', 'quality assurance', 'pmp', 'change management',
      'sdlc', 'sla'
    ],
    softwareEngineer: [
      'javascript', 'typescript', 'react', 'next.js', 'node.js', 'python',
      'sql', 'nosql', 'git', 'ci/cd', 'docker', 'api design', 'rest api',
      'unit testing', 'system architecture', 'microservices', 'cloud', 'aws'
    ],
    operationsExecutive: [
      'process optimization', 'vendor negotiation', 'procurement', 'kpis',
      'workflow automation', 'supply chain', 'resource allocation',
      'operational efficiency', 'cost reduction', 'reporting', 'sla compliance'
    ],
    generalTech: [
      'problem solving', 'team leadership', 'client communication',
      'cross-functional', 'project delivery', 'performance monitoring'
    ]
  };

  let targetKeywords = benchmarkKeywords.projectManager;
  if (role.includes('developer') || role.includes('engineer') || role.includes('software')) {
    targetKeywords = benchmarkKeywords.softwareEngineer;
  } else if (role.includes('operations')) {
    targetKeywords = [...benchmarkKeywords.projectManager, ...benchmarkKeywords.operationsExecutive];
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of targetKeywords) {
    if (lowerText.includes(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const matchRate = Math.round((matched.length / targetKeywords.length) * 100);

  if (matchRate < 60) {
    return {
      id: 'keywords_match',
      name: 'Keywords & Skills Match',
      category: 'keywords',
      status: matchRate < 40 ? 'error' : 'warning',
      score: matchRate,
      title: `Keyword Gap: ${missing.slice(0, 4).join(', ')} missing`,
      message: `Your resume matched ${matched.length}/${targetKeywords.length} (${matchRate}%) standard industry keywords for ${detectedRole || 'your role'}. Missing key ATS search terms.`,
      details: [
        `Matched keywords (${matched.length}): ${matched.join(', ') || 'None'}`,
        `Missing critical terms (${missing.length}): ${missing.slice(0, 8).join(', ')}`,
        'ATS scanners search for specific industry terms before ranking candidates for recruiter review.'
      ],
      fix: `Incorporate missing high-impact keywords like: ${missing.slice(0, 5).map(m => `"${m}"`).join(', ')} into your Skills and Experience sections.`
    };
  }

  return {
    id: 'keywords_match',
    name: 'Keywords & Skills Match',
    category: 'keywords',
    status: 'pass',
    score: matchRate,
    title: 'Strong Keyword Match',
    message: `Matched ${matched.length}/${targetKeywords.length} (${matchRate}%) core industry keywords for ${detectedRole || 'your role'}.`,
    details: [`Top matched keywords: ${matched.slice(0, 10).join(', ')}`],
    fix: 'No change needed. Your keyword density matches ATS screening requirements.'
  };
}

// -------------------------------------------------------------
// COMPREHENSIVE SCANNER
// Runs all 6 modules and computes the unified ATS score
// -------------------------------------------------------------
export function runComprehensiveATSScan(
  resumeText: string,
  file?: { name: string; size?: number } | null,
  aiData?: Record<string, any> | null
): ComprehensiveATSReport {
  // Extract candidate name and role from AI or regex
  const detectedName =
    aiData?.resumeData?.name ||
    extractCandidateName(resumeText) ||
    (file ? file.name.replace(/\.[^/.]+$/, '').replace(/[\-_]/g, ' ') : 'Candidate');

  const detectedRole =
    aiData?.resumeData?.title ||
    extractCandidateRole(resumeText) ||
    'Professional';

  const detectedEmail =
    aiData?.resumeData?.contact?.email ||
    extractEmail(resumeText) ||
    '';

  const fileName = file?.name || '';

  // Run individual validations
  const fileNameCheck = validateFileName(fileName, detectedName, detectedRole);
  const emailQualityCheck = validateEmailQuality(detectedEmail, detectedName);
  const headingsAndDatesCheck = validateHeadingsAndDates(resumeText);
  const standardSectionsCheck = validateStandardSections(resumeText);
  const contentQualityCheck = validateContentQuality(resumeText);
  const keywordsAndSkillsCheck = validateKeywordsAndSkills(resumeText, detectedRole);

  const checks = {
    fileName: fileNameCheck,
    emailQuality: emailQualityCheck,
    headingsAndDates: headingsAndDatesCheck,
    standardSections: standardSectionsCheck,
    contentQuality: contentQualityCheck,
    keywordsAndSkills: keywordsAndSkillsCheck
  };

  const allChecksList = Object.values(checks);

  // Calculate weighted overall score
  // Weights:
  // Content Quality: 30%
  // Standard Sections: 20%
  // Keywords & Skills: 20%
  // Headings & Dates: 15%
  // Email Quality: 8%
  // File Name Format: 7%
  const weightedScore = Math.round(
    contentQualityCheck.score * 0.30 +
    standardSectionsCheck.score * 0.20 +
    keywordsAndSkillsCheck.score * 0.20 +
    headingsAndDatesCheck.score * 0.15 +
    emailQualityCheck.score * 0.08 +
    fileNameCheck.score * 0.07
  );

  const overallScore = Math.min(Math.max(weightedScore, 15), 100);

  const statusLevel: 'excellent' | 'good' | 'risk' =
    overallScore >= 80 ? 'excellent' : overallScore >= 65 ? 'good' : 'risk';

  // Group action items by priority
  const highPriority = allChecksList.filter(c => c.status === 'error');
  const mediumPriority = allChecksList.filter(c => c.status === 'warning');
  const lowPriority = allChecksList.filter(c => c.status === 'pass');

  return {
    overallScore,
    statusLevel,
    candidateName: detectedName,
    detectedRole,
    candidateEmail: detectedEmail,
    fileName,
    checks,
    breakdown: {
      formattingScore: Math.round((fileNameCheck.score + headingsAndDatesCheck.score) / 2),
      experienceScore: contentQualityCheck.score,
      skillsScore: keywordsAndSkillsCheck.score,
      educationScore: standardSectionsCheck.score,
      contactScore: emailQualityCheck.score
    },
    summary: generateReportSummary(overallScore, highPriority, mediumPriority),
    actionItems: {
      highPriority,
      mediumPriority,
      lowPriority
    }
  };
}

// -------------------------------------------------------------
// HELPER PARSERS
// -------------------------------------------------------------
export function extractCandidateName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    // Check if line looks like a person's name (2-4 capitalized words, no numbers/emails)
    if (
      /^[A-Z][a-zA-Z\s]{2,35}$/.test(line) &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('page')
    ) {
      return line;
    }
  }
  return null;
}

export function extractCandidateRole(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (
      /(manager|engineer|developer|executive|specialist|analyst|designer|consultant|lead|director|officer)/i.test(line) &&
      line.length < 50
    ) {
      return line;
    }
  }
  return null;
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
  return match ? match[0] : null;
}

function generateReportSummary(
  score: number,
  high: ATSCheckResult[],
  med: ATSCheckResult[]
): string {
  if (score >= 80) {
    return 'Your resume is in the Green Zone! It adheres to modern ATS parsing standards, clear section structures, and strong keyword matches.';
  }
  if (score >= 65) {
    return `Your resume scored ${score}/100 (Yellow Zone). You have ${high.length} critical issue(s) and ${med.length} improvement point(s) preventing you from reaching top ATS ranking.`;
  }
  return `Your resume scored ${score}/100 (Red Zone). It has ${high.length} critical ATS formatting & content error(s) that could cause rejection by automated applicant tracking filters.`;
}
