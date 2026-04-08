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
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startScan = () => {
    if (!file) return;
    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setShowResults(true);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const reset = () => {
    setFile(null);
    setShowResults(false);
    setIsScanning(false);
    setScanProgress(0);
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
            <Badge variant="info" className="mb-6 px-4 py-1 text-sm">
              <Sparkles className="w-3 h-3 mr-2 fill-primary" /> AI-Powered Analysis
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter mb-6">
              How does your resume <span className="text-primary italic">rank</span>?
            </h1>
            <p className="text-xl text-gray-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Upload your resume to see how it performs against Applicant Tracking Systems. 
              Get instant feedback on formatting, keywords, and impact.
            </p>

            <Card className="p-12 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-primary/30 transition-all group relative overflow-hidden">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {file ? <FileText className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {file ? file.name : "Drag and drop your resume"}
                        </h3>
                        <p className="text-gray-500 font-medium">
                            {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : "Support for PDF, DOCX (Max 5MB)"}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        {!file ? (
                            <Button 
                                size="lg" 
                                className="font-bold px-10"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Select File
                            </Button>
                        ) : (
                            <Button 
                                size="lg" 
                                className="font-bold px-10 shadow-xl shadow-primary/30"
                                onClick={startScan}
                            >
                                <Zap className="w-4 h-4 mr-2 fill-white" /> Analyze Resume
                            </Button>
                        )}
                        {file && (
                             <Button 
                                variant="outline"
                                size="lg" 
                                className="font-bold"
                                onClick={() => setFile(null)}
                            >
                                Change
                            </Button>
                        )}
                    </div>
                </div>

                {/* Decorative background icons */}
                <div className="absolute top-10 left-10 opacity-[0.03] rotate-12">
                    <FileText size={120} />
                </div>
                <div className="absolute bottom-10 right-10 opacity-[0.03] -rotate-12">
                    <Brain size={120} />
                </div>
            </Card>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: ShieldCheck, title: "ATS-Safe", desc: "Ensure your resume passes 99% of modern ATS filters." },
                    { icon: Target, title: "Keyword Optimization", desc: "Identify missing keywords for your target industry." },
                    { icon: Sparkles, title: "Impact Score", desc: "Measure the strength of your action verbs and metrics." },
                ].map((feature, i) => (
                    <div key={i} className="text-left p-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                            <feature.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
          </motion.div>
        ) : isScanning ? (
          <div className="max-w-xl mx-auto py-32 text-center">
            <div className="mb-12 relative inline-block">
                <div className="w-32 h-32 rounded-3xl border-4 border-primary/10 flex items-center justify-center">
                    <motion.div
                        animate={{ 
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                            scale: { duration: 1, repeat: Infinity }
                        }}
                        className="text-primary"
                    >
                        <RefreshCcw className="w-12 h-12" />
                    </motion.div>
                </div>
                <div className="absolute -top-4 -right-4 bg-primary text-white p-2 rounded-xl shadow-lg">
                    <Brain className="w-6 h-6" />
                </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Scanning your CV...</h2>
            <p className="text-gray-500 font-bold mb-10 uppercase text-xs tracking-widest">Running 50+ heuristic checks</p>
            
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-4">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    className="h-full bg-primary"
                ></motion.div>
            </div>
            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                <span>{scanProgress}% Processed</span>
                <span>AI Core Online</span>
            </div>

            <div className="mt-12 space-y-3">
                <AnimatePresence>
                    {scanProgress > 20 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-sm text-secondary font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Parsing structure patterns...
                        </motion.div>
                    )}
                    {scanProgress > 50 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-sm text-secondary font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Analyzing keyword density...
                        </motion.div>
                    )}
                    {scanProgress > 80 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-sm text-secondary font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Generating improvement map...
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            {/* Results Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-gray-900 rounded-[40px] p-8 md:p-12 text-white overflow-hidden relative">
                <div className="relative z-10">
                    <Badge variant="info" className="mb-4 bg-primary/20 text-primary border-0">Analysis Complete</Badge>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Your ATS Score</h2>
                    <p className="text-gray-400 font-medium text-lg max-w-md">
                        Great job! Your resume is stronger than <span className="text-white font-bold">78%</span> of applicants in your field.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <Button className="font-bold px-8 shadow-xl shadow-primary/30">Download Report</Button>
                        <Button variant="ghost" className="text-white hover:bg-white/10 font-bold" onClick={reset}>
                            <RefreshCcw className="w-4 h-4 mr-2" /> Scan Again
                        </Button>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-[12px] border-white/5 flex items-center justify-center relative">
                        {/* Circular Progress (simplified CSS) */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle 
                                cx="50%" cy="50%" r="46%" 
                                stroke="currentColor" strokeWidth="12" fill="transparent"
                                className="text-primary/20"
                            />
                            <motion.circle 
                                initial={{ strokeDasharray: "0 1000" }}
                                animate={{ strokeDasharray: "288 1000" }} // Approx 78%
                                transition={{ duration: 1.5, delay: 0.5 }}
                                cx="50%" cy="50%" r="46%" 
                                stroke="currentColor" strokeWidth="12" fill="transparent"
                                className="text-primary"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="text-center">
                            <motion.span 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, type: 'spring' }}
                                className="text-6xl md:text-8xl font-black leading-none block"
                            >
                                78
                            </motion.span>
                            <span className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest">Match Score</span>
                        </div>
                    </div>
                </div>

                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-0"></div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Detailed Analysis</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {CATEGORIES.map((cat, i) => (
                            <Card key={cat.id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                                        <cat.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">Score</div>
                                        <div className="text-xl font-black text-gray-900">{70 + (i * 5)}%</div>
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-3">{cat.name}</h4>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${70 + (i * 5)}%` }}
                                        className="h-full bg-gray-900 rounded-full"
                                    ></motion.div>
                                </div>
                                <p className="text-sm text-gray-500 font-medium">
                                    {70 + (i * 5) > 80 ? "Looks excellent! Minimal changes needed." : "Some improvements could strengthen this area."}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary fill-primary" /> AI Suggestions
                    </h3>
                    <div className="space-y-4">
                        {[
                            { title: "Use more metrics", icon: BarChart3, type: "improvement", text: "Add more numbers (%, $, #) to your experience bullets to show impact." },
                            { title: "Missing Keywords", icon: Target, type: "critical", text: "We found strong skills, but 'Cloud Architecture' and 'Agile' are missing for your role." },
                            { title: "Contact Info Fix", icon: AlertCircle, type: "minor", text: "Ensure your LinkedIn URL is clickable and in the header." },
                            { title: "Action Verbs", icon: Sparkles, type: "improvement", text: "Try swapping 'Responsible for' with 'Orchestrated' or 'Spearheaded'." },
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                className={`p-5 rounded-2xl border flex gap-4 ${
                                    item.type === 'critical' ? 'bg-danger/5 border-danger/20' : 
                                    item.type === 'improvement' ? 'bg-primary/5 border-primary/20' : 
                                    'bg-gray-50 border-gray-100'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    item.type === 'critical' ? 'bg-danger/10 text-danger' : 
                                    item.type === 'improvement' ? 'bg-primary/10 text-primary' : 
                                    'bg-gray-200 text-gray-500'
                                }`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 mb-1">{item.title}</h5>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <Button variant="outline" className="w-full font-bold group">
                        See All 12 Improvements <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
