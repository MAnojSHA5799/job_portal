"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { 
  MapPin, 
  Loader2, 
  Sparkles, 
  Save, 
  X,
  Search,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  DollarSign,
  Clock,
  Zap
} from 'lucide-react';
import { calculateSEOScore, SEOCheck } from '@/lib/seo-utils';

interface Company {
  id: string;
  name: string;
}

interface Job {
  id?: string;
  title: string;
  description: string;
  content_html?: string;
  location: string;
  salary_range: string;
  job_type: string;
  experience_level: string;
  category: string;
  apply_link: string;
  source_url: string;
  company_id: string;
  date_posted: string;
  seo_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  url_slug?: string;
  seo_score?: number;
  valid_through?: string;
}

interface JobFormProps {
  initialData?: Partial<Job>;
  companies: Company[];
  onSave: (data: Job) => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export function JobForm({ 
  initialData, 
  companies, 
  onSave, 
  onCancel, 
  loading,
  title = "Job Posting",
  subtitle = "Fill in the details below"
}: JobFormProps) {
  const [currentJob, setCurrentJob] = useState<Job>({
    title: '',
    description: '',
    location: '',
    salary_range: '',
    job_type: 'Full-time',
    experience_level: '',
    category: '',
    apply_link: '',
    source_url: '',
    company_id: '',
    date_posted: new Date().toISOString().split('T')[0],
    seo_title: '',
    meta_description: '',
    focus_keyword: '',
    url_slug: '',
    seo_score: 0,
    valid_through: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 60 days
    ...initialData
  });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSeoDetails, setShowSeoDetails] = useState(true);
  const [fixingCheckId, setFixingCheckId] = useState<number | null>(null);

  // Real-time SEO Scoring
  const seoReport = calculateSEOScore({
    title: currentJob.title,
    description: currentJob.description,
    seo_title: currentJob.seo_title,
    meta_description: currentJob.meta_description,
    focus_keyword: currentJob.focus_keyword,
    url_slug: currentJob.url_slug,
    location: currentJob.location
  });

  const generateFocusKeyword = (title: string, location: string) => {
    return `${title} ${location.split(',')[0]}`.trim();
  };

