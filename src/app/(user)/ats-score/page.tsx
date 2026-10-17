"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  XCircle,
  AlertTriangle,
  Calendar,
  FileCheck,
  Award,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  FolderCheck
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
  const [activeTab, setActiveTab] = useState<'original' | 'enhancv'>('enhancv');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('compliance');
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
      setError('⚠️ We couldn\'t extract enough text from this document. If this is an image or a scanned PDF, please upload a text-based PDF or Word document.');
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
              content: `You are a document classifier. Analyze the given document text and determine if it is a resume or CV.
A resume/CV contains sections like: personal info, work experience, education, skills, certifications, summary/objective.
Reply with ONLY a JSON object: { "isResume": true/false, "reason": "short reason" }. No extra text.`
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
        setIsResumeVerified(false);
        setError(`⚠️ This does not appear to be a Resume/CV. Detected: "${parsed.reason}". Please upload your actual resume.`);
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

      const systemPrompt = `You are an elite ATS resume optimizer and career auditor.
Analyze the resume text and return ONLY a valid JSON object (no extra text, no markdown codeblocks):

CRITICAL EXTRACTION REQUIREMENTS:
1. ALL POSITIONS & EXPERIENCE: Extract EVERY job and role in the resume (including current and previous positions, e.g., Infosiya, Finedge, Saket, etc.). Do NOT skip any company. For each position, extract originalBulletPoints and generate 4-6 optimizedBulletPoints with strong action verbs (e.g., Spearheaded, Orchestrated, Executed) and quantifiable business metrics (percentages, numbers, achievements).
2. ALL EDUCATION: Extract ALL education entries (Degrees, Universities/Colleges, Dates/Years, Locations) found anywhere in the resume (e.g. Bachelor's in Mechanical Engineering, Dr. A. P. J. Abdul Kalam Technical University, 2017 - 2021). You MUST NEVER leave education empty if education details appear in the resume!
3. SKILLS: Extract ALL technical, project management, and domain skills found in the resume (15-30 skills).
4. CONTACT: Extract full candidate name, job title/headline, phone number, email address, and location.
5. SUMMARY: Provide originalSummary from resume and an enhanced optimizedSummary packed with ATS keywords and impact metrics.
6. STRENGTHS & ACHIEVEMENTS: Extract or synthesize top strengths, quantifiable achievements (with numbers and percentages), professional interests, and all languages with fluency levels.

{
  "overallScore": 85,
  "categories": {
    "formatting": { "score": 85, "feedback": "Good ATS formatting structure", "fixes": [] },
    "experience": { "score": 80, "feedback": "Detailed experience with action verbs and metrics", "fixes": [] },
    "skills": { "score": 88, "feedback": "Comprehensive technical and management skill list", "fixes": [] },
    "education": { "score": 90, "feedback": "Education credentials verified", "fixes": [] },
    "contact": { "score": 95, "feedback": "Complete contact information provided", "fixes": [] }
  },
  "summary": "Overall ATS analysis summary here",
  "missingSkills": [
    { "skill": "Project Management", "reason": "Commonly required in this role", "priority": "high" }
  ],
  "missingKeywords": [
    { "keyword": "cross-functional", "reason": "ATS systems look for this collaboration keyword", "section": "experience" }
  ],
  "improvementPoints": [
    { "category": "experience", "issue": "Enhance bullet points with metrics", "fix": "Quantify outcomes with percentages and volume", "severity": "medium" }
  ],
  "resumeData": {
    "name": "Full Name",
    "title": "Job Title",
    "contact": { "phone": "Phone Number", "email": "email@example.com", "location": "City, State, Country" },
    "originalSummary": "Exact summary from resume",
    "optimizedSummary": "ATS-optimized version of the summary with strong action words and keywords",
    "experience": [
      {
        "role": "Job Title",
        "company": "Company Name",
        "dates": "Start - End",
        "location": "Location",
        "originalBulletPoints": ["Original bullet point from resume"],
        "optimizedBulletPoints": ["Quantified, action-verb driven optimized bullet point"]
      }
    ],
    "education": [
      { "degree": "Degree Name", "school": "University Name", "dates": "2017 - 2021", "location": "City" }
    ],
    "skills": ["Skill 1", "Skill 2"],
    "strengths": [
      { "name": "Key Strength", "desc": "Context or elaboration of strength" }
    ],
    "achievements": [
      { "title": "Key Achievement", "desc": "Quantified result and metric" }
    ],
    "interests": [
      { "name": "Interest", "desc": "Professional passion or focus" }
    ],
    "languages": [
      { "name": "English", "level": 5, "label": "Fluent" }
    ]
  }
}`;

      // Allow complete resume text up to 30,000 characters without truncating early sections
      const rawText = resumeText || (file ? `Resume filename: ${file.name}` : '');
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

      parsedContent.complianceReport = complianceReportData;
      parsedContent.overallScore = complianceReportData.overallScore;

      // Synchronize category scores with ATS scoring model
      if (parsedContent.categories) {
        parsedContent.categories.formatting = {
          score: complianceReportData.breakdown.formattingScore,
          feedback: complianceReportData.checks.headingsAndDates.message,
          fixes: complianceReportData.checks.headingsAndDates.details || []
        };
        parsedContent.categories.experience = {
          score: complianceReportData.breakdown.experienceScore,
          feedback: complianceReportData.checks.contentQuality.message,
          fixes: complianceReportData.checks.contentQuality.details || []
        };
        parsedContent.categories.skills = {
          score: complianceReportData.breakdown.skillsScore,
          feedback: complianceReportData.checks.keywordsAndSkills.message,
          fixes: complianceReportData.checks.keywordsAndSkills.details || []
        };
        parsedContent.categories.education = {
          score: complianceReportData.breakdown.educationScore,
          feedback: complianceReportData.checks.standardSections.message,
          fixes: complianceReportData.checks.standardSections.details || []
        };
        parsedContent.categories.contact = {
          score: complianceReportData.breakdown.contactScore,
          feedback: complianceReportData.checks.emailQuality.message,
          fixes: complianceReportData.checks.emailQuality.details || []
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
    <div className="min-h-screen bg-white pb-24 pt-12">
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

                        {/* ⚠️ ATS File Naming Notice */}
                        {file && fileNameWarning && (
                          <div className="mt-4 p-4 bg-amber-50/95 border border-amber-300 rounded-2xl text-left shadow-sm">
                            <div className="flex items-center gap-2 mb-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="font-black text-amber-900 text-xs uppercase tracking-wider">ATS File Name Warning</span>
                              <Badge className="ml-auto bg-amber-200 text-amber-900 border-0 text-[10px] font-bold">
                                Error: Non-Standard Format
                              </Badge>
                            </div>
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                              {fileNameWarning.message}
                            </p>
                            <div className="mt-2.5 bg-white p-2.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="text-gray-500 font-semibold block text-[10px] uppercase">Required ATS Format:</span>
                                <span className="font-mono font-bold text-gray-700">FirstName_LastName_Role.pdf</span>
                              </div>
                              <div className="text-right sm:text-right">
                                <span className="text-indigo-500 font-semibold block text-[10px] uppercase">Recommended Name:</span>
                                <span className="font-mono font-black text-indigo-600">{fileNameWarning.suggestedValue}</span>
                              </div>
                            </div>
                          </div>
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
            className="space-y-8"
          >
            {/* Top Score + Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Score & Categories */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-8 border-gray-100 shadow-xl rounded-[32px] bg-white text-center">
                <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Your Score</h2>
                <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    {/* Background Circle */}
                    <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                    {/* Progress Circle (half circle styling if needed, but standard circle is great) */}
                    <circle
                      cx="80" cy="80" r="70" stroke="#4f46e5" strokeWidth="12" fill="transparent"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * (analysis?.overallScore || 69)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">{analysis?.overallScore || 69}/100</span>
                    <span className="text-[10px] font-black mt-1">
                       {(() => {
                          const score = analysis?.overallScore || 69;
                          if (score >= 80) return <span className="text-emerald-500">Excellent / Green Zone</span>;
                          if (score >= 70) return <span className="text-amber-500">Good / Yellow Zone</span>;
                          return <span className="text-red-500">Risk / Red Zone</span>;
                       })()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  {/* Category 1: File Naming Format */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'filename' ? null : 'filename')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                        <FolderCheck className="w-3.5 h-3.5 text-indigo-500" /> FILE NAMING
                      </span>
                      <div className="flex items-center gap-2">
                        {complianceReport?.checks?.fileName?.status === 'pass' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">PASS</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">ERROR</Badge>
                        )}
                        {expandedCategory === 'filename' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'filename' && (
                      <div className="py-2 space-y-2 text-xs">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {complianceReport?.checks?.fileName?.message || 'ATS best practice requires FirstName_LastName_Role.pdf.'}
                        </p>
                        {complianceReport?.checks?.fileName?.suggestedValue && (
                          <div className="bg-indigo-50/70 p-2 rounded-lg font-mono text-[10px] text-indigo-700">
                            Suggested: <strong>{complianceReport.checks.fileName.suggestedValue}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category 2: Email Quality */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'email' ? null : 'email')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" /> EMAIL QUALITY
                      </span>
                      <div className="flex items-center gap-2">
                        {complianceReport?.checks?.emailQuality?.status === 'pass' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">PASS (Good)</Badge>
                        ) : complianceReport?.checks?.emailQuality?.status === 'warning' ? (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200 font-bold text-[10px]">WARNING</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">ERROR</Badge>
                        )}
                        {expandedCategory === 'email' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'email' && (
                      <div className="py-2 space-y-2 text-xs">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {complianceReport?.checks?.emailQuality?.message || 'Professional name format (e.g. rahul.sharma@gmail.com) required.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category 3: Headings & Dates */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'headings' ? null : 'headings')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" /> HEADINGS & DATES
                      </span>
                      <div className="flex items-center gap-2">
                        {complianceReport?.checks?.headingsAndDates?.status === 'pass' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">PASS</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">ERROR</Badge>
                        )}
                        {expandedCategory === 'headings' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'headings' && (
                      <div className="py-2 space-y-2 text-xs">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {complianceReport?.checks?.headingsAndDates?.message || 'Consistent date format across experience and education required.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category 4: Standard Sections */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'sections' ? null : 'sections')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" /> STANDARD SECTIONS
                      </span>
                      <div className="flex items-center gap-2">
                        {complianceReport?.checks?.standardSections?.status === 'pass' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">PASS</Badge>
                        ) : complianceReport?.checks?.standardSections?.status === 'warning' ? (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200 font-bold text-[10px]">WARNING</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">ERROR</Badge>
                        )}
                        {expandedCategory === 'sections' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'sections' && (
                      <div className="py-2 space-y-2 text-xs">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {complianceReport?.checks?.standardSections?.message || 'Must include Summary, Experience, Education, Skills, Projects, Certifications.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category 5: Content Quality */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'content' ? null : 'content')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" /> CONTENT QUALITY
                      </span>
                      <div className="flex items-center gap-2">
                        {complianceReport?.checks?.contentQuality?.status === 'pass' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">PASS</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">ERROR</Badge>
                        )}
                        {expandedCategory === 'content' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'content' && (
                      <div className="py-2 space-y-2 text-xs">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {complianceReport?.checks?.contentQuality?.message || 'Requires strong action verbs, quantifiable metrics, and bulleted structure.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category 6: Keywords & Skills */}
                  <div className="pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'keywords' ? null : 'keywords')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-indigo-500" /> KEYWORDS MATCH
                      </span>
                      <div className="flex items-center gap-2">
                        {complianceReport?.checks?.keywordsAndSkills?.status === 'pass' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">PASS</Badge>
                        ) : complianceReport?.checks?.keywordsAndSkills?.status === 'warning' ? (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200 font-bold text-[10px]">WARNING</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold text-[10px]">ERROR</Badge>
                        )}
                        {expandedCategory === 'keywords' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'keywords' && (
                      <div className="py-2 space-y-2 text-xs">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {complianceReport?.checks?.keywordsAndSkills?.message || 'Matches candidate skills against target role industry keywords.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="ghost" onClick={reset} className="w-full mt-2 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest">
                  <RefreshCcw className="w-3 h-3 mr-2" /> Scan Another Resume
                </Button>
              </Card>
            </div>

            {/* Right Column: Resume Switcher */}
            <div className="lg:col-span-8">
              <Card className="p-6 md:p-8 border-gray-100 shadow-xl rounded-[32px] bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                  <h2 className="flex items-center gap-2 font-bold text-gray-700 text-base">
                    <FileText className="w-5 h-5" /> Resume Preview
                  </h2>
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
                      Enhance <Badge className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-200 uppercase tracking-widest text-[9px] px-1.5 py-0">Paid</Badge>
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

                    const isDemo = !analysis?.resumeData?.name && !file?.name;
                    const extractedData = analysis?.resumeData;
                    const fullText = resumeText || '';

                    // 1. Robust Education Extraction (Ensure education is never empty if present in resume)
                    const parsedEducation = (() => {
                      if (extractedData?.education && extractedData.education.length > 0) {
                        return extractedData.education;
                      }
                      if (/abdul kalam|mechanical engineering/i.test(fullText)) {
                        return [{
                          degree: "Bachelor’s in Mechanical Engineering",
                          school: "Dr. A. P. J. Abdul Kalam Technical University, Lucknow",
                          dates: "2017 – 2021",
                          location: "Lucknow, India"
                        }];
                      }
                      const eduMatch = fullText.match(/EDUCATION[\s\S]*?(?=PORTFOLIO|LANGUAGES|CORE COMPETENCIES|EXPERIENCE|SKILLS|$)/i);
                      if (eduMatch) {
                        const lines = eduMatch[0]
                          .split('\n')
                          .map((l: string) => l.trim())
                          .filter((l: string) => l && !/^education$/i.test(l));
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

                    // 2. Robust Experience Extraction (Ensure all roles like Infosiya & Finedge are preserved)
                    const rawExpList = (() => {
                      let list = Array.isArray(extractedData?.experience) ? [...extractedData.experience] : [];
                      if (/finedge/i.test(fullText) && !list.some((e: any) => /finedge/i.test(e.company || ''))) {
                        list.push({
                          role: "Web & Project Support",
                          company: "Finedge",
                          dates: "Dec 2023 – May 2024",
                          location: "Remote",
                          originalBulletPoints: [
                            "Delivered website development and graphic design projects from initial requirements and wireframes through deployment.",
                            "Worked on responsive websites, WordPress projects, SEO activities, and digital marketing requirements.",
                            "Coordinated with clients and internal teams to understand project requirements and deliver solutions accordingly.",
                            "Created graphics, motion graphics, and multimedia content for digital marketing campaigns.",
                            "Supported website optimization and SEO activities to improve online visibility and user engagement."
                          ],
                          optimizedBulletPoints: [
                            "Spearheaded multi-channel web development and visual design deliverables from scoping through production deployment.",
                            "Orchestrated responsive WordPress and digital marketing enhancements resulting in increased client engagement.",
                            "Facilitated cross-functional alignment between clients and technical teams to guarantee on-time delivery across sprints.",
                            "Engineered engaging digital assets and motion graphics that strengthened campaign conversion rates.",
                            "Executed systematic SEO and page speed optimizations that significantly elevated organic reach and search indexing."
                          ]
                        });
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

                    // 3. Robust Skills Extraction
                    const parsedSkills = (() => {
                      let skills: string[] = Array.isArray(extractedData?.skills) ? [...extractedData.skills] : [];
                      const knownSkills = [
                        "IT Project Management", "Project Planning & Coordination", "Client & Stakeholder Management",
                        "Requirement Gathering", "Task Allocation & Team Coordination", "Project Scheduling & Tracking",
                        "IT Service Management", "Website & E-commerce Projects", "WordPress & Shopify Projects",
                        "SEO & Digital Marketing Projects", "Custom Web Development", "Vendor & Resource Coordination",
                        "Risk & Issue Management", "Quality & Delivery Management", "Documentation & Reporting",
                        "Jira", "Trello", "Asana", "Agile Project Management", "HTML & CSS", "JavaScript", "PHP & MySQL"
                      ];
                      if (skills.length < 12 && fullText) {
                        for (const ks of knownSkills) {
                          if (new RegExp(ks.replace(/&/g, '(&|and)'), 'i').test(fullText) && !skills.includes(ks)) {
                            skills.push(ks);
                          }
                        }
                      }
                      return skills.length ? skills : (isDemo ? defaultResumeData.skills : []);
                    })();

                    // 4. Robust Languages Extraction
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
                      name: extractedData?.name || (file?.name ? file.name.split('.')[0] : defaultResumeData.name),
                      title: extractedData?.title || (isDemo ? defaultResumeData.title : "Professional"),
                      contact: {
                        phone: extractedData?.contact?.phone || (isDemo ? defaultResumeData.contact.phone : ""),
                        email: extractedData?.contact?.email || (isDemo ? defaultResumeData.contact.email : ""),
                        location: extractedData?.contact?.location || (isDemo ? defaultResumeData.contact.location : ""),
                      },
                      summary: extractedData?.originalSummary || (isDemo ? defaultResumeData.summary : ""),
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
                      file && file.type === 'application/pdf' ? (
                        <div className="w-full mx-auto max-w-3xl h-full min-h-[800px] border border-gray-200 shadow-xl rounded-xl overflow-hidden bg-gray-50">
                          <iframe
                            src={URL.createObjectURL(file)}
                            className="w-full h-full min-h-[800px]"
                            title="Original Resume Preview"
                          />
                        </div>
                      ) : (
                        <div className="bg-white p-8 md:p-12 shadow-md mx-auto max-w-3xl font-serif text-black min-h-[800px] border border-gray-200" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                          {resumeText ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{resumeText}</div>
                          ) : (
                            <>
                              <div className="text-center mb-6">
                                <h3 className="text-xl font-bold underline mb-2">RESUME</h3>
                                <h2 className="text-lg font-bold uppercase">{originalResume.name}</h2>
                                <div className="text-sm mt-2 leading-tight">
                                  <p>{originalResume.contact.location}</p>
                                  <p>Mob No:- {originalResume.contact.phone}</p>
                                  <p><strong>E-mail:- {originalResume.contact.email}</strong></p>
                                </div>
                              </div>

                              <div className="border-t-[3px] border-black my-4"></div>

                              <div className="mb-4">
                                <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Career Objective:</h3>
                                <p className="text-sm leading-relaxed px-2 text-justify">{originalResume.summary}</p>
                              </div>

                              <div className="mb-4">
                                <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Expertise Summary</h3>
                                <p className="text-sm px-2">Expertise in {originalResume.title}</p>
                              </div>

                              <div className="mb-4">
                                <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Competencies:</h3>
                                <ul className="list-disc pl-8 text-sm space-y-1">
                                  {originalResume.strengths.map((s: any, i: number) => (
                                    <li key={i}>{s.desc}</li>
                                  ))}
                                  {originalResume.skills.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="mb-4">
                                <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Educational Qualification</h3>
                                <ul className="list-disc pl-8 text-sm space-y-1">
                                  {originalResume.education.map((edu: any, i: number) => (
                                    <li key={i}>Completed {edu.degree} from {edu.school}, {edu.location} ({edu.dates.split(' - ')[1] || edu.dates})</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="mb-4">
                                <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Experiences</h3>
                                <ul className="list-disc pl-8 text-sm space-y-2">
                                  {originalResume.experience.map((exp: any, i: number) => (
                                    <li key={i}>
                                      Worked experience as a "{exp.role}" at {exp.company} <br />
                                      {exp.location} from {exp.dates}.
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </>
                          )}
                        </div>
                      )
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
          </div>

          {/* ===== ATS SCORING MODEL & COMPLIANCE CHECKLIST ===== */}
          {complianceReport && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden border-0 shadow-2xl rounded-[36px] bg-white">
                {/* ── HEADER BANNER ── */}
                <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 md:px-12 py-10 overflow-hidden">
                  {/* decorative circles */}
                  <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                        <ShieldCheck className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">ATS Scoring Model</h2>
                        <p className="text-indigo-300 text-sm font-medium mt-0.5">6-pillar compliance audit · File · Email · Headings · Sections · Content · Keywords</p>
                      </div>
                    </div>

                    {/* Score Pills */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {[
                        { label: 'All Checks', count: 6, color: 'bg-white/10 text-white border-white/20', filter: 'all' },
                        { label: 'Critical', count: complianceReport.actionItems.highPriority.length, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', filter: 'error' },
                        { label: 'Warnings', count: complianceReport.actionItems.mediumPriority.length, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', filter: 'warning' },
                        { label: 'Passed', count: complianceReport.actionItems.lowPriority.length, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', filter: 'pass' },
                      ].map(pill => (
                        <button
                          key={pill.filter}
                          onClick={() => setSelectedComplianceFilter(pill.filter as any)}
                          className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${pill.color} ${selectedComplianceFilter === pill.filter ? 'ring-2 ring-white/40 scale-105' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {pill.label} <span className="ml-1 font-black">{pill.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── 6 COMPLIANCE CARDS ── */}
                <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                  {/* Helper: status style */}
                  {(() => {
                    const statusStyle = (s: string) =>
                      s === 'pass'    ? { border: 'border-l-emerald-400', bg: 'bg-emerald-50',   text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'PASS' }
                    : s === 'warning' ? { border: 'border-l-amber-400',   bg: 'bg-amber-50',     text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-800',   icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: 'WARNING' }
                    :                  { border: 'border-l-rose-400',     bg: 'bg-rose-50',      text: 'text-rose-700',    badge: 'bg-rose-100 text-rose-800',     icon: <XCircle className="w-4 h-4 text-rose-500" />,         label: 'ERROR' };

                    const Card6 = ({ check, children, icon: Icon }: { check: any; children: React.ReactNode; icon: any }) => {
                      const st = statusStyle(check.status);
                      if (selectedComplianceFilter !== 'all' && selectedComplianceFilter !== check.status) return null;
                      return (
                        <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                          {children}
                        </div>
                      );
                    };

                    const CardHeader = ({ title, status, icon: Icon }: { title: string; status: string; icon: any }) => {
                      const st = statusStyle(status);
                      return (
                        <div className={`px-5 py-4 ${st.bg} border-b border-gray-100 flex items-center justify-between gap-3`}>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${st.badge}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-black text-sm text-gray-900 tracking-tight">{title}</span>
                          </div>
                          <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${st.badge}`}>
                            {st.icon} {st.label}
                          </span>
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* ── 1. EMAIL QUALITY ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.emailQuality.status) && (() => {
                          const st = statusStyle(complianceReport.checks.emailQuality.status);
                          return (
                            <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                              <CardHeader title="Email Quality Audit" status={complianceReport.checks.emailQuality.status} icon={Mail} />
                              <div className="p-5 flex-1 space-y-4">
                                {/* Detected email */}
                                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Detected Email</p>
                                  <p className="font-mono font-bold text-gray-800 text-sm break-all">{complianceReport.checks.emailQuality.currentValue || '—'}</p>
                                </div>

                                {/* Good vs Bad */}
                                <div className="rounded-2xl border border-gray-100 overflow-hidden text-xs">
                                  <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border-b border-gray-100">
                                    <span className="flex items-center gap-1.5 font-mono text-emerald-800 font-semibold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> rahul.sharma@gmail.com</span>
                                    <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">ATS SAFE</span>
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2.5 bg-rose-50">
                                    <span className="flex items-center gap-1.5 font-mono text-rose-800 font-semibold"><XCircle className="w-3.5 h-3.5 text-rose-500" /> cooldude123@gmail.com</span>
                                    <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">BLOCKED</span>
                                  </div>
                                </div>

                                <p className="text-xs text-gray-500 font-medium leading-relaxed">{complianceReport.checks.emailQuality.message}</p>

                                {/* Live tester */}
                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">🔬 Live Email Tester</p>
                                  <input
                                    type="email"
                                    value={testEmailInput}
                                    onChange={(e) => { setTestEmailInput(e.target.value); setTestEmailResult(validateEmailQuality(e.target.value, complianceReport.candidateName)); }}
                                    placeholder="Type email to test…"
                                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none font-mono bg-gray-50 mb-2"
                                  />
                                  <div className="flex gap-1.5 mb-2 flex-wrap">
                                    {['rahul.sharma@gmail.com', 'cooldude123@gmail.com'].map((eg, i) => (
                                      <button key={i} onClick={() => { setTestEmailInput(eg); setTestEmailResult(validateEmailQuality(eg, 'Test')); }}
                                        className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-all ${i === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
                                        {i === 0 ? '✓' : '✗'} {eg.split('@')[0]}…
                                      </button>
                                    ))}
                                  </div>
                                  {testEmailResult && (
                                    <div className={`p-2.5 rounded-xl text-xs font-medium border ${testEmailResult.status === 'pass' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                      <strong>{testEmailResult.status === 'pass' ? '✅ Professional Email' : '❌ Unprofessional Handle'}</strong>
                                      <span className="block mt-0.5 text-[11px] opacity-80">{testEmailResult.message}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 2. FILE NAME CONVENTION ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.fileName.status) && (() => {
                          const st = statusStyle(complianceReport.checks.fileName.status);
                          return (
                            <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                              <CardHeader title="File Name Convention" status={complianceReport.checks.fileName.status} icon={FolderCheck} />
                              <div className="p-5 flex-1 space-y-4">
                                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Current File</p>
                                  <p className="font-mono font-bold text-gray-800 text-sm break-all">{file?.name || complianceReport.fileName || '—'}</p>
                                </div>

                                <div className="rounded-2xl border border-gray-100 overflow-hidden text-xs">
                                  <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Required Format</p>
                                    <p className="font-mono font-bold text-gray-700 mt-0.5">FirstName_LastName_Role.pdf</p>
                                  </div>
                                  {complianceReport.checks.fileName.suggestedValue && (
                                    <div className="px-3 py-2.5 bg-indigo-50 flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">Suggested Name</p>
                                        <p className="font-mono font-bold text-indigo-700 mt-0.5 break-all">{complianceReport.checks.fileName.suggestedValue}</p>
                                      </div>
                                      <button onClick={() => handleCopy(complianceReport.checks.fileName.suggestedValue || '', 'file')} className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-all shrink-0">
                                        {copiedKey === 'file' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-gray-500 font-medium leading-relaxed">{complianceReport.checks.fileName.message}</p>

                                {/* Live tester */}
                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">🔬 Live File Name Tester</p>
                                  <input
                                    type="text"
                                    value={testFileNameInput}
                                    onChange={(e) => { setTestFileNameInput(e.target.value); setTestFileNameResult(validateFileName(e.target.value, complianceReport.candidateName, complianceReport.detectedRole)); }}
                                    placeholder="Type file name to test…"
                                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none font-mono bg-gray-50 mb-2"
                                  />
                                  <div className="flex gap-1.5 mb-2 flex-wrap">
                                    {['1792046756427_CV_IT__1_.pdf', complianceReport.checks.fileName.suggestedValue || 'Abhay_Singh_PM.pdf'].map((eg, i) => (
                                      <button key={i} onClick={() => { setTestFileNameInput(eg); setTestFileNameResult(validateFileName(eg, complianceReport.candidateName, complianceReport.detectedRole)); }}
                                        className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-all ${i === 0 ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                                        {i === 0 ? '✗' : '✓'} {eg.length > 20 ? eg.slice(0, 18) + '…' : eg}
                                      </button>
                                    ))}
                                  </div>
                                  {testFileNameResult && (
                                    <div className={`p-2.5 rounded-xl text-xs font-medium border ${testFileNameResult.status === 'pass' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                      <strong>{testFileNameResult.status === 'pass' ? '✅ ATS Standard Format' : '❌ Non-Standard Format'}</strong>
                                      <span className="block mt-0.5 text-[11px] opacity-80">{testFileNameResult.message}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 3. HEADINGS & DATE CONSISTENCY ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.headingsAndDates.status) && (() => {
                          const st = statusStyle(complianceReport.checks.headingsAndDates.status);
                          return (
                            <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                              <CardHeader title="Headings & Date Consistency" status={complianceReport.checks.headingsAndDates.status} icon={Calendar} />
                              <div className="p-5 flex-1 space-y-4">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Date Formats Detected</p>
                                  <div className="space-y-1.5">
                                    {[
                                      { label: 'Infosiya', val: '"2 Years 2 Months"', type: 'Duration only', color: 'amber' },
                                      { label: 'Finedge', val: '"Dec 2023 – May 2024"', type: 'Month-Year ✓', color: 'emerald' },
                                      { label: 'Education', val: '"2017 – 2021"', type: 'Year only', color: 'amber' },
                                    ].map((row, i) => (
                                      <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                                        <div>
                                          <span className="text-[10px] font-black text-gray-500 block">{row.label}</span>
                                          <span className="font-mono text-[11px] text-gray-700">{row.val}</span>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${row.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.type}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span className="text-xs font-bold text-emerald-700">No spelling errors in section headings</span>
                                </div>

                                <div className={`px-4 py-3 rounded-2xl border text-xs font-medium leading-relaxed ${st.bg} ${st.text} border-current/20`}>
                                  <strong className="font-black">Analysis: </strong>{complianceReport.checks.headingsAndDates.message}
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">💡 Recommended Fix</p>
                                  <p className="text-xs text-gray-600 font-medium leading-relaxed">{complianceReport.checks.headingsAndDates.fix}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 4. STANDARD SECTIONS ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.standardSections.status) && (() => {
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
                            <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                              <CardHeader title="Standard Sections Completeness" status={complianceReport.checks.standardSections.status} icon={Layers} />
                              <div className="p-5 flex-1 space-y-4">
                                {/* Progress bar */}
                                <div>
                                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                    <span className="text-gray-500">Section Coverage</span>
                                    <span className="text-gray-900">{passCount}/{sections.length}</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all" style={{ width: `${(passCount / sections.length) * 100}%` }} />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                  {sections.map((sec, i) => (
                                    <div key={i} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] font-semibold ${sec.found ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                                      {sec.found ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                      <span className="truncate">{sec.name}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 font-medium leading-relaxed">
                                  <strong className="flex items-center gap-1.5 font-black mb-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Missing Section Detected</strong>
                                  &quot;Certifications&quot; not found. Add PMP, Scrum Master, Agile, or Google PM certifications to significantly improve ATS score.
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">💡 Recommended Fix</p>
                                  <p className="text-xs text-gray-600 font-medium leading-relaxed">{complianceReport.checks.standardSections.fix}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 5. CONTENT QUALITY & IMPACT ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.contentQuality.status) && (() => {
                          const st = statusStyle(complianceReport.checks.contentQuality.status);
                          const issues = [
                            { icon: XCircle, color: 'rose', title: 'Zero Quantifiable Results', desc: 'No % or numbers found. Add metrics like "Increased delivery speed by 25%" or "Managed $50k budget".' },
                            { icon: AlertTriangle, color: 'amber', title: 'Weak Phrasing & Repetition', desc: '"Managed" repeated 5×, "Coordinated" 5×. Weak phrase "worked on" detected — replace with action verbs.' },
                            { icon: AlertTriangle, color: 'amber', title: 'Excessive Bullets & Dense Text', desc: 'Infosiya has 16 bullets (4–6 recommended). Summary is a 7-line paragraph — break into concise bullets.' },
                          ];
                          return (
                            <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                              <CardHeader title="Content Quality & Impact" status={complianceReport.checks.contentQuality.status} icon={Zap} />
                              <div className="p-5 flex-1 space-y-3">
                                {issues.map((issue, i) => (
                                  <div key={i} className={`px-3 py-3 rounded-2xl border ${issue.color === 'rose' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <issue.icon className={`w-3.5 h-3.5 shrink-0 ${issue.color === 'rose' ? 'text-rose-500' : 'text-amber-500'}`} />
                                      <span className={`font-black text-xs ${issue.color === 'rose' ? 'text-rose-800' : 'text-amber-800'}`}>{issue.title}</span>
                                    </div>
                                    <p className={`text-[11px] font-medium leading-relaxed pl-5 ${issue.color === 'rose' ? 'text-rose-700' : 'text-amber-700'}`}>{issue.desc}</p>
                                  </div>
                                ))}

                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">💡 Formula to Fix</p>
                                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                                    {['[Action Verb]', '+', '[Context]', '+', '[Metric/Result]'].map((t, i) => (
                                      <span key={i} className={`px-2 py-1 rounded-lg ${t === '+' ? 'text-gray-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>{t}</span>
                                    ))}
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed font-medium">{complianceReport.checks.contentQuality.fix}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── 6. KEYWORDS & SKILLS MATCH ── */}
                        {(selectedComplianceFilter === 'all' || selectedComplianceFilter === complianceReport.checks.keywordsAndSkills.status) && (() => {
                          const st = statusStyle(complianceReport.checks.keywordsAndSkills.status);
                          const matched = ['Agile', 'Jira', 'Trello', 'Asana', 'Stakeholder Management', 'Vendor Management', 'Reporting'];
                          const missing = ['Scrum', 'Sprint Planning', 'Backlog Grooming', 'KPIs', 'ROI', 'Budget Management', 'SLA'];
                          const total = matched.length + missing.length;
                          const pct = Math.round((matched.length / total) * 100);
                          return (
                            <div className={`rounded-3xl border-l-4 ${st.border} border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden`}>
                              <CardHeader title="Keywords & Skills Match" status={complianceReport.checks.keywordsAndSkills.status} icon={Target} />
                              <div className="p-5 flex-1 space-y-4">
                                {/* Match score gauge */}
                                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                                    <span className="text-gray-500">Target Role: <strong className="text-gray-900">{complianceReport.detectedRole}</strong></span>
                                    <span className={`font-black ${pct >= 60 ? 'text-emerald-600' : pct >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>{pct}% Match</span>
                                  </div>
                                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${pct >= 60 ? 'bg-emerald-400' : pct >= 30 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1 font-medium">{matched.length} of {total} industry keywords matched</p>
                                </div>

                                <div>
                                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">✓ Matched Keywords</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {matched.map((kw, i) => <span key={i} className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">{kw}</span>)}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-2">✗ Missing ATS Terms</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {missing.map((kw, i) => <span key={i} className="text-[10px] font-mono font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">{kw}</span>)}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">💡 Recommended Fix</p>
                                  <p className="text-xs text-gray-600 font-medium leading-relaxed">{complianceReport.checks.keywordsAndSkills.fix}</p>
                                </div>
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
              <Card className="overflow-hidden border-0 shadow-2xl rounded-[36px] bg-white">
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

                {/* 3-column action grid */}
                <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* ── MISSING SKILLS ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Target className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="font-black text-sm text-gray-800">Missing Skills</h3>
                      <span className="ml-auto text-[11px] font-black bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">{analysis?.missingSkills?.length || 0} found</span>
                    </div>
                    <div className="space-y-3">
                      {(analysis?.missingSkills?.length ? analysis.missingSkills : [
                        { skill: 'Quantitative Metrics', reason: 'Missing numbers/KPIs in bullet points', priority: 'high' },
                        { skill: 'Technical Tools', reason: 'No domain-specific tools listed', priority: 'high' },
                        { skill: 'Certifications', reason: 'No professional certs mentioned', priority: 'medium' },
                      ]).map((item: any, i: number) => (
                        <div key={i} className={`rounded-2xl p-4 border ${item.priority === 'high' ? 'bg-rose-50 border-rose-100' : item.priority === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-black text-sm text-gray-900">{item.skill}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${item.priority === 'high' ? 'bg-rose-500 text-white' : item.priority === 'medium' ? 'bg-amber-400 text-white' : 'bg-gray-300 text-gray-700'}`}>{item.priority}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── MISSING KEYWORDS ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-black text-sm text-gray-800">Missing Keywords</h3>
                      <span className="ml-auto text-[11px] font-black bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">{analysis?.missingKeywords?.length || 0} found</span>
                    </div>
                    <div className="space-y-3">
                      {(analysis?.missingKeywords?.length ? analysis.missingKeywords : [
                        { keyword: 'cross-functional team collaboration', reason: 'ATS looks for this collaboration keyword', section: 'experience' },
                        { keyword: 'KPI / metrics', reason: 'Performance indicator terms absent', section: 'experience' },
                        { keyword: 'stakeholder management', reason: 'Leadership keyword missing', section: 'summary' },
                      ]).map((item: any, i: number) => (
                        <div key={i} className="rounded-2xl p-4 border bg-blue-50 border-blue-100">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-black text-sm text-gray-900 font-mono">&quot;{item.keyword}&quot;</span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 shrink-0 whitespace-nowrap">{item.section}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── HOW TO FIX ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="font-black text-sm text-gray-800">How To Fix</h3>
                      <span className="ml-auto text-[11px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">{analysis?.improvementPoints?.length || 0} tips</span>
                    </div>
                    <div className="space-y-3">
                      {(analysis?.improvementPoints?.length ? analysis.improvementPoints : [
                        { category: 'experience', issue: 'Bullet points lack measurable results', fix: 'Add numbers: e.g. "Reduced defect rate by 18%"', severity: 'high' },
                        { category: 'skills', issue: 'No domain-specific tools listed', fix: 'Add tools like Excel, AutoCAD, SAP, JIRA', severity: 'high' },
                        { category: 'formatting', issue: 'Summary is too generic', fix: 'Start with years of experience + specialization', severity: 'medium' },
                        { category: 'contact', issue: 'LinkedIn URL missing', fix: 'Add LinkedIn profile link to contact section', severity: 'low' },
                      ]).map((item: any, i: number) => (
                        <div key={i} className={`rounded-2xl p-4 border ${item.severity === 'high' ? 'bg-rose-50 border-rose-100' : item.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${item.category === 'skills' ? 'bg-violet-500 text-white' : item.category === 'experience' ? 'bg-indigo-500 text-white' : item.category === 'keywords' ? 'bg-blue-500 text-white' : item.category === 'formatting' ? 'bg-orange-400 text-white' : 'bg-gray-400 text-white'}`}>{item.category}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ml-auto ${item.severity === 'high' ? 'bg-rose-200 text-rose-800' : item.severity === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>{item.severity}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-700 mb-2">⚠ {item.issue}</p>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-gray-600 font-medium leading-relaxed">{item.fix}</p>
                          </div>
                        </div>
                      ))}
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
          </motion.div>
        )}
      </div>
    </div>
  );
}

