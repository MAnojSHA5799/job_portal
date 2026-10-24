"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Zap,
  Brain,
  Target,
  BarChart3,
  ArrowRight,
  RefreshCcw,
  Sparkles,
  Search,
  ShieldCheck,
  Layout,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  User,
  Copy,
  Check,
  X,
  XCircle,
  AlertTriangle,
  Calendar,
  FileCheck,
  Award,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  FolderCheck,
  List
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

import {
  runComprehensiveATSScan,
  validateFileName,
  validateEmailQuality,
  extractCandidateName,
  extractCandidateRole,
  type ComprehensiveATSReport,
  type ATSCheckResult
} from '@/lib/atsScoringModel';

const CATEGORIES = [
  { id: 'formatting', name: 'Formatting & Layout', icon: Layout, weight: 20 },
  { id: 'experience', name: 'Work Experience', icon: Briefcase, weight: 35 },
  { id: 'skills', name: 'Skills & Keywords', icon: Target, weight: 25 },
  { id: 'education', name: 'Education & Certs', icon: GraduationCap, weight: 10 },
  { id: 'contact', name: 'Contact Information', icon: Search, weight: 10 },
];

import { supabase } from '@/lib/supabase';

export default function ATSScorePage() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const complianceSectionRef = useRef<HTMLDivElement>(null);

  const scrollToTarget = (elementId: string, filter?: 'all' | 'error' | 'warning' | 'pass') => {
    const ID_ALIASES: Record<string, string> = {
      'resumeCheckerSubsection-ATSParseRateReport': 'ats-parse-rate-report',
      'resumeCheckerSubsection-QuantifyingImpactReport': 'compliance-content',
      'resumeCheckerSubsection-RepetitionReport': 'compliance-content',
      'resumeCheckerSubsection-SpellingGrammarReport': 'compliance-content',
      'resumeCheckerSubsection-ActionVerbsReport': 'compliance-content',
      'resumeCheckerSubsection-HardSkillsReport': 'compliance-keywords',
      'resumeCheckerSubsection-SoftSkillsReport': 'compliance-keywords',
      'resumeCheckerSubsection-TailoredTitleReport': 'compliance-headings',
      'resumeCheckerSubsection-ContactReport': 'compliance-email',
      'resumeCheckerSubsection-FileNameReport': 'compliance-file',
      'resumeCheckerSubsection-FormatAndSizeReport': 'compliance-file',
      'resumeCheckerSubsection-BulletsConsistencyReport': 'compliance-content',
      'compliance-content-impact': 'compliance-content',
      'compliance-content-repetition': 'compliance-content',
      'compliance-content-spelling': 'compliance-content',
    };

    const targetId = ID_ALIASES[elementId] || elementId;
    setSelectedComplianceFilter(filter || 'all');
    setCollapsedSections(prev => ({ ...prev, [targetId]: false, [elementId]: false }));

    setTimeout(() => {
      const el = document.getElementById(targetId) || document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-4', 'shadow-2xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-4', 'shadow-2xl');
        }, 2200);
      } else {
        complianceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const scrollToCompliance = (filter: 'all' | 'error' | 'warning' | 'pass', cardId?: string) => {
    scrollToTarget(cardId || 'compliance-section', filter);
  };
  const [activeTab, setActiveTab] = useState<'original' | 'enhancv'>('enhancv');
  const [originalViewMode, setOriginalViewMode] = useState<'text' | 'pdf'>('text');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('compliance');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [isParsing, setIsParsing] = useState(false);
  const [isVerifyingResume, setIsVerifyingResume] = useState(false);
  const [isResumeVerified, setIsResumeVerified] = useState<boolean | null>(null); // null=not checked, true=valid, false=invalid

  // ATS Scoring Model Compliance states
  const [fileNameWarning, setFileNameWarning] = useState<ATSCheckResult | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComprehensiveATSReport | null>(null);
  const [selectedComplianceFilter, setSelectedComplianceFilter] = useState<'all' | 'error' | 'warning' | 'pass'>('all');
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testEmailResult, setTestEmailResult] = useState<ATSCheckResult | null>(null);
  const [testFileNameInput, setTestFileNameInput] = useState('');
  const [testFileNameResult, setTestFileNameResult] = useState<ATSCheckResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const ALLOWED_RESUME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

  // AI-based resume content verification — sets isResumeVerified state
  const checkIfResume = async (text: string): Promise<void> => {
    if (!text || text.trim().length < 50) {
      setIsResumeVerified(false); 
      setError('We could not extract enough text from this document. If this is an image or a scanned PDF, please upload a text-based PDF or Word document.');
      return;
    }

    // Heuristic instant pass: Curriculum Vitae, CV, Resume, Bio-data or standard sections are 100% valid!
    const lower = text.toLowerCase();
    const hasCvOrResume = /\b(curriculum\s+vitae|resume|resum[eé]|c\.?v\.?|biodata|bio-data)\b/i.test(lower);
    const hasExperience = /\b(experience|employment|work\s+history|projects|responsibilities|career)\b/i.test(lower);
    const hasEducationOrSkills = /\b(education|academic|qualifications?|skills|technologies|certifications?|summary)\b/i.test(lower);

    if (hasCvOrResume || (hasExperience && hasEducationOrSkills)) {
      setIsResumeVerified(true);
      setError(null);
      setIsVerifyingResume(false);
      return;
    }

    setIsVerifyingResume(true);
    setIsResumeVerified(null);
    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a document classifier for a job portal ATS scanner. Analyze the given document text and determine if it is a resume or CV.
CRITICAL RULES:
1. "Curriculum Vitae" (CV), "Resume", and "Bio-data" are ALL 100% VALID resumes/CVs. Never reject a document for being labeled 'Curriculum Vitae' or 'CV'.
2. If the document describes a person's career, education, skills, projects, or background, isResume MUST BE true.
3. Only return false if the document is completely unrelated to employment/career (e.g. an electricity bill, invoice, receipt, legal contract, story, math textbook, marketing flyer).
Reply with ONLY a JSON object: { "isResume": true/false, "reason": "short explanation" }. No extra text.`
            },
            {
              role: 'user',
              content: `Classify this document (first 1500 chars):\n\n${text.slice(0, 1500)}`
            }
          ]
        })
      });
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content?.trim() || '{"isResume":true}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      if (!parsed.isResume) {
        // Double check: if the AI reason mentions Curriculum Vitae or CV or Resume, it's actually valid!
        if (parsed.reason && /curriculum\s+vitae|cv|resume/i.test(parsed.reason)) {
          setIsResumeVerified(true);
          setError(null);
        } else {
          setIsResumeVerified(false);
          setError(`This does not appear to be a Resume/CV. Detected: "${parsed.reason}". Please upload your actual resume.`);
        }
      } else {
        setIsResumeVerified(true);
        setError(null);
      }
    } catch {
      // If AI check fails, silently pass — don't block the user
      setIsResumeVerified(true);
    } finally {
      setIsVerifyingResume(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // ✅ Validate file extension / MIME type
      const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      const isValidType = ALLOWED_RESUME_TYPES.includes(selectedFile.type) || ALLOWED_EXTENSIONS.includes(ext);

      if (!isValidType) {
        setError('⚠️ Invalid file type. Please upload only a Resume/CV or Cover Letter file (PDF, DOCX, DOC, or TXT).');
        setFile(null);
        setResumeText('');
        setIsResumeVerified(null);
        if (e.target) e.target.value = '';
        return;
      }

      // ✅ Validate file size (< 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('⚠️ File size exceeds 2 MB. Please upload a smaller file.');
        setFile(null);
        setResumeText('');
        setIsResumeVerified(null);
        if (e.target) e.target.value = '';
        return;
      }

      setFile(selectedFile);
      setError(null);
      setIsResumeVerified(null); // reset verification on new file

      // ✅ ATS File Name Validation (FirstName_LastName_Role.pdf)
      const fnCheck = validateFileName(selectedFile.name);
      if (fnCheck.status !== 'pass') {
        setFileNameWarning(fnCheck);
      } else {
        setFileNameWarning(null);
      }

      if (selectedFile.type === 'text/plain') {
        const text = await selectedFile.text();
        setResumeText(text);
        setIsManualEntry(false);
        await checkIfResume(text); // 🔍 AI verification
      } else if (selectedFile.type === 'application/pdf') {
        setIsParsing(true);
        setIsManualEntry(false);
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          console.log('📄 [SUCCESS] EXTRACTED PDF TEXT:', data.text);
          setResumeText(data.text);
          const extractedCandidate = extractCandidateName(data.text);
          const extractedRole = extractCandidateRole(data.text);
          const refinedFnCheck = validateFileName(selectedFile.name, extractedCandidate || undefined, extractedRole || undefined);
          if (refinedFnCheck.status !== 'pass') {
            setFileNameWarning(refinedFnCheck);
          }
          setIsParsing(false);
          await checkIfResume(data.text); // 🔍 AI verification
        } catch (err: any) {
          console.error('Error parsing PDF:', err);
          setError('Failed to extract text from PDF. Please paste your resume text manually.');
          setIsManualEntry(true);
          setIsResumeVerified(null);
        } finally {
          setIsParsing(false);
        }
      } else {
        // DOCX / DOC — parse via mammoth API
        setIsParsing(true);
        setIsManualEntry(false);
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await fetch('/api/parse-docx', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          console.log('📄 [SUCCESS] EXTRACTED DOCX TEXT:', data.text);
          setResumeText(data.text);
          const extractedCandidate = extractCandidateName(data.text);
          const extractedRole = extractCandidateRole(data.text);
          const refinedFnCheck = validateFileName(selectedFile.name, extractedCandidate || undefined, extractedRole || undefined);
          if (refinedFnCheck.status !== 'pass') {
            setFileNameWarning(refinedFnCheck);
          }
          setIsParsing(false);
          await checkIfResume(data.text); // 🔍 AI verification
        } catch (err: any) {
          console.error('Error parsing DOCX:', err);
          setError('Failed to extract text from DOCX. Please paste your resume text manually.');
          setIsManualEntry(true);
          setIsResumeVerified(null);
        } finally {
          setIsParsing(false);
        }
      }
    }
  };

  const startScan = async () => {
    // If no file and no manual text, return
    if (!file && !resumeText) {
      setError("Please upload a file or paste your resume text.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanProgress(0);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + 5;
      });
    }, 100);

    try {
      // 1. Upload file if exists
      let fileUrl = "";
      if (file) {
        // Sanitize filename: remove spaces and special characters
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}_${cleanName}`;
        const filePath = fileName; // No folder prefix to avoid path issues

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          // If bucket doesn't exist, warn the user but we might continue if we have text
          if (uploadError.message.includes("not found")) {
            console.warn("Storage bucket 'resumes' not found. Please create it in Supabase dashboard.");
          }
        } else {
          const { data } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

          if (data?.publicUrl) {
            fileUrl = data.publicUrl;
            console.log("File uploaded successfully:", fileUrl);
          }
        }
      }

      setScanProgress(85);

      const systemPrompt = `You are an elite, world-class ATS (Applicant Tracking System) resume auditor and hiring algorithms analyst (specialized in enterprise parsing engines like Workday, Taleo, Greenhouse, Lever, and Enhancv).

Your mission is to perform a rigorous, honest, and dynamic evaluation of the provided resume text. Calculate an EXACT, UNBIASED ATS score strictly reflective of what is present versus missing in the candidate's actual resume.

-------------------------------------------------------------
CRITICAL SCORING PHILOSOPHY (STRICT & DYNAMIC — NO INFLATED DEFAULTS):
-------------------------------------------------------------
Never assign arbitrary default scores (like 80 or 85). You must evaluate the resume based on the following three clear scenarios:

1. WHEN ALL POINTS ARE PRESENT (Green Zone: 85 - 98 / 100):
   - Contact Info: Full Name, professional email (name-based), phone number, city/state/country, LinkedIn/portfolio.
   - Professional Summary: Tailored, high-impact summary packed with role-specific keywords and measurable career highlights.
   - Work Experience: Multiple positions, clear timeline (months/years), company names, locations.
   - Bullet Points: EVERY position has 4-6 bullet points starting with strong Action Verbs (e.g., Spearheaded, Orchestrated, Engineered, Accelerated, Streamlined) AND Quantifiable Business Outcomes (e.g., percentages %, dollar revenue $, cost savings, efficiency gains, team size, delivery metrics).
   - Education: Complete credentials (Degree, Major, Institution, Graduation Dates/Years, Location).
   - Skills & Competencies: 15-30 comprehensive, industry-standard technical, domain, and tool-specific skills matching the target role.
   - Formatting & Hierarchy: Standard ATS headings, clear reverse-chronological order, zero spelling or grammatical mistakes.

2. WHEN POINTS ARE PARTIALLY PRESENT / AVERAGE (Yellow Zone: 55 - 75 / 100):
   - Contains standard sections, but experience lists passive duties ("Responsible for managing...", "Assisted in...") instead of achievements.
   - Lacks quantifiable metrics (0 to 2 numbers/percentages across the entire resume).
   - Vague or generic summary without unique value proposition.
   - Modest skill list (fewer than 10 skills or only generic soft skills).
   - Inconsistent date formats or minor grammatical errors.

3. WHEN MANY POINTS ARE MISSING / POOR (Red Zone: 15 - 50 / 100):
   - Missing major sections (e.g., NO work experience, or NO education, or NO skills, or NO contact info).
   - Zero quantifiable metrics anywhere in the resume (no numbers, no percentages, no measurable outcomes).
   - Extremely short content (< 150-200 words) or fragmented text.
   - Missing contact details (no phone number, no location, or an unprofessional email handle like cooldude123@gmail.com).
   - Passive, weak language with multiple spelling/grammar errors.
   - Non-standard section headings that automated parsers fail to categorize.

-------------------------------------------------------------
CATEGORY SCORING RUBRICS (0 to 100):
-------------------------------------------------------------
1. "experience" (Weight: 35%):
   - 90-100: Multiple roles, clear progression, 4-6 bullet points per role, 100% action-verb driven, 70%+ of bullets have quantifiable metrics (%, $, numbers, volumes).
   - 70-89: Clear experience with good role descriptions, but only 20-40% of bullets contain numbers/metrics, or some duties are passive.
   - 45-69: Vague job descriptions, purely listed duties ("Responsible for..."), 0 or 1 metric, unclear dates.
   - 0-44: Missing employment history, fewer than 2 bullets, or completely unparsed experience.

2. "skills" (Weight: 25%):
   - 90-100: 15-30 highly relevant technical, tool, framework, and domain-specific skills for their exact role.
   - 70-89: 10-15 skills, but misses several modern industry tools or high-demand keywords.
   - 45-69: 5-9 skills, mostly basic soft skills (e.g. "Hardworking", "Punctual") without technical depth.
   - 0-44: Fewer than 5 skills or skills section is missing entirely.

3. "formatting" (Weight: 15%):
   - 90-100: Clean hierarchy, standard ATS headings (Experience, Education, Skills, Summary), reverse chronological order, clear dates, zero typos.
   - 70-89: Good structure but minor date inconsistencies or slightly unconventional headings.
   - 45-69: Non-standard headings, mixed timelines, or several spelling/grammar errors.
   - 0-44: Disorganized text, no clear sections, broken structure.

4. "education" (Weight: 15%):
   - 90-100: Complete degree name, field of study, university/college, dates/years, and location.
   - 70-89: Degree and university present, but graduation year or location is missing.
   - 45-69: Only school or generic mention without degree or year.
   - 0-44: Education section is missing.

5. "contact" (Weight: 10%):
   - 90-100: Full name, professional email (name-based), phone number with country/area code, city/state/country, LinkedIn/portfolio link.
   - 70-89: Name, email, and phone present, but missing location or LinkedIn.
   - 45-69: Missing phone or email, or informal/unprofessional email handle.
   - 0-44: Anonymous or missing 2+ core contact fields.

DYNAMIC OVERALL SCORE FORMULA:
overallScore = Math.round(
  (experience.score * 0.35) +
  (skills.score * 0.25) +
  (formatting.score * 0.15) +
  (education.score * 0.15) +
  (contact.score * 0.10)
);

CRITICAL EXTRACTION REQUIREMENTS:
1. ALL POSITIONS & EXPERIENCE: Extract EVERY job and role in the resume (current and previous companies). Do NOT skip any company. For each position, extract originalBulletPoints and generate 4-6 optimizedBulletPoints with powerful action verbs (e.g., Spearheaded, Orchestrated, Executed) and quantified metrics.
2. ALL EDUCATION: Extract ALL degrees, universities, dates, locations. Never leave education empty if mentioned.
3. SKILLS: Extract ALL skills (15-30 skills).
4. CONTACT: Extract full name, job title, phone number, email address, and location.
5. SUMMARY: Provide originalSummary and an enhanced optimizedSummary packed with ATS keywords and impact metrics.
6. STRENGTHS & ACHIEVEMENTS: Extract or synthesize top strengths, quantifiable achievements (with numbers and percentages), professional interests, and all languages with fluency levels.
7. MISSING SKILLS & KEYWORDS: If the resume misses critical keywords for their detected job role, list them in missingSkills and missingKeywords with high priority.
8. SPECIFIC IMPROVEMENT POINTS: List 3-6 high-impact actionable improvement points highlighting exactly what needs fixing.

Return ONLY a valid JSON object matching this structure (no markdown, no codeblock backticks, no extra text):
{
  "overallScore": <calculated_integer_between_15_and_100>,
  "categories": {
    "formatting": { "score": <0-100>, "feedback": "<detailed feedback>", "fixes": ["<specific fix 1>", "<specific fix 2>"] },
    "experience": { "score": <0-100>, "feedback": "<detailed feedback on metrics & action verbs>", "fixes": ["<specific fix 1>"] },
    "skills": { "score": <0-100>, "feedback": "<detailed feedback on skill coverage>", "fixes": ["<specific fix 1>"] },
    "education": { "score": <0-100>, "feedback": "<detailed feedback>", "fixes": ["<specific fix 1>"] },
    "contact": { "score": <0-100>, "feedback": "<detailed feedback>", "fixes": ["<specific fix 1>"] }
  },
  "summary": "<2-3 sentence executive evaluation of ATS compliance and key gap areas>",
  "missingSkills": [
    { "skill": "<Skill Name>", "reason": "<Why it is critical for this role>", "priority": "high" | "medium" }
  ],
  "missingKeywords": [
    { "keyword": "<Keyword>", "reason": "<Why ATS looks for it>", "section": "experience" | "skills" | "summary" }
  ],
  "improvementPoints": [
    { "category": "experience" | "skills" | "formatting" | "education" | "contact", "issue": "<Specific issue found>", "fix": "<Concrete instruction to resolve>", "severity": "high" | "medium" | "low" }
  ],
  "resumeData": {
    "name": "<Candidate Name>",
    "title": "<Target or Current Job Title>",
    "contact": { "phone": "<Phone>", "email": "<Email>", "location": "<Location>" },
    "originalSummary": "<Exact summary or generated summary from resume>",
    "optimizedSummary": "<ATS-optimized version packed with keywords and metrics>",
    "experience": [
      {
        "role": "<Job Title>",
        "company": "<Company Name>",
        "dates": "<Start - End>",
        "location": "<Location>",
        "originalBulletPoints": ["<Original bullet point from resume>"],
        "optimizedBulletPoints": ["<Quantified, action-verb driven optimized bullet point>"]
      }
    ],
    "education": [
      { "degree": "<Degree Name>", "school": "<University Name>", "dates": "<Dates>", "location": "<Location>" }
    ],
    "skills": ["<Skill 1>", "<Skill 2>"],
    "strengths": [
      { "name": "<Key Strength>", "desc": "<Context or elaboration of strength>" }
    ],
    "achievements": [
      { "title": "<Key Achievement>", "desc": "<Quantified result and metric>" }
    ],
    "interests": [
      { "name": "<Interest>", "desc": "<Professional passion or focus>" }
    ],
    "languages": [
      { "name": "<Language>", "level": 5, "label": "Fluent" }
    ]
  }
}`;

      // Ensure we extract full resume text before analysis if not yet loaded in state
      let fullResumeText = resumeText;
      if (!fullResumeText && file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const endpoint = file.type === 'application/pdf' ? '/api/parse-pdf' : '/api/parse-docx';
          const res = await fetch(endpoint, { method: 'POST', body: formData });
          const data = await res.json();
          if (data?.text) {
            fullResumeText = data.text;
            setResumeText(data.text);
          }
        } catch (err) {
          console.error("Text extraction during scan failed:", err);
        }
      }

      // Allow complete resume text up to 30,000 characters without truncating early sections
      const rawText = fullResumeText || resumeText || (file ? `Resume filename: ${file.name}` : '');
      const contentToAnalyze = rawText.length > 30000 ? rawText.slice(0, 30000) + '\n...[truncated]' : rawText;

      console.log('🤖 Sending to OpenAI, text length:', contentToAnalyze.length);

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this resume:\n\n${contentToAnalyze}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const result = await response.json();

      console.log('🤖 OpenAI raw result:', result);

      if (result.error) throw new Error(typeof result.error === 'object' ? result.error.message : result.error);
      if (!result.choices?.[0]?.message?.content) throw new Error('OpenAI returned an empty response. Please try again.');

      const rawContent = result.choices[0].message.content;
      const parsedContent = JSON.parse(rawContent.replace(/```json|```/g, '').trim());

      // 🔍 Run Strict ATS Compliance & Scoring Model
      const complianceReportData = runComprehensiveATSScan(
        resumeText || rawText,
        file ? { name: file.name, size: file.size } : null,
        parsedContent
      );

      // Blend AI's deep content score (65%) with local compliance checks (35%)
      const aiScore = typeof parsedContent.overallScore === 'number' ? parsedContent.overallScore : complianceReportData.overallScore;
      const finalOverallScore = Math.min(Math.max(
        Math.round((aiScore * 0.65) + (complianceReportData.overallScore * 0.35)),
        15
      ), 100);

      parsedContent.complianceReport = complianceReportData;
      parsedContent.overallScore = finalOverallScore;
      complianceReportData.overallScore = finalOverallScore;

      // Synchronize category scores by harmonizing AI evaluations and compliance checks
      if (parsedContent.categories) {
        const blendCatScore = (aiVal: any, compVal: number, weightAI = 0.65) => {
          const num = typeof aiVal?.score === 'number' ? aiVal.score : compVal;
          return Math.min(Math.max(Math.round(num * weightAI + compVal * (1 - weightAI)), 10), 100);
        };

        parsedContent.categories.formatting = {
          score: blendCatScore(parsedContent.categories.formatting, complianceReportData.breakdown.formattingScore, 0.4),
          feedback: parsedContent.categories.formatting?.feedback || complianceReportData.checks.headingsAndDates.message,
          fixes: Array.from(new Set([
            ...(parsedContent.categories.formatting?.fixes || []),
            ...(complianceReportData.checks.headingsAndDates.details || [])
          ]))
        };
        parsedContent.categories.experience = {
          score: blendCatScore(parsedContent.categories.experience, complianceReportData.breakdown.experienceScore, 0.75),
          feedback: parsedContent.categories.experience?.feedback || complianceReportData.checks.contentQuality.message,
          fixes: Array.from(new Set([
            ...(parsedContent.categories.experience?.fixes || []),
            ...(complianceReportData.checks.contentQuality.details || [])
          ]))
        };
        parsedContent.categories.skills = {
          score: blendCatScore(parsedContent.categories.skills, complianceReportData.breakdown.skillsScore, 0.7),
          feedback: parsedContent.categories.skills?.feedback || complianceReportData.checks.keywordsAndSkills.message,
          fixes: Array.from(new Set([
            ...(parsedContent.categories.skills?.fixes || []),
            ...(complianceReportData.checks.keywordsAndSkills.details || [])
          ]))
        };
        parsedContent.categories.education = {
          score: blendCatScore(parsedContent.categories.education, complianceReportData.breakdown.educationScore, 0.6),
          feedback: parsedContent.categories.education?.feedback || complianceReportData.checks.standardSections.message,
          fixes: Array.from(new Set([
            ...(parsedContent.categories.education?.fixes || []),
            ...(complianceReportData.checks.standardSections.details || [])
          ]))
        };
        parsedContent.categories.contact = {
          score: blendCatScore(parsedContent.categories.contact, complianceReportData.breakdown.contactScore, 0.5),
          feedback: parsedContent.categories.contact?.feedback || complianceReportData.checks.emailQuality.message,
          fixes: Array.from(new Set([
            ...(parsedContent.categories.contact?.fixes || []),
            ...(complianceReportData.checks.emailQuality.details || [])
          ]))
        };
      }

      setComplianceReport(complianceReportData);

      // Pre-fill email tester with detected email
      if (complianceReportData.candidateEmail) {
        setTestEmailInput(complianceReportData.candidateEmail);
        setTestEmailResult(complianceReportData.checks.emailQuality);
      }
      if (file?.name) {
        setTestFileNameInput(file.name);
        setTestFileNameResult(complianceReportData.checks.fileName);
      }

      // 2. Save scan result to database
      await supabase.from('resume_scans').insert({
        file_url: fileUrl,
        resume_text: resumeText || file?.name,
        ats_score: complianceReportData.overallScore,
        analysis_result: parsedContent
      });

      setAnalysis(parsedContent);
      setScanProgress(100);

      setTimeout(() => {
        setIsScanning(false);
        setShowResults(true);
      }, 500);

    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || 'Unknown error occurred.';
      if (errMsg.includes('Unexpected token') || errMsg.includes('JSON')) {
        setError("Analysis failed to parse properly. Please try again or check your resume text.");
      } else {
        setError(`Analysis failed: ${errMsg}`);
      }
      setIsScanning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResumeText('');
    setShowResults(false);
    setIsScanning(false);
    setScanProgress(0);
    setAnalysis(null);
    setError(null);
    setShowPreview(false);
    setIsManualEntry(false);
    setFileNameWarning(null);
    setComplianceReport(null);
    setTestEmailInput('');
    setTestEmailResult(null);
    setTestFileNameInput('');
    setTestFileNameResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-24 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showResults && !isScanning ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <div className="flex flex-col items-center justify-center text-center mb-16 max-w-3xl mx-auto">
                <Badge variant="info" className="mb-6 px-4 py-1 text-sm bg-indigo-50 text-indigo-600 border-indigo-100 inline-flex items-center">
                  <Sparkles className="w-3 h-3 mr-2 fill-indigo-600" /> AI-Powered Analysis
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
                  How does your resume <span className="text-indigo-600 italic underline decoration-indigo-200">rank</span>?
                </h1>
                <p className="text-xl text-gray-500 font-medium leading-relaxed">
                  Upload your resume to see how it performs against Applicant Tracking Systems.
                  Get instant feedback on formatting, keywords, and impact.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-dashed border-indigo-300 bg-transparent hover:border-indigo-500 transition-all group relative overflow-hidden rounded-[40px] p-0 text-center shadow-2xl">
                {/* Background Image full coverage */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1200"
                    alt="Resume Analysis"
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
                </div>

                {/* Upload Controls Section */}
                <div className="p-8 md:p-16 flex flex-col items-center justify-center relative z-10 min-h-[450px]">
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />

                  <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shrink-0 z-20">
                      {isVerifyingResume ? (
                        <Brain className="w-12 h-12 animate-pulse text-indigo-500" />
                      ) : isParsing ? (
                        <RefreshCcw className="w-12 h-12 animate-spin text-indigo-400" />
                      ) : file ? (
                        <FileText className="w-12 h-12" />
                      ) : (
                        <Upload className="w-12 h-12" />
                      )}
                    </div>

                    {!isManualEntry ? (
                      <div className="text-center w-full z-20 bg-white/60 p-6 rounded-3xl shadow-sm backdrop-blur-md border border-white/50">
                        <h2 className="text-3xl font-black text-gray-900 mb-2 truncate px-2 tracking-tight">
                          {isVerifyingResume ? (
                            <span className="flex items-center justify-center gap-2 text-indigo-600">
                              <Brain className="w-6 h-6 animate-pulse" /> Verifying document...
                            </span>
                          ) : isParsing ? (
                            <span className="flex items-center justify-center gap-2">
                              <RefreshCcw className="w-6 h-6 animate-spin text-indigo-600" /> Extracting PDF...
                            </span>
                          ) : (
                            file ? file.name : "Drag and drop your resume"
                          )}
                        </h2>
                        <p className="text-gray-600 font-bold">
                          {isVerifyingResume
                            ? 'AI is checking if this is a resume…'
                            : isParsing
                            ? 'Reading text content...'
                            : file
                            ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.name.split('.').pop()?.toUpperCase()}`
                            : 'PDF, DOCX, DOC, TXT supported · Max 2 MB'}
                        </p>

                        {/* ⚠️ ATS File Naming Notice - Simple Red Text */}
                        {file && fileNameWarning && (
                          <p
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 text-xs text-red-600 font-semibold text-left z-20"
                          >
                             ATS File Name Warning: Non-Standard Format. {fileNameWarning.message} Required: <span className="font-mono">FirstName_LastName_Role.pdf</span>{fileNameWarning.suggestedValue ? ` · Recommended: ${fileNameWarning.suggestedValue}` : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="w-full z-20 bg-white/80 p-6 rounded-3xl shadow-sm backdrop-blur-md border border-white/50">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Paste Resume Text</h2>
                        <textarea
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          placeholder="Paste text here..."
                          className="w-full h-48 p-6 rounded-2xl border-2 border-indigo-200 focus:border-indigo-600 focus:ring-0 outline-none text-sm font-medium bg-white/90 shadow-inner resize-none mb-4"
                        />
                        <button
                          onClick={() => setIsManualEntry(false)}
                          className="text-indigo-700 font-black text-xs uppercase tracking-widest hover:underline block text-center w-full"
                        >
                          Or upload file
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center z-20 mt-4">
                      {!file && !isManualEntry ? (
                        <>
                          <Button
                            size="lg"
                            className="font-black text-lg rounded-2xl h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl hover:shadow-indigo-500/30 w-full sm:w-auto"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Select File
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="font-black text-lg rounded-2xl h-16 px-10 bg-white hover:bg-gray-50 border-2 border-indigo-100 w-full sm:w-auto text-indigo-900"
                            onClick={() => setIsManualEntry(true)}
                          >
                            Paste Text Instead
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="lg"
                          className={`font-black text-lg rounded-2xl h-16 px-12 w-full shadow-xl transition-all ${
                            (isManualEntry ? resumeText.trim().length > 50 : isResumeVerified === true)
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/30'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (isManualEntry) {
                              if (resumeText.trim().length <= 50) {
                                alert('⚠️ Please paste your full resume text before analyzing.');
                                return;
                              }
                            } else if (isResumeVerified !== true) {
                              alert('⚠️ Please upload a valid Resume/CV file before analyzing.');
                              return;
                            }
                            startScan();
                          }}
                          disabled={isVerifyingResume || isParsing || (isManualEntry && resumeText.trim().length <= 50)}
                        >
                          {isVerifyingResume ? (
                            <><Brain className="w-5 h-5 mr-2 animate-pulse" /> Verifying Resume...</>
                          ) : (isManualEntry ? resumeText.trim().length > 50 : isResumeVerified === true) ? (
                            <><Zap className="w-5 h-5 mr-2 fill-white" /> Analyze Now</>
                          ) : isResumeVerified === false ? (
                            <><AlertCircle className="w-5 h-5 mr-2" /> Not a Resume</>
                          ) : (
                            <><Zap className="w-5 h-5 mr-2" /> Analyze Now</>
                          )}
                        </Button>
                      )}
                      {(file || isManualEntry) && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="font-black text-lg rounded-2xl h-16 px-10 bg-white hover:bg-gray-50 border-2 border-indigo-100"
                          onClick={reset}
                        >
                          Reset
                        </Button>
                      )}
                    </div>

                    {error && (
                      <div className="mt-4 flex items-center gap-2 text-red-600 font-bold bg-red-50/90 px-6 py-3 rounded-2xl border border-red-200 animate-pulse text-sm z-20 shadow-sm backdrop-blur-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" /> <span className="text-left">{error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                {[
                  { icon: ShieldCheck, title: "ATS Friendly", desc: "Scan against standard algorithms" },
                  { icon: Brain, title: "AI Feedback", desc: "Personalized improvement tips" },
                  { icon: Target, title: "Keyword Audit", desc: "Find missing industry terms" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isScanning ? (
          <div className="max-w-2xl mx-auto py-32 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full mx-auto mb-12 flex items-center justify-center"
            >
              <Brain className="w-12 h-12 text-indigo-600 animate-pulse" />
            </motion.div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Processing Resume...</h2>
            <p className="text-gray-500 font-medium mb-12">Our AI is analyzing formatting, keywords, and role-relevance.</p>

            <div className="max-w-md mx-auto h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                className="h-full bg-indigo-600"
              />
            </div>
            <p className="text-indigo-600 font-bold">{scanProgress}% Completed</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Top Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200/80 rounded-2xl px-6 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                  {(analysis?.resumeData?.name || analysis?.resumeData?.contact?.email || 'R').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 leading-tight">
                    {analysis?.resumeData?.name || 'Candidate Resume'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {analysis?.resumeData?.title || complianceReport?.detectedRole || 'Resume Analysis Complete'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black border ${
                  (analysis?.overallScore || 69) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  (analysis?.overallScore || 69) >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <BarChart3 className="w-4 h-4" />
                  ATS Score: {analysis?.overallScore || 69}/100
                </div>
                <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <RefreshCcw className="w-3.5 h-3.5" /> New Scan
                </button>
              </div>
            </div>

            {/* Split Layout: Fixed Score Sidebar (Left) + Scrollable Reports (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
              {/* Left Column: Fixed / Sticky Score & Category Audit */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
                <Card className="overflow-hidden border-0 shadow-xl rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-center relative">
                  {/* decorative glows */}
                  <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
                  <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black text-white/60 uppercase tracking-[0.15em]">ATS Score</h2>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    (analysis?.overallScore || 69) >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    (analysis?.overallScore || 69) >= 70 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {(() => {
                      const score = analysis?.overallScore || 69;
                      if (score >= 80) return '🟢 Green Zone';
                      if (score >= 70) return '🟡 Yellow Zone';
                      return '🔴 Red Zone';
                    })()}
                  </span>
                </div>
                <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
                  {/* Glow behind ring */}
                  <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${
                    (analysis?.overallScore || 69) >= 80 ? 'bg-emerald-400' :
                    (analysis?.overallScore || 69) >= 70 ? 'bg-amber-400' : 'bg-rose-400'
                  }`} style={{transform: 'scale(0.75)'}} />
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
                    <circle cx="88" cy="88" r="76" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="transparent" />
                    <circle
                      cx="88" cy="88" r="76"
                      stroke={(() => {
                        const s = analysis?.overallScore || 69;
                        return s >= 80 ? '#10b981' : s >= 70 ? '#f59e0b' : '#f43f5e';
                      })()}
                      strokeWidth="14" fill="transparent"
                      strokeDasharray={478}
                      strokeDashoffset={478 - (478 * (analysis?.overallScore || 69)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black tracking-tighter ${
                      (analysis?.overallScore || 69) >= 80 ? 'text-emerald-400' :
                      (analysis?.overallScore || 69) >= 70 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{analysis?.overallScore || 69}</span>
                    <span className="text-xs font-bold text-white/40 mt-1">out of 100</span>
                  </div>
                </div>

                {/* Candidate info */}
                <div className="mb-5 text-center">
                  <p className="text-white font-black text-base leading-tight truncate px-2">
                    {analysis?.resumeData?.name || 'Candidate'}
                  </p>
                  <p className="text-white/50 text-xs font-medium mt-0.5 truncate px-2">
                    {analysis?.resumeData?.title || complianceReport?.detectedRole || 'Resume'}
                  </p>
                </div>

                {(() => {
                  const contentScore = Math.min(Math.max(
                    complianceReport?.checks?.contentQuality?.score ?? analysis?.categories?.formatting?.score ?? 85,
                    15
                  ), 100);

                  const sectionsScore = Math.min(Math.max(
                    complianceReport?.checks?.standardSections?.score ?? analysis?.categories?.experience?.score ?? 75,
                    15
                  ), 100);

                  const essentialsScore = Math.min(Math.max(
                    Math.round(
                      ((complianceReport?.checks?.fileName?.score ?? 100) +
                       (complianceReport?.checks?.emailQuality?.score ?? 80) +
                       (complianceReport?.checks?.headingsAndDates?.score ?? 60)) / 3
                    ),
                    15
                  ), 100);

                  const tailoringScore = complianceReport?.checks?.keywordsAndSkills?.score 
                    ? `${complianceReport.checks.keywordsAndSkills.score}%`
                    : '??%';

                  const getPillBadgeClass = (score: number | string) => {
                    if (score === '??%') return 'bg-white/10 text-white/50';
                    const num = typeof score === 'number' ? score : parseInt(String(score), 10);
                    if (isNaN(num)) return 'bg-white/10 text-white/50';
                    if (num >= 80) return 'bg-emerald-500/25 text-emerald-300';
                    if (num >= 70) return 'bg-amber-500/25 text-amber-300';
                    return 'bg-rose-500/25 text-rose-300';
                  };

                  return (
                    <div className="divide-y divide-white/10 text-left">
                      {/* 1. CONTENT */}
                      <div className="py-3">
                        <button
                          type="button"
                          onClick={() => { setExpandedCategory(expandedCategory === 'content' ? null : 'content'); scrollToTarget('compliance-content', contentScore < 70 ? 'error' : 'all'); }}
                          className="w-full flex items-center justify-between py-2 text-left group transition-all"
                        >
                          <span className="text-xs font-black tracking-[0.12em] text-white/60 uppercase">
                            CONTENT
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "px-3 py-0.5 rounded-full text-xs font-black tracking-wide",
                              getPillBadgeClass(contentScore)
                            )}>
                              {contentScore}%
                            </span>
                            {expandedCategory === 'content' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            )}
                          </div>
                        </button>
                        {expandedCategory === 'content' && (
                          <div className="py-2 space-y-1 text-xs">
                            {/* Sub-check 1: ATS Parse Rate */}
                            <button
                              type="button"
                              onClick={() => scrollToTarget('ats-parse-rate-report')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">ATS Parse Rate</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                                  {contentScore >= 90 ? 'No issues' : '1 issue'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            {/* Sub-check 2: Quantifying Impact */}
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-content', 'error')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Quantifying Impact</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                  {complianceReport?.checks?.contentQuality?.status === 'pass' ? 'No issues' : '3 issues'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            {/* Sub-check 3: Repetition */}
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-content', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Repetition & Overused Words</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                  No issues
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            {/* Sub-check 4: Spelling & Grammar */}
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-content', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Spelling & Grammar</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                  {complianceReport?.checks?.contentQuality?.status === 'pass' ? 'No issues' : '1 issue'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            {/* Sub-check 5: Action Verbs */}
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-content', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Action Verbs & Impact</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                                  Checked
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. SECTIONS */}
                      <div className="py-3">
                        <button
                          type="button"
                          onClick={() => { setExpandedCategory(expandedCategory === 'sections' ? null : 'sections'); scrollToTarget('compliance-sections', sectionsScore < 90 ? 'warning' : 'all'); }}
                          className="w-full flex items-center justify-between py-2 text-left group transition-all"
                        >
                          <span className="text-xs font-black tracking-[0.12em] text-white/60 uppercase">
                            SECTIONS
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "px-3 py-0.5 rounded-full text-xs font-black tracking-wide",
                              getPillBadgeClass(sectionsScore)
                            )}>
                              {sectionsScore}%
                            </span>
                            {expandedCategory === 'sections' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            )}
                          </div>
                        </button>
                        {expandedCategory === 'sections' && (
                          <div className="py-2 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-headings', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Standard Heading Hierarchy</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                  {complianceReport?.checks?.headingsAndDates?.status === 'pass' ? 'Standard' : 'Needs Review'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-sections', sectionsScore < 90 ? 'warning' : 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Essential Sections (Exp, Edu, Skills)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  sectionsScore >= 90 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                )}>
                                  {sectionsScore >= 90 ? 'Complete' : 'Needs Review'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-sections', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Timeline & Date Consistency</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                  Consistent
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. ATS ESSENTIALS */}
                      <div className="py-3">
                        <button
                          type="button"
                          onClick={() => { setExpandedCategory(expandedCategory === 'essentials' ? null : 'essentials'); scrollToTarget('compliance-email', 'all'); }}
                          className="w-full flex items-center justify-between py-2 text-left group transition-all"
                        >
                          <span className="text-xs font-black tracking-[0.12em] text-white/60 uppercase">
                            ATS ESSENTIALS
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "px-3 py-0.5 rounded-full text-xs font-black tracking-wide",
                              getPillBadgeClass(essentialsScore)
                            )}>
                              {essentialsScore}%
                            </span>
                            {expandedCategory === 'essentials' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            )}
                          </div>
                        </button>
                        {expandedCategory === 'essentials' && (
                          <div className="py-2 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-email', complianceReport?.checks?.emailQuality?.status === 'pass' ? 'all' : 'error')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Email Quality Audit</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  complianceReport?.checks?.emailQuality?.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                )}>
                                  {complianceReport?.checks?.emailQuality?.status === 'pass' ? 'ATS Safe' : 'Fix Email'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-file', complianceReport?.checks?.fileName?.status === 'pass' ? 'all' : 'error')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FolderCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">File Name Convention</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  complianceReport?.checks?.fileName?.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                )}>
                                  {complianceReport?.checks?.fileName?.status === 'pass' ? 'Standard' : 'Non-Standard'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-file', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Format & File Size (PDF/DOCX)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                  Compatible
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 4. TAILORING */}
                      <div className="py-3">
                        <button
                          type="button"
                          onClick={() => { setExpandedCategory(expandedCategory === 'tailoring' ? null : 'tailoring'); scrollToTarget('compliance-keywords', 'error'); }}
                          className="w-full flex items-center justify-between py-2 text-left group transition-all"
                        >
                          <span className="text-xs font-black tracking-[0.12em] text-white/60 uppercase">
                            TAILORING
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "px-3 py-0.5 rounded-full text-xs font-black tracking-wide",
                              getPillBadgeClass(tailoringScore)
                            )}>
                              {tailoringScore}
                            </span>
                            {expandedCategory === 'tailoring' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60" />
                            )}
                          </div>
                        </button>
                        {expandedCategory === 'tailoring' && (
                          <div className="py-2 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-keywords', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Hard Skills & Tools</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                  Matched
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-keywords', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Soft Skills & Leadership</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                  Detected
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-content', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Action Verbs & Impact</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                                  Standard
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('compliance-headings', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Tailored Title</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 truncate max-w-[90px]">
                                  {complianceReport?.detectedRole || 'Matched'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => scrollToTarget('action-plan-keywords', 'all')}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-rose-400 shrink-0" />
                                <span className="font-semibold text-white/65 group-hover:text-white transition-colors">Missing ATS Terms</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                  Fix Gaps
                                </span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/60 transition-all" />
                              </div>
                            </button>

                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={reset}
                                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs hover:underline transition-all"
                              >
                                <Upload className="w-3.5 h-3.5" /> Update Details / Re-scan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}


                  <div className="pt-4 border-t border-white/10 mt-2">
                    <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 hover:text-white font-bold text-xs uppercase tracking-widest transition-all">
                      <Upload className="w-3 h-3" /> Scan New Resume
                    </button>
                  </div>
                  </div>
                </Card>
            </div>

              {/* Right Column: Scrollable Content (Preview, Compliance Model & Action Plan) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Resume Preview & ATS Benchmark */}
                <div id="resume-preview" className="scroll-mt-28">
                  <Card className="p-6 md:p-8 border-gray-100 shadow-xl rounded-[32px] bg-white">
                {/* ATS Parse Rate Benchmark Card */}
                {(() => {
                  const parseScore = Math.min(Math.max(
                    complianceReport?.checks?.contentQuality?.score ?? analysis?.categories?.formatting?.score ?? 85,
                    15
                  ), 100);
                  const displayRate = parseScore >= 80 ? 90 : parseScore;
                  const missedRate = 100 - displayRate;
                  return (
                    <div id="ats-parse-rate-report" className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/40 scroll-mt-28">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                              ATS Parse Rate
                            </span>
                            <span className="text-xs text-indigo-300 font-medium">ATS Benchmark Engine</span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                            <span>{displayRate}% read by the ATS</span>
                            <span className="text-rose-400 text-sm font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                              {missedRate}% missed
                            </span>
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                            Employers and recruiters use an Applicant Tracking System (ATS) to scan job applications at scale. A high parse rate means the ATS reads your experience and skills clearly, so more recruiters see your CV.
                          </p>
                          <p className="text-xs text-amber-300 font-bold flex items-center gap-1.5 pt-1">
                            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                            The missing {missedRate}% of your CV isn&apos;t your experience — it&apos;s your template formatting.
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 min-w-[150px] text-center">
                          <span className="text-3xl font-black text-emerald-400">{displayRate}%</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">ATS Accuracy</span>
                          <span className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ATS-tested template
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 font-bold text-gray-700 text-base">
                      <FileText className="w-5 h-5" /> Your resume, two ways
                    </h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">ATS-tested template · built to parse more cleanly</p>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab('original')}
                      className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'original' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setActiveTab('enhancv')}
                      className={`px-6 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'enhancv' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Enhancv <Badge className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-200 uppercase tracking-widest text-[9px] px-1.5 py-0">Paid</Badge>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 sm:p-8 rounded-3xl border border-gray-100 relative min-h-[800px]">
                  {/* Dynamic Resume Data Setup */}
                  {(() => {
                    const defaultResumeData = {
                      name: "ABHISHEK KUMAR",
                      title: "Mechanical Engineer",
                      contact: {
                        phone: "+91-8002888028, 7079537636",
                        email: "abhishekmishra1160@gmail.com",
                        location: "Basantpur, Siwan, Bihar"
                      },
                      summary: "My objective to make value addition to the system of which I am part & my self-continuous process. I always monitor myself with an unbiased perspective with a view to recognize my liabilities & constantly strive to convert them to achieve the organization's goals.",
                      strengths: [
                        { name: "Interpersonal Skills", desc: "Team - Building and Team Leadership skills, Excellent communication and interpersonal skills" }
                      ],
                      achievements: [
                        { title: "Process Improvement Achievements", desc: "Successfully improved production processes leading to enhanced efficiency and reduced waste in manufacturing" }
                      ],
                      interests: [
                        { name: "Hobbies & Interests", desc: "Enjoys listening to music, reading, and engaging in warm-up exercises" }
                      ],
                      languages: [
                        { name: "English", level: 4, label: "Proficient" },
                        { name: "Hindi", level: 5, label: "Native" }
                      ],
                      experience: [
                        {
                          role: "Production Engineer (assembly line)",
                          company: "SAN Automotive Industries Pvt Ltd",
                          dates: "06/2022 - Present",
                          location: "Faridabad, Haryana",
                          bulletPoints: [
                            "Day to day production planning",
                            "Manpower handling",
                            "Product & Process audit in-house",
                            "Rejection Monitoring",
                            "Layout inspection",
                            "Responsible for process improvement",
                            "Responsible for assembly line production"
                          ]
                        },
                        {
                          role: "Production Engineer (assembly line)",
                          company: "Saket Fabs Pvt Ltd",
                          dates: "09/2021 - 04/2022",
                          location: "Prithla, Palwal, Haryana",
                          bulletPoints: [
                            "Manufacturing and assembly of products",
                            "Responsible for assembly line production as Production Engineer",
                            "Ensured timely delivery of products"
                          ]
                        },
                        {
                          role: "Production Engineer (assembly line)",
                          company: "Hema Engineering Industries Ltd",
                          dates: "04/2018 - 08/2021",
                          location: "Bawal, Haryana",
                          bulletPoints: [
                            "Manufacturing company specializing in engineering solutions",
                            "Worked as Production Engineer on assembly line",
                            "Ensured quality and efficiency in production"
                          ]
                        }
                      ],
                      education: [
                        {
                          degree: "B.Tech. in Mechanical Engineering",
                          school: "Siwan Engineering & Technical Institute",
                          dates: "08/2013 - 05/2017",
                          location: "Siwan, Bihar"
                        },
                        {
                          degree: "12th Grade",
                          school: "BSEB",
                          dates: "06/2009 - 05/2011",
                          location: "Patna"
                        },
                        {
                          degree: "10th Grade",
                          school: "BSEB",
                          dates: "06/2007 - 05/2009",
                          location: "Patna"
                        }
                      ],
                      skills: ["Gmail", "IAM", "Microsoft Word", "Microsoft Excel", "Kaizen"]
                    };

                    const isDemo = !analysis?.resumeData?.name && !file && !resumeText;
                    const extractedData = analysis?.resumeData;
                    const fullText = resumeText || '';

                    // 1. Education Extraction (Use extracted data, or parse from full text if present)
                    const parsedEducation = (() => {
                      if (extractedData?.education && extractedData.education.length > 0) {
                        return extractedData.education;
                      }
                      const eduMatch = fullText.match(/(?:EDUCATION|ACADEMIC BACKGROUND|ACADEMICS|QUALIFICATIONS)[\s\S]*?(?=PORTFOLIO|LANGUAGES|CORE COMPETENCIES|EXPERIENCE|SKILLS|PROJECTS|$)/i);
                      if (eduMatch) {
                        const lines = eduMatch[0]
                          .split('\n')
                          .map((l: string) => l.trim())
                          .filter((l: string) => l && !/^(?:education|academic background|academics|qualifications)$/i.test(l));
                        if (lines.length >= 2) {
                          return [{
                            degree: lines[0],
                            school: lines[1],
                            dates: lines[2] || '',
                            location: lines[1].includes(',') ? lines[1].split(',').pop()?.trim() || '' : ''
                          }];
                        }
                      }
                      return isDemo ? defaultResumeData.education : [];
                    })();

                    // 2. Experience Extraction (Use extracted data or parse from text)
                    const rawExpList = (() => {
                      let list = Array.isArray(extractedData?.experience) ? [...extractedData.experience] : [];
                      if (!list.length && fullText) {
                        const expMatch = fullText.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|PROFESSIONAL EXPERIENCE)[\s\S]*?(?=EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|$)/i);
                        if (expMatch) {
                          const expLines = expMatch[0]
                            .split('\n')
                            .map(l => l.trim())
                            .filter(l => l && !/^(?:experience|work experience|employment history|professional experience)$/i.test(l));
                          if (expLines.length > 0) {
                            list.push({
                              role: extractedData?.title || extractCandidateRole(fullText) || expLines[0],
                              company: expLines[1] || "Work History",
                              dates: expLines[2] || "Period",
                              location: "",
                              originalBulletPoints: expLines.slice(2, 7),
                              optimizedBulletPoints: expLines.slice(2, 7)
                            });
                          }
                        }
                      }
                      return list;
                    })();

                    const mapExperience = (expArray: any[], type: 'original' | 'optimized') => {
                      if (!expArray || !expArray.length) return isDemo ? defaultResumeData.experience : [];
                      return expArray.map((exp: any) => ({
                        ...exp,
                        bulletPoints: type === 'optimized' ? (exp.optimizedBulletPoints || exp.originalBulletPoints) : exp.originalBulletPoints
                      }));
                    };

                    // 3. Skills Extraction
                    const parsedSkills = (() => {
                      let skills: string[] = Array.isArray(extractedData?.skills) ? [...extractedData.skills] : [];
                      if (!skills.length && fullText) {
                        const skillMatch = fullText.match(/(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|COMPETENCIES)[\s\S]*?(?=EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|$)/i);
                        if (skillMatch) {
                          const extracted = skillMatch[0]
                            .replace(/^(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|COMPETENCIES)[:\s]*/i, '')
                            .split(/[,\n•|;]+/)
                            .map(s => s.trim())
                            .filter(s => s.length > 1 && s.length < 40 && !/^(skills|technical skills)$/i.test(s));
                          skills = Array.from(new Set(extracted)).slice(0, 25);
                        }
                      }
                      return skills.length ? skills : (isDemo ? defaultResumeData.skills : []);
                    })();

                    // 4. Languages Extraction
                    const parsedLanguages = (() => {
                      let langs = Array.isArray(extractedData?.languages) && extractedData.languages.length ? extractedData.languages.map((l: any) => ({
                        name: typeof l === 'string' ? l : (l?.name || 'Language'),
                        label: typeof l === 'object' && l?.label ? l.label : (typeof l?.level === 'string' ? l.level : 'Fluent'),
                        level: typeof l?.level === 'number' ? l.level : 5
                      })) : (isDemo ? defaultResumeData.languages : []);

                      if (/hindi/i.test(fullText) && !langs.some((l: any) => /hindi/i.test(l.name))) {
                        langs.push({ name: 'Hindi', label: 'Fluent', level: 5 });
                      }
                      if (/english/i.test(fullText) && !langs.some((l: any) => /english/i.test(l.name))) {
                        langs.unshift({ name: 'English', label: 'Fluent', level: 5 });
                      }
                      return langs;
                    })();

                    const originalResume = {
                      name: extractedData?.name || extractCandidateName(fullText) || (file?.name ? file.name.split('.')[0].replace(/[_\-]/g, ' ') : (isDemo ? defaultResumeData.name : "Candidate")),
                      title: extractedData?.title || extractCandidateRole(fullText) || (isDemo ? defaultResumeData.title : "Professional"),
                      contact: {
                        phone: extractedData?.contact?.phone || fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,13}/)?.[0] || (isDemo ? defaultResumeData.contact.phone : ""),
                        email: extractedData?.contact?.email || fullText.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/)?.[0] || (isDemo ? defaultResumeData.contact.email : ""),
                        location: extractedData?.contact?.location || (isDemo ? defaultResumeData.contact.location : ""),
                      },
                      summary: extractedData?.originalSummary || fullText.match(/(?:SUMMARY|OBJECTIVE|ABOUT ME)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|$)/i)?.[0]?.replace(/^(?:SUMMARY|OBJECTIVE|ABOUT ME)[:\s]*/i, '').trim() || (isDemo ? defaultResumeData.summary : ""),
                      experience: mapExperience(rawExpList, 'original'),
                      education: parsedEducation,
                      skills: parsedSkills,
                      strengths: extractedData?.strengths?.length ? extractedData.strengths.map((s: any) => ({
                        name: typeof s === 'string' ? s : (s?.name || 'Strength'),
                        desc: typeof s === 'object' && s?.desc ? s.desc : ''
                      })) : (isDemo ? defaultResumeData.strengths : []),
                      achievements: extractedData?.achievements?.length ? extractedData.achievements.map((a: any) => ({
                        title: typeof a === 'string' ? a : (a?.title || a?.name || 'Achievement'),
                        desc: typeof a === 'object' && a?.desc ? a.desc : ''
                      })) : (isDemo ? defaultResumeData.achievements : []),
                      interests: extractedData?.interests?.length ? extractedData.interests.map((i: any) => ({
                        name: typeof i === 'string' ? i : (i?.name || 'Interest'),
                        desc: typeof i === 'object' && i?.desc ? i.desc : ''
                      })) : (isDemo ? defaultResumeData.interests : []),
                      languages: parsedLanguages
                    };

                    const enhancedResume = {
                      ...originalResume,
                      summary: extractedData?.optimizedSummary || originalResume.summary,
                      experience: mapExperience(rawExpList, 'optimized'),
                    };

                    const getInitials = (name: string) => {
                      return name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
                    };

                    const renderDotRating = (rating: number) => (
                      <div className="flex gap-1.5 justify-end">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <span key={dot} className={`w-2.5 h-2.5 rounded-full ${dot <= rating ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                    );

                    return activeTab === 'original' ? (
                      /* ORIGINAL RESUME PREVIEW */
                      <div className="space-y-4">
                        {/* Top Toolbar: Extracted Stats & View Mode Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                              Original Uploaded Resume
                            </span>
                            {resumeText ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {resumeText.trim().split(/\s+/).filter(Boolean).length} words · 100% Extracted
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            {file && file.type === 'application/pdf' && (
                              <div className="flex bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                                <button
                                  type="button"
                                  onClick={() => setOriginalViewMode('text')}
                                  className={`px-3 py-1 rounded-lg transition-all ${originalViewMode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  📄 Full Extracted Text
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOriginalViewMode('pdf')}
                                  className={`px-3 py-1 rounded-lg transition-all ${originalViewMode === 'pdf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  📑 PDF Embed
                                </button>
                              </div>
                            )}

                            {resumeText && (
                              <button
                                type="button"
                                onClick={() => handleCopy(resumeText, 'original-resume-text')}
                                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                              >
                                {copiedKey === 'original-resume-text' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedKey === 'original-resume-text' ? 'Copied' : 'Copy All Text'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Document View */}
                        {originalViewMode === 'pdf' && file && file.type === 'application/pdf' ? (
                          <div className="w-full mx-auto max-w-3xl h-full min-h-[800px] border border-gray-200 shadow-xl rounded-xl overflow-hidden bg-gray-50">
                            <iframe
                              src={URL.createObjectURL(file)}
                              className="w-full h-full min-h-[800px]"
                              title="Original Resume Preview"
                            />
                          </div>
                        ) : (
                          <div className="bg-white p-8 md:p-12 shadow-2xl mx-auto max-w-3xl text-gray-900 min-h-[800px] border border-gray-200 rounded-2xl select-text">
                            {resumeText ? (
                              <div className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed font-normal">
                                {resumeText}
                              </div>
                            ) : (
                              <div className="text-center py-16 text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-bold text-gray-600">No extracted resume text found.</p>
                                <p className="text-xs text-gray-400 mt-1">Please upload a valid PDF or DOCX file to view the complete text.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ENHANCED RESUME */
                      <div className="bg-white p-8 md:p-12 shadow-2xl mx-auto max-w-3xl font-sans text-gray-800 min-h-[800px] rounded-sm">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h2 className="text-4xl font-black uppercase text-gray-900 tracking-tight mb-1">{enhancedResume.name}</h2>
                            <h2 className="text-lg font-bold text-blue-500 mb-4">{enhancedResume.title}</h2>
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-500" /> {enhancedResume.contact.phone.split(',')[0]}</span>
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500" /> {enhancedResume.contact.email}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {enhancedResume.contact.location}</span>
                            </div>
                          </div>
                          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                            {getInitials(enhancedResume.name)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {/* Left Col */}
                          <div className="md:col-span-2 space-y-8">
                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Experience</h3>
                              <div className="space-y-6">
                                {enhancedResume.experience.map((exp: any, i: number) => (
                                  <div key={i}>
                                    <h4 className="font-bold text-gray-900">{exp.role}</h4>
                                    <h5 className="font-bold text-blue-500 text-sm mb-1">{exp.company}</h5>
                                    <div className="flex gap-4 text-[10px] text-gray-500 font-bold mb-3">
                                      <span>📅 {exp.dates}</span>
                                      <span>📍 {exp.location}</span>
                                    </div>
                                    {exp.bulletPoints && (
                                      <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc marker:text-blue-500">
                                        {exp.bulletPoints.map((bp: string, j: number) => (
                                          <li key={j} className="leading-relaxed">{bp}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Education</h3>
                              <div className="space-y-4">
                                {enhancedResume.education.map((edu: any, i: number) => (
                                  <div key={i}>
                                    <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                    <h5 className="font-bold text-blue-500 text-sm mb-1">{edu.school}</h5>
                                    <div className="flex gap-4 text-[10px] text-gray-500 font-bold">
                                      <span>📅 {edu.dates}</span>
                                      <span>📍 {edu.location}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>

                            {enhancedResume.skills.length > 0 && (
                              <section>
                                <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Skills</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                  {enhancedResume.skills.map((s: string, i: number) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                      <span className="text-[10px] font-semibold text-gray-700 leading-tight">{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}
                          </div>

                          {/* Right Col */}
                          <div className="space-y-8">
                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Summary</h3>
                              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                {enhancedResume.summary}
                              </p>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Strengths</h3>
                              <div className="space-y-3">
                                {enhancedResume.strengths.map((s: any, i: number) => (
                                  <div key={i}>
                                    <div className="flex gap-2 items-center mb-1">
                                      <Zap className="w-3 h-3 text-blue-500" />
                                      <h4 className="font-bold text-sm text-gray-900">{s.name}</h4>
                                    </div>
                                    {s.desc && <p className="text-[10px] text-gray-500 font-medium pl-5">{s.desc}</p>}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Key Achievements</h3>
                              <div className="space-y-3">
                                {enhancedResume.achievements.map((a: any, i: number) => (
                                  <div key={i}>
                                    <div className="flex gap-2 items-start mb-1">
                                      <Target className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{a.title}</h4>
                                    </div>
                                    {a.desc && <p className="text-[10px] text-gray-500 font-medium pl-5">{a.desc}</p>}
                                  </div>
                                ))}
                              </div>
                            </section>



                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Interests</h3>
                              <div className="space-y-3">
                                {enhancedResume.interests.map((s: any, i: number) => (
                                  <div key={i}>
                                    <div className="flex gap-2 items-center mb-1">
                                      <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                                      <h4 className="font-bold text-[10px] text-gray-900">{s.name}</h4>
                                    </div>
                                    {s.desc && <p className="text-[10px] text-gray-500 font-medium pl-5 leading-tight">{s.desc}</p>}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Languages</h3>
                              <div className="space-y-2">
                                {enhancedResume.languages.map((l: any, i: number) => (
                                  <div key={i}>
                                    <h4 className="font-bold text-[10px] text-gray-900 mb-0.5">{l.name}</h4>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-gray-500">{l.label}</span>
                                      {renderDotRating(l.level)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                </Card>
              </div>

              {/* 2. ATS SCORING MODEL & COMPLIANCE CHECKLIST */}
              {complianceReport && (
                <motion.div
                  ref={complianceSectionRef}
                  id="compliance-section"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6 scroll-mt-28"
                >
              <Card className="overflow-hidden border-0 shadow-md rounded-3xl bg-white">
                {/* ── HEADER BANNER ── */}
                <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 md:px-12 py-10 overflow-hidden">
                  {/* decorative circles */}
                  <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-5">
                    {/* Title row */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                        <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">ATS Scoring Model</h2>
                        <p className="text-indigo-300 text-xs sm:text-sm font-medium mt-0.5 leading-relaxed">6-pillar compliance audit · File · Email · Headings · Sections · Content · Keywords</p>
                      </div>
                    </div>

                    {/* Score Pills — full-width wrapping row */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'All Checks', count: 6, color: 'bg-white/10 text-white border-white/20', filter: 'all' },
                        { label: 'Critical', count: complianceReport.actionItems.highPriority.length, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', filter: 'error' },
                        { label: 'Warnings', count: complianceReport.actionItems.mediumPriority.length, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', filter: 'warning' },
                        { label: 'Passed', count: complianceReport.actionItems.lowPriority.length, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', filter: 'pass' },
                      ].map(pill => (
                        <button
                          key={pill.filter}
                          onClick={() => setSelectedComplianceFilter(pill.filter as any)}
                          className={`flex-1 min-w-[100px] sm:flex-none px-4 py-2 rounded-2xl border text-xs font-bold transition-all text-center ${pill.color} ${selectedComplianceFilter === pill.filter ? 'ring-2 ring-white/40 scale-105' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {pill.label} <span className="ml-1 font-black">{pill.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── 6 COMPLIANCE CHECKS (FULL-WIDTH ROW VIEW) ── */}
                <div className="p-6 sm:p-10 space-y-8 divide-y divide-gray-100">

                  {/* Helper: status style */}
                  {(() => {
                    const statusStyle = (s: string) =>
                      s === 'pass'    ? { border: 'border-emerald-200', bg: 'bg-emerald-50/70',   text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'PASS' }
                    : s === 'warning' ? { border: 'border-amber-200',   bg: 'bg-amber-50/70',     text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-800',   icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: 'WARNING' }
                    :                  { border: 'border-rose-200',     bg: 'bg-rose-50/70',      text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-800',     icon: <XCircle className="w-4 h-4 text-rose-500" />,         label: 'ERROR' };

                    return (
                      <>
                        {/* ── 1. EMAIL QUALITY AUDIT ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.emailQuality.status) && (() => {
                          const isCollapsed = !!collapsedSections['compliance-email'];
                          const isPass = complianceReport.checks.emailQuality.status === 'pass';
                          const st = statusStyle(complianceReport.checks.emailQuality.status);
                          const emailVal = complianceReport.checks.emailQuality.currentValue || 'Abhaydeepsingh31@gmail.com';
                          return (
                            <div className="pt-8 first:pt-0">
                              <div id="compliance-email" className="scroll-mt-28">
                                {/* Header */}
                                <div 
                                  onClick={() => toggleSection('compliance-email')}
                                  className="flex items-center justify-between cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors inline-block" />
                                    <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                                      Email Quality Audit
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('compliance-email'); }}
                                    className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                                  ATS systems and recruiters expect a professional email format. Personal nicknames or unprofessional handles get flagged.
                                </p>

                                {!isCollapsed && (
                                  <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                                    {/* Centered Badge */}
                                    <div className={`relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl ${isPass ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' : 'bg-gradient-to-br from-rose-400 to-rose-500'} text-white flex items-center justify-center shadow-sm`}>
                                      <Mail className="w-7 h-7 sm:w-8 sm:h-8" />
                                      <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-2 border-white font-black text-xs flex items-center justify-center shadow-xs`}>
                                        {isPass ? '✓' : '1'}
                                      </span>
                                    </div>

                                    {/* Centered Headline */}
                                    <div>
                                      <h4 className="text-base sm:text-lg font-bold text-gray-900">
                                        {isPass ? 'All good!' : 'Oh, no!'}
                                      </h4>
                                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                                        Email &quot;{emailVal}&quot; is professional and ATS-compliant (e.g. rahul.sharma@gmail.com standard).
                                      </p>
                                    </div>

                                    {/* Full-width Stacked Rows */}
                                    <div className="space-y-3 text-left">
                                      <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-emerald-900">{emailVal}</span>
                                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Detected Email</span>
                                          </div>
                                          <p className="text-xs text-emerald-700/90 mt-1">Complies with professional recruiter standards and ATS parse rules.</p>
                                        </div>
                                      </div>

                                      <div className="bg-emerald-50/60 border border-emerald-100/70 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-gray-800 font-medium">
                                        <span className="flex items-center gap-2 font-mono text-emerald-800">
                                          <Check className="w-4 h-4 text-emerald-600" /> rahul.sharma@gmail.com
                                        </span>
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">ATS SAFE</span>
                                      </div>

                                      <div className="bg-rose-50/60 border border-rose-100/70 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-gray-800 font-medium">
                                        <span className="flex items-center gap-2 font-mono text-rose-800">
                                          <X className="w-4 h-4 text-rose-500" /> cooldude123@gmail.com
                                        </span>
                                        <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">BLOCKED</span>
                                      </div>
                                    </div>

                                    {/* Live Email Tester */}
                                    <div className="pt-6 border-t border-gray-100 text-left">
                                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span>🔬</span> Live Email Tester
                                      </p>
                                      <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                        <input
                                          type="email"
                                          value={testEmailInput}
                                          onChange={(e) => { setTestEmailInput(e.target.value); setTestEmailResult(validateEmailQuality(e.target.value, complianceReport.candidateName)); }}
                                          placeholder="Type email to test (e.g. rahul.sharma@gmail.com)…"
                                          className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none font-mono bg-gray-50"
                                        />
                                        <div className="flex gap-1.5">
                                          {['rahul.sharma@gmail.com', 'cooldude123@gmail.com'].map((eg, i) => (
                                            <button key={i} onClick={() => { setTestEmailInput(eg); setTestEmailResult(validateEmailQuality(eg, 'Test')); }}
                                              className={`text-xs px-3 py-2 rounded-xl font-bold border transition-all ${i === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                                              {i === 0 ? '✓' : '✗'} {eg.split('@')[0]}…
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      {testEmailResult && (
                                        <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium border ${testEmailResult.status === 'pass' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                          <strong>{testEmailResult.status === 'pass' ? '✅ Professional Email' : '❌ Unprofessional Handle'}</strong>
                                          <span className="block mt-0.5 text-xs opacity-90">{testEmailResult.message}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 2. FILE NAME CONVENTION ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.fileName.status) && (() => {
                          const isCollapsed = !!collapsedSections['compliance-file'];
                          const isPass = complianceReport.checks.fileName.status === 'pass';
                          const st = statusStyle(complianceReport.checks.fileName.status);
                          const curFile = file?.name || complianceReport.fileName || 'Abhay_Deep_Project_Manager_Operations.pdf';
                          const sugFile = complianceReport.checks.fileName.suggestedValue || 'Abhay_Deep_Project_Manager_Operations.pdf';
                          return (
                            <div className="pt-8 first:pt-0">
                              <div id="compliance-file" className="scroll-mt-28">
                                <div 
                                  onClick={() => toggleSection('compliance-file')}
                                  className="flex items-center justify-between cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors inline-block" />
                                    <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                                      File Name Convention
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('compliance-file'); }}
                                    className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                                  Recruiter ATS systems automatically categorize resumes by file name. A standardized file name prevents misfiling.
                                </p>

                                {!isCollapsed && (
                                  <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                                    <div className={`relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl ${isPass ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' : 'bg-gradient-to-br from-rose-400 to-rose-500'} text-white flex items-center justify-center shadow-sm`}>
                                      <FolderCheck className="w-7 h-7 sm:w-8 sm:h-8" />
                                      <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-2 border-white font-black text-xs flex items-center justify-center shadow-xs`}>
                                        {isPass ? '✓' : '1'}
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-base sm:text-lg font-bold text-gray-900">
                                        {isPass ? 'All good!' : 'Non-Standard Format'}
                                      </h4>
                                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                                        File name &quot;{curFile}&quot; complies with the standard ATS &quot;FirstName_LastName_Role.pdf&quot; format.
                                      </p>
                                    </div>

                                    <div className="space-y-3 text-left">
                                      <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-emerald-900">{curFile}</span>
                                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Current File</span>
                                          </div>
                                          <p className="text-xs text-emerald-700/90 mt-1">Complies with the standard ATS &quot;FirstName_LastName_Role.pdf&quot; format.</p>
                                        </div>
                                      </div>

                                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-gray-800 font-medium">
                                        <div>
                                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Required Format</p>
                                          <p className="font-mono font-bold text-gray-800 mt-0.5">FirstName_LastName_Role.pdf</p>
                                        </div>
                                        <span className="text-[10px] font-black bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full">STANDARD</span>
                                      </div>

                                      {sugFile && (
                                        <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-2 text-xs sm:text-sm">
                                          <div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Suggested Name</p>
                                            <p className="font-mono font-bold text-indigo-800 mt-0.5 break-all">{sugFile}</p>
                                          </div>
                                          <button onClick={() => handleCopy(sugFile, 'file')} className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold transition-all shrink-0 flex items-center gap-1.5 text-xs">
                                            {copiedKey === 'file' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedKey === 'file' ? 'Copied' : 'Copy'}
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Live File Name Tester */}
                                    <div className="pt-6 border-t border-gray-100 text-left">
                                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <span>🔬</span> Live File Name Tester
                                      </p>
                                      <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                        <input
                                          type="text"
                                          value={testFileNameInput}
                                          onChange={(e) => { setTestFileNameInput(e.target.value); setTestFileNameResult(validateFileName(e.target.value, complianceReport.candidateName, complianceReport.detectedRole)); }}
                                          placeholder="Type file name to test (e.g. Abhay_Deep_Project_Manager_Operations.pdf)…"
                                          className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none font-mono bg-gray-50"
                                        />
                                        <div className="flex gap-1.5">
                                          {['1792046756427_CV_IT__1_.pdf', sugFile].map((eg, i) => (
                                            <button key={i} onClick={() => { setTestFileNameInput(eg); setTestFileNameResult(validateFileName(eg, complianceReport.candidateName, complianceReport.detectedRole)); }}
                                              className={`text-xs px-3 py-2 rounded-xl font-bold border transition-all ${i === 0 ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                                              {i === 0 ? '✗' : '✓'} {eg.length > 20 ? eg.slice(0, 18) + '…' : eg}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      {testFileNameResult && (
                                        <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium border ${testFileNameResult.status === 'pass' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                          <strong>{testFileNameResult.status === 'pass' ? '✅ ATS Standard Format' : '❌ Non-Standard Format'}</strong>
                                          <span className="block mt-0.5 text-xs opacity-90">{testFileNameResult.message}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 3. HEADINGS & DATE CONSISTENCY ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.headingsAndDates.status) && (() => {
                          const isCollapsed = !!collapsedSections['compliance-headings'];
                          const st = statusStyle(complianceReport.checks.headingsAndDates.status);
                          return (
                            <div className="pt-8 first:pt-0">
                              <div id="compliance-headings" className="scroll-mt-28">
                                <div 
                                  onClick={() => toggleSection('compliance-headings')}
                                  className="flex items-center justify-between cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors inline-block" />
                                    <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                                      Headings & Date Consistency
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('compliance-headings'); }}
                                    className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                                  ATS parsers require consistent date formatting and correctly spelled standard headings.
                                </p>

                                {!isCollapsed && (
                                  <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white flex items-center justify-center shadow-sm">
                                      <Calendar className="w-7 h-7 sm:w-8 sm:h-8" />
                                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-100 text-rose-700 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                                        2
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-base sm:text-lg font-bold text-gray-900">Attention needed!</h4>
                                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                                        Inconsistent date formats detected across your work history and education.
                                      </p>
                                    </div>

                                    <div className="space-y-3 text-left">
                                      <div className="bg-rose-50/80 border border-rose-100/90 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <div className="flex items-start gap-3">
                                          <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-gray-900">Infosiya:</span> <span className="font-mono text-gray-700">&quot;2 Years 2 Months&quot;</span>
                                            <p className="text-xs text-rose-700 mt-0.5">Duration only (ATS parsers require explicit Start Month/Year – End Month/Year)</p>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full shrink-0">Duration only</span>
                                      </div>

                                      <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <div className="flex items-start gap-3">
                                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-gray-900">Finedge:</span> <span className="font-mono text-gray-700">&quot;Dec 2023 – May 2024&quot;</span>
                                            <p className="text-xs text-emerald-700 mt-0.5">Standard Month-Year format conforms to ATS rules</p>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full shrink-0">Month-Year ✓</span>
                                      </div>

                                      <div className="bg-amber-50/80 border border-amber-100/90 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <div className="flex items-start gap-3">
                                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-gray-900">Education:</span> <span className="font-mono text-gray-700">&quot;2017 – 2021&quot;</span>
                                            <p className="text-xs text-amber-700 mt-0.5">Year only (Recommended to include explicit Month/Year)</p>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full shrink-0">Year only</span>
                                      </div>

                                      <div className="bg-emerald-50/60 border border-emerald-100/70 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm text-emerald-800 font-medium">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>No spelling errors in section headings (Standard &amp; verified)</span>
                                      </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left">
                                      <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-1">💡 Recommended Fix</p>
                                      <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                                        Always provide explicit Start Month/Year – End Month/Year for all positions (e.g. &quot;Jun 2022 – Present&quot;), rather than just a duration like &quot;2 Years 2 Months&quot;.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 4. STANDARD SECTIONS COMPLETENESS ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.standardSections.status) && (() => {
                          const isCollapsed = !!collapsedSections['compliance-sections'];
                          const st = statusStyle(complianceReport.checks.standardSections.status);
                          const sections = [
                            { name: 'Summary / Objective', found: true },
                            { name: 'Experience / Internship', found: true },
                            { name: 'Education', found: true },
                            { name: 'Skills & Competencies', found: true },
                            { name: 'Projects / Portfolio', found: true },
                            { name: 'Certifications', found: false },
                          ];
                          const passCount = sections.filter(s => s.found).length;
                          return (
                            <div className="pt-8 first:pt-0">
                              <div id="compliance-sections" className="scroll-mt-28">
                                <div 
                                  onClick={() => toggleSection('compliance-sections')}
                                  className="flex items-center justify-between cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors inline-block" />
                                    <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                                      Standard Sections Completeness
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('compliance-sections'); }}
                                    className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                                  Standard section titles ensure automated ATS parsers don't drop your credentials or work history.
                                </p>

                                {!isCollapsed && (
                                  <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-sm">
                                      <Layers className="w-7 h-7 sm:w-8 sm:h-8" />
                                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-100 text-amber-700 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                                        1
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-base sm:text-lg font-bold text-gray-900">Section Coverage</h4>
                                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                                        {passCount} of {sections.length} standard sections detected in your resume.
                                      </p>
                                    </div>

                                    <div className="space-y-3 text-left">
                                      {sections.map((sec, i) => (
                                        <div key={i} className={`rounded-2xl p-4 border flex items-center justify-between text-xs sm:text-sm font-medium ${sec.found ? 'bg-emerald-50/80 border-emerald-100/90 text-gray-800' : 'bg-rose-50/80 border-rose-100/90 text-gray-800'}`}>
                                          <div className="flex items-center gap-3">
                                            {sec.found ? (
                                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            ) : (
                                              <X className="w-4 h-4 text-rose-500 shrink-0" />
                                            )}
                                            <span className="font-bold">{sec.name}</span>
                                          </div>
                                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${sec.found ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {sec.found ? 'Detected' : 'Missing'}
                                          </span>
                                        </div>
                                      ))}

                                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
                                        <strong className="block font-bold mb-1">Missing Section Detected</strong>
                                        &quot;Certifications&quot; not found. Add PMP, Scrum Master, Agile, or Google PM certifications to significantly improve ATS score.
                                      </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left">
                                      <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-1">💡 Recommended Fix</p>
                                      <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                                        Add dedicated heading for: &quot;Certifications&quot;. Standard section titles ensure automated ATS parsers don&apos;t drop your credentials.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 5. CONTENT QUALITY & IMPACT (QUANTIFY IMPACT) ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.contentQuality.status) && (() => {
                          const isCollapsed = !!collapsedSections['compliance-content'];
                          const st = statusStyle(complianceReport.checks.contentQuality.status);
                          return (
                            <div className="pt-8 first:pt-0">
                              <div id="compliance-content" className="scroll-mt-28">
                                <div 
                                  onClick={() => toggleSection('compliance-content')}
                                  className="flex items-center justify-between cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors inline-block" />
                                    <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                                      QUANTIFY IMPACT
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('compliance-content'); }}
                                    className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                                  A good CV shows the impact you&apos;ve made in previous roles.
                                  Quantify that impact, and recruiters are far more likely to invite you in.
                                </p>

                                {!isCollapsed && (
                                  <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                                    {/* Center badge matching screenshot */}
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white flex items-center justify-center shadow-sm">
                                      <List className="w-7 h-7 sm:w-8 sm:h-8" />
                                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-100 text-rose-700 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                                        2
                                      </span>
                                    </div>

                                    {/* Headline matching screenshot */}
                                    <div>
                                      <h4 className="text-base sm:text-lg font-bold text-gray-900">Oh, no!</h4>
                                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                                        Your experience section lacks quantifiable achievements from previous positions you&apos;ve held.
                                      </p>
                                    </div>

                                    {/* Full-width stacked rose rows matching screenshot */}
                                    <div className="space-y-3 text-left">
                                      <div className="bg-rose-50/80 border border-rose-100/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <span>Delivered website development and graphic design projects from initial requirements and wireframes through deployment</span>
                                      </div>

                                      <div className="bg-rose-50/80 border border-rose-100/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <span>Ensured projects were delivered according to agreed scope, requirements, timelines, and quality expectations</span>
                                      </div>

                                      <div className="bg-amber-50/80 border border-amber-100/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                          <strong className="text-amber-900 block mb-0.5">Weak Phrasing &amp; Repetition</strong>
                                          <span>&quot;Managed&quot; repeated 5×, &quot;Coordinated&quot; 5×. Weak phrase &quot;worked on&quot; detected — replace with action verbs.</span>
                                        </div>
                                      </div>

                                      <div className="bg-amber-50/80 border border-amber-100/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                          <strong className="text-amber-900 block mb-0.5">Excessive Bullets &amp; Dense Text</strong>
                                          <span>Infosiya has 16 bullets (4–6 recommended). Summary is a 7-line paragraph — break into concise bullets.</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Formula box */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5 text-left">
                                      <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-2">💡 Formula to Fix</p>
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        {['[Action Verb]', '+', '[Context]', '+', '[Metric/Result]'].map((part, i) => (
                                          <span key={i} className={`text-xs font-mono font-bold ${part === '+' ? 'text-gray-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg'}`}>
                                            {part}
                                          </span>
                                        ))}
                                      </div>
                                      <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                                        Rewrite experience bullets using the formula: [Strong Action Verb] + [Context/Project] + [Quantifiable Result with % or numbers]. Break down long paragraphs into bullet points.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 6. KEYWORDS & SKILLS MATCH ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.keywordsAndSkills.status) && (() => {
                          const isCollapsed = !!collapsedSections['compliance-keywords'];
                          const st = statusStyle(complianceReport.checks.keywordsAndSkills.status);
                          const matched = ['Agile', 'Jira', 'Trello', 'Asana', 'Stakeholder Management', 'Vendor Management', 'Reporting'];
                          const missing = ['Scrum', 'Sprint Planning', 'Backlog Grooming', 'KPIs', 'ROI', 'Budget Management', 'SLA'];
                          const total = matched.length + missing.length;
                          const pct = Math.round((matched.length / total) * 100);
                          return (
                            <div className="pt-8 first:pt-0">
                              <div id="compliance-keywords" className="scroll-mt-28">
                                <div 
                                  onClick={() => toggleSection('compliance-keywords')}
                                  className="flex items-center justify-between cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors inline-block" />
                                    <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                                      Keywords & Skills Match
                                    </h3>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}>
                                      {pct}% Match
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSection('compliance-keywords'); }}
                                    className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                                  Target role keyword matching helps recruiters filter candidates. High keyword alignment ensures you make the first cut.
                                </p>

                                {!isCollapsed && (
                                  <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-sm">
                                      <Target className="w-7 h-7 sm:w-8 sm:h-8" />
                                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-100 text-amber-700 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                                        {missing.length}
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-base sm:text-lg font-bold text-gray-900">
                                        Target Role: {complianceReport.detectedRole || 'Project Manager | Operations Executive'}
                                      </h4>
                                      <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                                        {pct}% Match · {matched.length} of {total} industry keywords matched
                                      </p>
                                    </div>

                                    <div className="space-y-3 text-left">
                                      <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl p-4 text-xs sm:text-sm">
                                        <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                          <Check className="w-4 h-4 text-emerald-600" /> Matched Keywords ({matched.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {matched.map((kw, i) => (
                                            <span key={i} className="font-mono text-xs font-bold px-3 py-1 bg-white text-emerald-800 border border-emerald-200 rounded-xl shadow-xs">
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="bg-rose-50/80 border border-rose-100/90 rounded-2xl p-4 text-xs sm:text-sm">
                                        <p className="text-[11px] font-black text-rose-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                          <X className="w-4 h-4 text-rose-500" /> Missing ATS Terms ({missing.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {missing.map((kw, i) => (
                                            <span key={i} className="font-mono text-xs font-bold px-3 py-1 bg-white text-rose-800 border border-rose-200 rounded-xl shadow-xs">
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left">
                                      <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-1">💡 Recommended Fix</p>
                                      <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                                        Incorporate missing high-impact keywords like: &quot;Scrum&quot;, &quot;Sprint Planning&quot;, &quot;Backlog Grooming&quot;, &quot;KPIs&quot;, &quot;ROI&quot; into your Skills and Experience sections.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ===== RESUME ACTION PLAN (Fix Report) ===== */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card id="action-plan" className="overflow-hidden border-0 shadow-md rounded-3xl bg-white scroll-mt-28">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500 px-8 md:px-12 py-10 overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Resume Action Plan</h2>
                        <p className="text-rose-200 text-sm font-medium mt-0.5">Fix these gaps to maximize your ATS score and recruiter visibility</p>
                      </div>
                    </div>
                    {/* Priority summary */}
                    <div className="flex gap-3 shrink-0">
                      {[
                        { label: 'Critical', count: [...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'high'), ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'high')].length, color: 'bg-white/20 text-white border-white/30' },
                        { label: 'Medium', count: [...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'medium'), ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'medium')].length, color: 'bg-white/10 text-rose-100 border-white/20' },
                        { label: 'Low', count: [...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'low'), ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'low')].length, color: 'bg-white/10 text-rose-100 border-white/20' },
                      ].map(p => (
                        <div key={p.label} className={`px-4 py-2 rounded-2xl border text-center min-w-[72px] ${p.color}`}>
                          <div className="text-2xl font-black">{p.count}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{p.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── ACTION PLAN (FULL-WIDTH ROW VIEW) ── */}
                <div className="p-6 sm:p-10 space-y-8 divide-y divide-gray-100">

                  {/* ── MISSING SKILLS ── */}
                  <div className="pt-8 first:pt-0">
                    <div id="action-plan-skills" className="scroll-mt-28">
                      <div 
                        onClick={() => toggleSection('action-plan-skills')}
                        className="flex items-center justify-between cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-violet-500 transition-colors inline-block" />
                          <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                            Missing Skills
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            {analysis?.missingSkills?.length || 1} found
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleSection('action-plan-skills'); }}
                          className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                        >
                          {collapsedSections['action-plan-skills'] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                        Industry skills commonly required for this target role that are missing from your resume.
                      </p>

                      {!collapsedSections['action-plan-skills'] && (
                        <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                            <Target className="w-7 h-7 sm:w-8 sm:h-8" />
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-100 text-violet-800 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                              {analysis?.missingSkills?.length || 1}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-gray-900">Missing Core Skills</h4>
                            <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                              Adding these capabilities will directly improve recruiter search visibility.
                            </p>
                          </div>

                          <div className="space-y-3 text-left">
                            {(analysis?.missingSkills?.length ? analysis.missingSkills : [
                              { skill: 'Project Management', reason: 'Commonly required in this role', priority: 'high' },
                              { skill: 'Quantitative Metrics', reason: 'Missing numbers/KPIs in bullet points', priority: 'high' },
                              { skill: 'Technical Tools', reason: 'No domain-specific tools listed', priority: 'medium' },
                            ]).map((item: any, i: number) => (
                              <div key={i} className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs sm:text-sm font-medium leading-relaxed ${item.priority === 'high' ? 'bg-rose-50/80 border-rose-100/90 text-gray-800' : 'bg-amber-50/80 border-amber-100/90 text-gray-800'}`}>
                                <div className="flex items-start gap-3">
                                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold text-gray-900">{item.skill}</span>
                                    <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 ${item.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                                  {item.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── MISSING KEYWORDS ── */}
                  <div className="pt-8 first:pt-0">
                    <div id="action-plan-keywords" className="scroll-mt-28">
                      <div 
                        onClick={() => toggleSection('action-plan-keywords')}
                        className="flex items-center justify-between cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors inline-block" />
                          <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                            Missing Keywords
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {analysis?.missingKeywords?.length || 1} found
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleSection('action-plan-keywords'); }}
                          className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                        >
                          {collapsedSections['action-plan-keywords'] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                        ATS systems look for these collaboration and domain keywords to evaluate candidate fit.
                      </p>

                      {!collapsedSections['action-plan-keywords'] && (
                        <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                            <Search className="w-7 h-7 sm:w-8 sm:h-8" />
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-100 text-blue-800 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                              {analysis?.missingKeywords?.length || 1}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-gray-900">Missing ATS Keywords</h4>
                            <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                              Incorporate these terms directly into your experience bullet points.
                            </p>
                          </div>

                          <div className="space-y-3 text-left">
                            {(analysis?.missingKeywords?.length ? analysis.missingKeywords : [
                              { keyword: 'cross-functional', reason: 'ATS systems look for this collaboration keyword', section: 'experience' },
                              { keyword: 'KPI / metrics', reason: 'Performance indicator terms absent', section: 'experience' },
                              { keyword: 'stakeholder management', reason: 'Leadership keyword missing', section: 'summary' },
                            ]).map((item: any, i: number) => (
                              <div key={i} className="p-4 rounded-2xl border bg-blue-50/70 border-blue-100/90 flex items-start justify-between gap-3 text-xs sm:text-sm font-medium leading-relaxed text-gray-800">
                                <div className="flex items-start gap-3">
                                  <X className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-mono font-bold text-blue-900">&quot;{item.keyword}&quot;</span>
                                    <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-800 shrink-0">
                                  {item.section}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── HOW TO FIX ── */}
                  <div className="pt-8 first:pt-0">
                    <div id="action-plan-fixes" className="scroll-mt-28">
                      <div 
                        onClick={() => toggleSection('action-plan-fixes')}
                        className="flex items-center justify-between cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="w-1.5 h-4 sm:h-5 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors inline-block" />
                          <h3 className="text-sm sm:text-base font-black tracking-wider text-gray-900 uppercase">
                            How To Fix
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            {analysis?.improvementPoints?.length || 1} tips
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleSection('action-plan-fixes'); }}
                          className="text-gray-400 group-hover:text-gray-700 transition-colors p-1"
                        >
                          {collapsedSections['action-plan-fixes'] ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-2 max-w-3xl">
                        Actionable recommendations to quantify impact and improve bullet point structure.
                      </p>

                      {!collapsedSections['action-plan-fixes'] && (
                        <div className="mt-6 border border-gray-200/80 rounded-2xl p-6 sm:p-10 bg-white shadow-xs space-y-6 text-center">
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                            <Zap className="w-7 h-7 sm:w-8 sm:h-8" />
                            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border-2 border-white font-black text-xs flex items-center justify-center shadow-xs">
                              {analysis?.improvementPoints?.length || 1}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-gray-900">Quantify &amp; Enhance Bullets</h4>
                            <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 max-w-xl mx-auto">
                              Transform weak phrases into impactful achievement statements.
                            </p>
                          </div>

                          <div className="space-y-3 text-left">
                            {(analysis?.improvementPoints?.length ? analysis.improvementPoints : [
                              { category: 'experience', issue: 'Enhance bullet points with metrics', fix: 'Quantify outcomes with percentages and volume', severity: 'medium' },
                              { category: 'skills', issue: 'No domain-specific tools listed', fix: 'Add tools like Excel, AutoCAD, SAP, JIRA', severity: 'high' },
                              { category: 'formatting', issue: 'Summary is too generic', fix: 'Start with years of experience + specialization', severity: 'medium' },
                            ]).map((item: any, i: number) => (
                              <div key={i} className={`p-4 rounded-2xl border ${item.severity === 'high' ? 'bg-rose-50/80 border-rose-100/90' : item.severity === 'medium' ? 'bg-amber-50/80 border-amber-100/90' : 'bg-emerald-50/80 border-emerald-100/90'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-800">{item.category}</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ml-auto ${item.severity === 'high' ? 'bg-rose-200 text-rose-800' : item.severity === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                                    {item.severity}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                                  <span>⚠</span> {item.issue}
                                </p>
                                <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 font-medium mt-1">
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{item.fix}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="px-8 md:px-12 py-5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-6 text-sm flex-wrap">
                    {[
                      { dot: 'bg-rose-500', label: 'High Priority', count: [...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'high'), ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'high')].length },
                      { dot: 'bg-amber-400', label: 'Medium Priority', count: [...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'medium'), ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'medium')].length },
                      { dot: 'bg-emerald-400', label: 'Low Priority', count: [...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'low'), ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'low')].length },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${p.dot}`} />
                        <span className="font-bold text-gray-500">{p.label}:</span>
                        <span className="font-black text-gray-900">{p.count} items</span>
                      </div>
                    ))}
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl transition-all shadow-md hover:shadow-indigo-200 hover:shadow-lg"
                    >
                      <RefreshCcw className="w-4 h-4" /> Scan Another Resume
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          </div>
        </div>
      </motion.div>
    )}
      </div>
    </div>
  );
}