  const handleAIFix = async (check: SEOCheck) => {
    setFixingCheckId(check.id);
    try {
      if (check.category === 'title') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an SEO expert. Create a high-ranking SEO title (50-60 characters) for a job posting. Format: [Job Title] in [Location] | [Company Name]. Include power words like Hiring, Apply, Salary.'
              },
              {
                role: 'user',
                content: `Job Title: ${currentJob.title}, Location: ${currentJob.location}, Company: ${companies.find(c => c.id === currentJob.company_id)?.name || 'Gethyrd'}`
              }
            ]
          })
        });
        const data = await response.json();
        setCurrentJob({ ...currentJob, seo_title: data.choices[0].message.content.replace(/"/g, '') });
      } else if (check.category === 'meta') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Create a compelling Meta Description (130-160 chars) for a job posting. Must include the focus keyword naturally.'
              },
              {
                role: 'user',
                content: `Job Title: ${currentJob.title}, Focus Keyword: ${currentJob.focus_keyword}, Location: ${currentJob.location}`
              }
            ]
          })
        });
        const data = await response.json();
        setCurrentJob({ ...currentJob, meta_description: data.choices[0].message.content.replace(/"/g, '') });
      } else if (check.category === 'url') {
        const slug = (currentJob.focus_keyword || '').toLowerCase().replace(/\s+/g, '-');
        setCurrentJob({ ...currentJob, url_slug: slug });
      }
    } catch (error) {
      console.error('AI Fix Error:', error);
    } finally {
      setFixingCheckId(null);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!currentJob.description) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Enhance this job description to be more professional, using bullet points for responsibilities and requirements.'
            },
            {
              role: 'user',
              content: currentJob.description
            }
          ]
        })
      });
      const data = await response.json();
      setCurrentJob({ ...currentJob, description: data.choices[0].message.content });
    } catch (error) {
      console.error('Enhance Error:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const internalOnSave = () => {
    if (!currentJob.title || !currentJob.company_id || !currentJob.description || !currentJob.location) {
      alert('Please fill in required fields (Title, Company, Description, Location)');
      return;
    }
    const finalJob = {
      ...currentJob,
      seo_score: seoReport.score
    };
    onSave(finalJob);
  };

  return (
    <Card className="p-0 border-0 bg-transparent shadow-none overflow-visible">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Main Job Details Form */}
        <div className="flex-1 bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
              <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-rose-50 hover:text-rose-500">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Job Title *</label>
                <Input 
                  className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. Senior Frontend Developer" 
                  value={currentJob.title}
                  onChange={e => setCurrentJob({...currentJob, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Company *</label>
                <select 
                  className="flex h-12 w-full rounded-xl border-0 bg-gray-50 px-4 text-sm font-bold shadow-none focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  value={currentJob.company_id}
                  onChange={e => setCurrentJob({...currentJob, company_id: e.target.value})}
                >
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                  <Input 
                    className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="e.g. Pune, Maharashtra" 
                    value={currentJob.location}
                    onChange={e => setCurrentJob({...currentJob, location: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Salary Range</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                  <Input 
                    className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="e.g. ₹8L - ₹12L PA" 
                    value={currentJob.salary_range}
                    onChange={e => setCurrentJob({...currentJob, salary_range: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Job Type</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border-0 bg-gray-50 px-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    value={currentJob.job_type}
                    onChange={e => setCurrentJob({...currentJob, job_type: e.target.value})}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Experience</label>
                  <Input 
                    className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="e.g. 2-5 Years" 
                    value={currentJob.experience_level}
                    onChange={e => setCurrentJob({...currentJob, experience_level: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                <Input 
                  className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. Production, Quality" 
                  value={currentJob.category}
                  onChange={e => setCurrentJob({...currentJob, category: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Date Posted</label>
                  <Input 
                    type="date"
                    className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    value={currentJob.date_posted}
                    onChange={e => setCurrentJob({...currentJob, date_posted: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Valid Through</label>
                  <Input 
                    type="date"
                    className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    value={currentJob.valid_through}
                    onChange={e => setCurrentJob({...currentJob, valid_through: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">External Apply Link</label>
                <Globe className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                <Input 
                  className="h-12 pl-4 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="https://company.com/careers" 
                  value={currentJob.apply_link}
                  onChange={e => setCurrentJob({...currentJob, apply_link: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Job Description *</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleEnhanceDescription}
                disabled={isEnhancing}
                className="h-8 px-3 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg uppercase tracking-wider"
              >
                {isEnhancing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
                AI Enhance
              </Button>
            </div>
            <textarea 
              className="w-full min-h-[400px] rounded-[24px] border-0 bg-gray-50 p-6 text-sm font-medium leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              placeholder="Describe the role, responsibilities, and requirements..."
              value={currentJob.description}
              onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
            />
          </div>

          <div className="flex justify-end pt-8">
             <Button onClick={internalOnSave} disabled={loading} className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100">
               {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
               PUBLISH JOB POSTING
             </Button>
          </div>
        </div>

        {/* SEO Sidebar */}
        <aside className="w-full xl:w-[450px] space-y-8 sticky top-10">
          <Card className="p-8 bg-gray-900 text-white rounded-[32px] border-0 shadow-2xl shadow-indigo-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-400" /> SEO Standards
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Get noticed on Google Jobs.</p>
              </div>
              <div className={cn(
                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black",
                seoReport.score >= 85 ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
              )}>
                <span className="text-2xl">{seoReport.score}</span>
                <span className="text-[8px] uppercase tracking-tighter opacity-60">Score</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Focus Keyword</label>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-indigo-500/50"
                    placeholder="e.g. CNC Operator Pune"
                    value={currentJob.focus_keyword}
                    onChange={e => setCurrentJob({...currentJob, focus_keyword: e.target.value})}
                  />
                </div>
                {!currentJob.focus_keyword && currentJob.title && (
                   <button 
                     onClick={() => setCurrentJob({...currentJob, focus_keyword: generateFocusKeyword(currentJob.title, currentJob.location)})}
                     className="text-[10px] font-bold text-indigo-400 mt-2 hover:underline"
                   >
                     + Auto-generate Keyword
                   </button>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">URL Slug</label>
                <div className="relative">
                  <Zap className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-indigo-500/50"
                    placeholder="cnc-operator-pune"
                    value={currentJob.url_slug}
                    onChange={e => setCurrentJob({...currentJob, url_slug: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">SEO Title</label>
                <div className="relative group">
                  <Input 
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl pr-12 focus:ring-indigo-500/50"
                    value={currentJob.seo_title}
                    onChange={e => setCurrentJob({...currentJob, seo_title: e.target.value})}
                  />
                  <span className={cn(
                    "absolute right-4 top-4 text-[10px] font-black",
                    (currentJob.seo_title?.length || 0) >= 50 && (currentJob.seo_title?.length || 0) <= 60 ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {currentJob.seo_title?.length || 0}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Meta Description</label>
                <div className="relative">
                  <textarea 
                    className="w-full min-h-[100px] bg-white/5 border border-white/10 text-white text-sm p-4 rounded-xl focus:ring-indigo-500/50 outline-none transition-all"
                    value={currentJob.meta_description}
                    onChange={e => setCurrentJob({...currentJob, meta_description: e.target.value})}
                  />
                  <span className={cn(
                    "absolute right-4 bottom-4 text-[10px] font-black",
                    (currentJob.meta_description?.length || 0) >= 130 && (currentJob.meta_description?.length || 0) <= 160 ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {currentJob.meta_description?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
            <h4 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> SEO Checklist
            </h4>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {seoReport.checks.map((check) => (
                <div key={check.id} className="flex items-start justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="flex gap-3">
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-800">{check.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium leading-tight">{check.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-black", check.passed ? "text-emerald-500" : "text-gray-300")}>+{check.points}</span>
                    {!check.passed && check.autoFixAvailable && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleAIFix(check)}
                        disabled={fixingCheckId === check.id}
                        className="h-6 px-2 text-[9px] font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {fixingCheckId === check.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Wand2 className="h-3 w-3 mr-1" /> FIX</>}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </Card>
  );
}
