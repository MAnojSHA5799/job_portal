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
  User
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

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
  const [expandedCategory, setExpandedCategory] = useState<string | null>('content');
  const [isParsing, setIsParsing] = useState(false);
  const [isVerifyingResume, setIsVerifyingResume] = useState(false);
  const [isResumeVerified, setIsResumeVerified] = useState<boolean | null>(null); // null=not checked, true=valid, false=invalid

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
        // DOCX — prompt manual paste
        setResumeText('');
        setIsManualEntry(true);
        setIsResumeVerified(null);
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

      const systemPrompt = `You are an expert ATS resume analyzer. Analyze the resume text and return ONLY a valid JSON object with this exact structure (no extra text, no markdown):
{
  "overallScore": 75,
  "categories": {
    "formatting": { "score": 80, "feedback": "Good structure", "fixes": ["Use consistent fonts"] },
    "experience": { "score": 70, "feedback": "Needs metrics", "fixes": ["Add quantifiable achievements"] },
    "skills": { "score": 75, "feedback": "Relevant skills listed", "fixes": ["Add more technical skills"] },
    "education": { "score": 85, "feedback": "Education clearly shown", "fixes": [] },
    "contact": { "score": 90, "feedback": "Contact info complete", "fixes": [] }
  },
  "summary": "Overall ATS analysis summary here",
  "missingSkills": [
    { "skill": "Project Management", "reason": "Commonly required in this role but absent from resume", "priority": "high" },
    { "skill": "Data Analysis", "reason": "Needed for quantifying impact", "priority": "medium" }
  ],
  "missingKeywords": [
    { "keyword": "cross-functional", "reason": "ATS systems look for this collaboration keyword", "section": "experience" },
    { "keyword": "KPI", "reason": "Important performance tracking term missing", "section": "experience" }
  ],
  "improvementPoints": [
    { "category": "skills", "issue": "No technical tools listed", "fix": "Add specific tools like Excel, SAP, AutoCAD relevant to your domain", "severity": "high" },
    { "category": "experience", "issue": "Bullet points lack measurable results", "fix": "Add numbers: e.g. Reduced defect rate by 18% instead of Reduced defects", "severity": "high" },
    { "category": "keywords", "issue": "Industry-standard keywords missing", "fix": "Include terms like lean manufacturing, process optimization, root cause analysis", "severity": "medium" },
    { "category": "formatting", "issue": "Summary section is too vague", "fix": "Rewrite summary with specific achievements, years of experience, and target role", "severity": "medium" },
    { "category": "contact", "issue": "LinkedIn profile URL missing", "fix": "Add your LinkedIn profile link to the contact section", "severity": "low" }
  ],
  "resumeData": {
    "name": "Full Name",
    "title": "Job Title",
    "contact": { "phone": "phone number", "email": "email@example.com", "location": "City, State" },
    "originalSummary": "Exact summary from resume",
    "optimizedSummary": "ATS-optimized version of the summary with strong action words and keywords",
    "experience": [
      {
        "role": "Job Title",
        "company": "Company Name",
        "dates": "Jan 2020 - Present",
        "location": "City, State",
        "originalBulletPoints": ["Original bullet point from resume"],
        "optimizedBulletPoints": ["Quantified, action-verb driven optimized bullet point"]
      }
    ],
    "education": [
      { "degree": "Degree Name", "school": "University Name", "dates": "2018-2022", "location": "City" }
    ],
    "skills": ["Skill 1", "Skill 2"],
    "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
    "achievements": ["Notable achievement 1", "Notable achievement 2"],
    "interests": ["Interest 1", "Interest 2"],
    "languages": [{ "name": "English", "level": "Fluent" }]
  }
}`;

      // Truncate long resume text to avoid exceeding token limits
      const rawText = resumeText || (file ? `Resume filename: ${file.name}` : '');
      const contentToAnalyze = rawText.length > 4000 ? rawText.slice(0, 4000) + '\n...[truncated]' : rawText;

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

      // 2. Save scan result to database
      await supabase.from('resume_scans').insert({
        file_url: fileUrl,
        resume_text: resumeText || file?.name,
        ats_score: parsedContent.overallScore,
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
                            ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
                            : 'Support for PDF, DOCX (Max 5MB)'}
                        </p>
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

                <div className="space-y-4 text-left">
                  {/* CONTENT CATEGORY */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'content' ? null : 'content')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">CONTENT</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold">{analysis?.categories?.formatting?.score || 65}%</Badge>
                        {expandedCategory === 'content' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandedCategory === 'content' && (
                      <div className="py-2 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <AlertCircle className="w-4 h-4 text-amber-500" /><span>ATS Parse Rate</span>
                          </div>
                          <Badge className="text-amber-600 border-amber-200 bg-amber-50 font-bold text-[10px]">1 issue</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <AlertCircle className="w-4 h-4 text-red-500" /><span>Quantifying Impact</span>
                          </div>
                          <Badge className="text-red-600 border-red-200 bg-red-50 font-bold text-[10px]">3 issues</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Repetition</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">No issues</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <AlertCircle className="w-4 h-4 text-red-500" /><span>Spelling & Grammar</span>
                          </div>
                          <Badge className="text-red-600 border-red-200 bg-red-50 font-bold text-[10px]">1 issue</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTIONS CATEGORY */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'sections' ? null : 'sections')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">SECTIONS</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold">{analysis?.categories?.experience?.score || 81}%</Badge>
                        {expandedCategory === 'sections' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'sections' && (
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed py-2">
                        {analysis?.categories?.experience?.feedback || "Your resume sections are well-defined, but could have stronger headings."}
                      </p>
                    )}
                  </div>

                  {/* ATS ESSENTIALS */}
                  <div className="border-b border-gray-100 pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'essentials' ? null : 'essentials')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">ATS ESSENTIALS</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">{analysis?.categories?.skills?.score || 83}%</Badge>
                        {expandedCategory === 'essentials' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'essentials' && (
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed py-2">
                        {analysis?.categories?.skills?.feedback || "Check keywords, file formats and structure for perfect parse rate."}
                      </p>
                    )}
                  </div>

                  {/* TAILORING */}
                  <div className="pb-2">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'tailoring' ? null : 'tailoring')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">TAILORING</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-600 font-bold">??%</Badge>
                        {expandedCategory === 'tailoring' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'tailoring' && (
                      <div className="py-2 space-y-3 text-sm">
                        <ul className="space-y-2 text-gray-600 font-medium">
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Hard Skills</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Soft Skills</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Action Verbs</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Tailored Title</li>
                        </ul>
                        <div className="pt-3 border-t border-gray-100 mt-3">
                           <button onClick={() => {
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }} className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold text-sm w-full text-left flex items-center gap-2 transition-all">
                             <Upload className="w-4 h-4" /> Update YOUR Details/Resume
                           </button>
                        </div>
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

                    const mapExperience = (expArray: any[], type: 'original' | 'optimized') => {
                      if (!expArray || !expArray.length) return isDemo ? defaultResumeData.experience : [];
                      return expArray.map((exp: any) => ({
                        ...exp,
                        bulletPoints: type === 'optimized' ? (exp.optimizedBulletPoints || exp.originalBulletPoints) : exp.originalBulletPoints
                      }));
                    };

                    const originalResume = {
                      name: extractedData?.name || (file?.name ? file.name.split('.')[0] : defaultResumeData.name),
                      title: extractedData?.title || (isDemo ? defaultResumeData.title : "Professional"),
                      contact: {
                        phone: extractedData?.contact?.phone || (isDemo ? defaultResumeData.contact.phone : ""),
                        email: extractedData?.contact?.email || (isDemo ? defaultResumeData.contact.email : ""),
                        location: extractedData?.contact?.location || (isDemo ? defaultResumeData.contact.location : ""),
                      },
                      summary: extractedData?.originalSummary || (isDemo ? defaultResumeData.summary : ""),
                      experience: mapExperience(extractedData?.experience, 'original'),
                      education: extractedData?.education?.length ? extractedData?.education : (isDemo ? defaultResumeData.education : []),
                      skills: extractedData?.skills?.length ? extractedData?.skills : (isDemo ? defaultResumeData.skills : []),
                      strengths: extractedData?.strengths?.length ? extractedData.strengths.map((s: string) => ({ name: s, desc: '' })) : (isDemo ? defaultResumeData.strengths : []),
                      achievements: extractedData?.achievements?.length ? extractedData.achievements.map((a: string) => ({ title: a, desc: '' })) : (isDemo ? defaultResumeData.achievements : []),
                      interests: extractedData?.interests?.length ? extractedData.interests.map((i: string) => ({ name: i, desc: '' })) : (isDemo ? defaultResumeData.interests : []),
                      languages: extractedData?.languages?.length ? extractedData.languages.map((l: any) => ({ name: l.name, label: l.level || 'Proficient', level: 4 })) : (isDemo ? defaultResumeData.languages : [])
                    };

                    const enhancedResume = {
                      ...originalResume,
                      summary: extractedData?.optimizedSummary || originalResume.summary,
                      experience: mapExperience(extractedData?.experience, 'optimized'),
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
                                    <p className="text-[10px] text-gray-500 font-medium pl-5">{s.desc}</p>
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
                                      <Target className="w-3 h-3 text-blue-500 mt-0.5" />
                                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{a.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium pl-5">{a.desc}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Skills</h3>
                              <div className="flex flex-wrap gap-y-2">
                                {enhancedResume.skills.map((s: string, i: number) => (
                                  <div key={i} className="w-1/2 pr-2">
                                    <div className="text-[10px] font-bold text-gray-700 border-b border-gray-100 pb-1">{s}</div>
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
                                      <Sparkles className="w-3 h-3 text-blue-500" />
                                      <h4 className="font-bold text-[10px] text-gray-900">{s.name}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium pl-5 leading-tight">{s.desc}</p>
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
          {/* ===== RESUME FIX REPORT ===== */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-8 md:p-10 border-gray-100 shadow-xl rounded-[32px] bg-white">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Resume Fix Report</h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Aapke resume mein ye cheezein missing hain — inhe fix karo aur ATS score badhao
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                  {/* ---- MISSING SKILLS ---- */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <h3 className="font-black text-sm text-gray-800 uppercase tracking-widest">Missing Skills</h3>
                      <span className="ml-auto text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                        {(analysis?.missingSkills?.length || 0)} found
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(analysis?.missingSkills?.length
                        ? analysis.missingSkills
                        : [
                            { skill: 'Quantitative Metrics', reason: 'Missing numbers/KPIs in achievements', priority: 'high' },
                            { skill: 'Technical Tools', reason: 'No domain-specific tools listed', priority: 'high' },
                            { skill: 'Certifications', reason: 'No professional certs mentioned', priority: 'medium' },
                          ]
                      ).map((item: any, i: number) => (
                        <div
                          key={i}
                          className={`rounded-2xl p-4 border ${
                            item.priority === 'high'   ? 'bg-rose-50 border-rose-100'   :
                            item.priority === 'medium' ? 'bg-amber-50 border-amber-100' :
                            'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-bold text-sm text-gray-900">{item.skill}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                              item.priority === 'high'   ? 'bg-rose-500 text-white'   :
                              item.priority === 'medium' ? 'bg-amber-400 text-white'  :
                              'bg-gray-300 text-gray-700'
                            }`}>{item.priority}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ---- MISSING KEYWORDS ---- */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h3 className="font-black text-sm text-gray-800 uppercase tracking-widest">Missing Keywords</h3>
                      <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {(analysis?.missingKeywords?.length || 0)} found
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(analysis?.missingKeywords?.length
                        ? analysis.missingKeywords
                        : [
                            { keyword: 'cross-functional', reason: 'ATS looks for this collaboration keyword', section: 'experience' },
                            { keyword: 'KPI / metrics', reason: 'Performance indicator terms absent', section: 'experience' },
                            { keyword: 'stakeholder management', reason: 'Leadership keyword missing', section: 'summary' },
                          ]
                      ).map((item: any, i: number) => (
                        <div key={i} className="rounded-2xl p-4 border bg-blue-50 border-blue-100">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-bold text-sm text-gray-900 font-mono">"{item.keyword}"</span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 shrink-0">
                              {item.section}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ---- HOW TO FIX ---- */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <h3 className="font-black text-sm text-gray-800 uppercase tracking-widest">How To Fix</h3>
                      <span className="ml-auto text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {(analysis?.improvementPoints?.length || 0)} tips
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(analysis?.improvementPoints?.length
                        ? analysis.improvementPoints
                        : [
                            { category: 'experience', issue: 'Bullet points lack measurable results', fix: 'Add numbers: e.g. "Reduced defect rate by 18%"', severity: 'high' },
                            { category: 'skills',     issue: 'No domain-specific tools listed',       fix: 'Add tools like Excel, AutoCAD, SAP, JIRA',            severity: 'high' },
                            { category: 'formatting', issue: 'Summary is too generic',                fix: 'Start with years of experience + specialization',       severity: 'medium' },
                            { category: 'contact',    issue: 'LinkedIn URL missing',                  fix: 'Add LinkedIn profile link to contact section',          severity: 'low' },
                          ]
                      ).map((item: any, i: number) => (
                        <div
                          key={i}
                          className={`rounded-2xl p-4 border ${
                            item.severity === 'high'   ? 'bg-rose-50 border-rose-100'     :
                            item.severity === 'medium' ? 'bg-amber-50 border-amber-100'   :
                            'bg-emerald-50 border-emerald-100'
                          }`}
                        >
                          <div className="mb-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                              item.category === 'skills'     ? 'bg-violet-500 text-white' :
                              item.category === 'experience' ? 'bg-indigo-500 text-white' :
                              item.category === 'keywords'   ? 'bg-blue-500 text-white'   :
                              item.category === 'formatting' ? 'bg-orange-400 text-white'  :
                              'bg-gray-400 text-white'
                            }`}>{item.category}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-700 mb-1.5">⚠ {item.issue}</p>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-600 font-medium leading-relaxed">{item.fix}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Priority Summary Bar */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="font-bold text-gray-600">High Priority:</span>
                    <span className="font-black text-gray-900">
                      {[
                        ...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'high'),
                        ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'high'),
                      ].length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    <span className="font-bold text-gray-600">Medium Priority:</span>
                    <span className="font-black text-gray-900">
                      {[
                        ...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'medium'),
                        ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'medium'),
                      ].length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                    <span className="font-bold text-gray-600">Low Priority:</span>
                    <span className="font-black text-gray-900">
                      {[
                        ...(analysis?.missingSkills || []).filter((s: any) => s.priority === 'low'),
                        ...(analysis?.improvementPoints || []).filter((p: any) => p.severity === 'low'),
                      ].length} items
                    </span>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-black text-sm hover:underline transition-all"
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
