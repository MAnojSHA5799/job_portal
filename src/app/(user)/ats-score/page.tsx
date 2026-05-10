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
  GraduationCap
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

const CATEGORIES = [
  { id: 'formatting', name: 'Formatting & Layout', icon: Layout, weight: 20 },
  { id: 'experience', name: 'Work Experience', icon: Briefcase, weight: 35 },
  { id: 'skills', name: 'Skills & Keywords', icon: Target, weight: 25 },
  { id: 'education', name: 'Education & Certs', icon: GraduationCap, weight: 10 },
  { id: 'contact', name: 'Contact Information', icon: Search, weight: 10 },
];

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      
      // Try to read as text for .txt files
      if (selectedFile.type === 'text/plain') {
        const text = await selectedFile.text();
        setResumeText(text);
      } else {
        // For PDF/DOCX, we prompt for manual text entry for better accuracy
        setResumeText("");
        setIsManualEntry(true);
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
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 100);

    try {
      const systemPrompt = `You are a professional ATS (Applicant Tracking System) Expert. 
      Analyze the provided resume content and provide a detailed score and feedback.
      Output your response ONLY in the following JSON format:
      {
        "overallScore": number (0-100),
        "categories": {
          "formatting": { "score": number, "feedback": "string", "fixes": ["string"] },
          "experience": { "score": number, "feedback": "string", "fixes": ["string"] },
          "skills": { "score": number, "feedback": "string", "fixes": ["string"] },
          "education": { "score": number, "feedback": "string", "fixes": ["string"] },
          "contact": { "score": number, "feedback": "string", "fixes": ["string"] }
        },
        "summary": "string",
        "optimizedResume": {
          "summary": "string",
          "highlights": ["string"],
          "suggestedKeywords": ["string"]
        }
      }`;

      // Use either the manually pasted text or the extracted text/filename
      const contentToAnalyze = resumeText || (file ? `Analyze this resume file: ${file.name}` : "");

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contentToAnalyze }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const result = await response.json();
      
      if (result.error) throw new Error(result.error);
      
      const parsedContent = JSON.parse(result.choices[0].message.content);
      setAnalysis(parsedContent);
      setScanProgress(100);
      
      setTimeout(() => {
        setIsScanning(false);
        setShowResults(true);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Please ensure you have pasted the resume text correctly.");
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
            className="max-w-4xl mx-auto text-center"
          >
            <Badge variant="info" className="mb-6 px-4 py-1 text-sm bg-indigo-50 text-indigo-600 border-indigo-100">
              <Sparkles className="w-3 h-3 mr-2 fill-indigo-600" /> AI-Powered Analysis
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
              How does your resume <span className="text-indigo-600 italic underline decoration-indigo-200">rank</span>?
            </h1>
            <p className="text-xl text-gray-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Upload your resume to see how it performs against Applicant Tracking Systems. 
              Get instant feedback on formatting, keywords, and impact.
            </p>

            <Card className="p-12 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-indigo-300 transition-all group relative overflow-hidden rounded-[40px]">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        {file ? <FileText className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                    </div>
                    
                    {!isManualEntry ? (
                      <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {file ? file.name : "Drag and drop your resume"}
                          </h3>
                          <p className="text-gray-500 font-medium">
                              {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : "Support for PDF, DOCX (Max 5MB)"}
                          </p>
                      </div>
                    ) : (
                      <div className="w-full max-w-2xl">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Paste Resume Text for Precision</h3>
                          <textarea 
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Copy and paste all the content from your resume here..."
                            className="w-full h-48 p-6 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 outline-none text-sm font-medium bg-white shadow-inner resize-none mb-4"
                          />
                          <button 
                            onClick={() => setIsManualEntry(false)}
                            className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline"
                          >
                            Or upload a different file
                          </button>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4">
                        {!file && !isManualEntry ? (
                            <>
                              <Button 
                                  size="lg" 
                                  className="font-bold px-10 rounded-2xl h-14"
                                  onClick={() => fileInputRef.current?.click()}
                              >
                                  Select File
                              </Button>
                              <Button 
                                  variant="outline"
                                  size="lg" 
                                  className="font-bold px-10 rounded-2xl h-14"
                                  onClick={() => setIsManualEntry(true)}
                              >
                                  Paste Text Instead
                              </Button>
                            </>
                        ) : (
                            <Button 
                                size="lg" 
                                className="font-bold px-12 rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                                onClick={startScan}
                            >
                                <Zap className="w-4 h-4 mr-2 fill-white" /> Analyze Now
                            </Button>
                        )}
                        {(file || isManualEntry) && (
                             <Button 
                                variant="outline"
                                size="lg" 
                                className="font-bold rounded-2xl h-14 px-8"
                                onClick={reset}
                            >
                                Reset
                            </Button>
                        )}
                    </div>

                    {error && (
                      <div className="mt-4 flex items-center gap-2 text-red-600 font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-pulse">
                        <AlertCircle className="w-4 h-4" /> {error}
                      </div>
                    )}
                </div>

                <div className="absolute top-10 left-10 opacity-[0.03] rotate-12">
                    <FileText size={120} />
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
                        <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                    </div>
                ))}
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
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gray-900 text-white p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Analysis Complete</Badge>
                        <span className="text-gray-400 text-sm font-medium">{file?.name}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Your ATS Score</h2>
                    <p className="text-gray-400 font-medium text-lg max-w-xl">
                        {analysis?.summary || "Your resume has been analyzed. Here are the detailed insights and improvements suggested by our AI."}
                    </p>
                    
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Button 
                          onClick={() => setShowPreview(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-indigo-600/20"
                        >
                            <Sparkles className="w-4 h-4 mr-2" /> Preview 95+ Score Version
                        </Button>
                        <Button variant="outline" onClick={reset} className="border-gray-700 text-white hover:bg-gray-800 h-12 px-8 rounded-xl">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Scan Another
                        </Button>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-800" />
                            <motion.circle 
                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                strokeDasharray={553}
                                initial={{ strokeDashoffset: 553 }}
                                animate={{ strokeDashoffset: 553 - (553 * (analysis?.overallScore || 0)) / 100 }}
                                className="text-indigo-500" 
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl font-black tracking-tighter">{analysis?.overallScore || 0}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Out of 100</span>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {CATEGORIES.map((cat) => (
                            <Card key={cat.id} className="p-8 border-gray-100 shadow-sm hover:shadow-xl transition-all rounded-3xl">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 bg-gray-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <cat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-gray-900">{analysis?.categories[cat.id]?.score || 0}%</span>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.name}</h3>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                                    {analysis?.categories[cat.id]?.feedback || "Standard analysis for this category."}
                                </p>
                                
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommended Fixes</p>
                                    {(analysis?.categories[cat.id]?.fixes || ["Check keywords", "Verify formatting"]).map((fix: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                            {fix}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="p-8 border-indigo-100 bg-indigo-50/30 rounded-[32px] sticky top-28 shadow-2xl shadow-indigo-100/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Keyword Audit</h3>
                        </div>
                        
                        <p className="text-sm text-gray-600 font-medium mb-6">
                            These industry-standard keywords were missing from your resume. Adding them will significantly boost your score.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-8">
                            {(analysis?.optimizedResume?.suggestedKeywords || ["Strategic Planning", "Team Leadership", "Cost Reduction", "Project Lifecycle"]).map((keyword: string, i: number) => (
                                <Badge key={i} className="bg-white text-indigo-600 border-indigo-100 py-1.5 px-3 rounded-lg font-bold shadow-sm">{keyword}</Badge>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-indigo-100">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-gray-900">Impact Potential</span>
                                <span className="text-sm font-bold text-emerald-600">+15 Points</span>
                             </div>
                             <div className="h-2 bg-white rounded-full overflow-hidden border border-indigo-100">
                                <div className="h-full bg-emerald-500 w-[65%]" />
                             </div>
                        </div>
                    </Card>
                </div>
            </div>
          </motion.div>
        )}
      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">95+ ATS Score Preview</h3>
                        <p className="text-indigo-100 text-sm font-medium">Optimized structure, keywords, and impact-driven layout</p>
                    </div>
                    <Button variant="ghost" onClick={() => setShowPreview(false)} className="text-white hover:bg-white/10 rounded-xl">Close</Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-12 bg-gray-50">
                    <div className="max-w-2xl mx-auto bg-white p-12 shadow-2xl rounded-sm border-t-8 border-indigo-600 font-sans text-gray-800 min-h-[1000px]">
                        <div className="text-center mb-10 pb-10 border-b border-gray-100">
                            <h1 className="text-4xl font-bold uppercase tracking-[0.2em] mb-2">{file?.name.split('.')[0] || "YOUR NAME"}</h1>
                            <div className="flex justify-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <span>+91 98765 43210</span>
                                <span>email@address.com</span>
                                <span>linkedin.com/in/username</span>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-600 border-b border-indigo-50 pb-2">Professional Summary</h2>
                            <p className="text-sm leading-relaxed text-gray-600 font-medium italic">
                                {analysis?.optimizedResume?.summary || "Highly skilled professional with extensive experience in driving results and managing complex projects. Proven track record of excellence and strategic thinking."}
                            </p>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-600 border-b border-indigo-50 pb-2">Experience Highlights</h2>
                            <ul className="space-y-4">
                                {(analysis?.optimizedResume?.highlights || ["Spearheaded multi-million dollar digital transformation initiative.", "Optimized workflow efficiency by 40% through strategic restructuring.", "Managed cross-functional teams across three international regions."]).map((h: string, i: number) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                                        <p className="text-sm font-medium text-gray-700 leading-relaxed">{h}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-600 border-b border-indigo-50 pb-2">Core Competencies</h2>
                                <div className="flex flex-wrap gap-2">
                                    {analysis?.optimizedResume?.suggestedKeywords?.slice(0, 8).map((k: string, i: number) => (
                                        <span key={i} className="text-[10px] font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-600 border-b border-indigo-50 pb-2">Education</h2>
                                <p className="text-xs font-bold">Bachelor of Science in Engineering</p>
                                <p className="text-[10px] text-gray-500 font-medium">Top Tier University • 2018 - 2022</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-white flex justify-center gap-4">
                    <Button className="h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black text-xs tracking-widest uppercase">Download Optimized PDF</Button>
                    <Button variant="outline" className="h-12 px-10 rounded-xl font-black text-xs tracking-widest uppercase border-2">Copy as Text</Button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
