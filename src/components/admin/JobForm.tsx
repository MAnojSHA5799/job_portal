"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { 
  MapPin, 
  Loader2, 
  Sparkles, 
  Save, 
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
  Zap,
  Building2,
  Plus,
  Eye,
  Star,
  ArrowRight,
  X,
  PlayCircle,
  Upload
} from 'lucide-react';
import { calculateSEOScore, SEOCheck } from '@/lib/seo-utils';
import { enhanceJobSEO } from '@/lib/seo-enhancer';
import { supabase } from '@/lib/supabase';

interface Company {
  id: string;
  name: string;
  url_slug?: string | null;
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
  new_company_name?: string;
  date_posted: string;
  seo_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  url_slug?: string;
  seo_score?: number;
  valid_through?: string;
  is_approved?: boolean;
  media_url?: string;
  media_type?: 'image' | 'video';
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
    new_company_name: '',
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
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [fixingCheckId, setFixingCheckId] = useState<number | null>(null);
  const [savingType, setSavingType] = useState<'draft' | 'publish' | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const generateFocusKeyword = (title: string, location: string | null | undefined) => {
    if (!location) return title || '';
    return `${title} ${location.split(',')[0]}`.trim();
  };


  const handleAIFix = async (check: SEOCheck) => {
    setFixingCheckId(check.id);
    try {
      if (check.category === 'title') {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Rewrite this SEO title for http://www.hiringstores.com.
MANDATORY RULES:
1. Length MUST BE BETWEEN 50 AND 60 CHARACTERS. (VERY IMPORTANT)
2. Must start with the focus keyword.
3. MUST include a power word (Urgent, Top, Verified).
4. MUST include a sentiment word (Best, Exciting) OR a number (salary/openings).
Return ONLY the string. No quotes.`
              },
              {
                role: 'user',
                content: `Current title: ${currentJob.seo_title || currentJob.title}, Focus Keyword: ${currentJob.focus_keyword}, Company: ${companies.find(c => c.id === currentJob.company_id)?.name || 'Gethyrd'}, City: ${currentJob.location}, Salary: ${currentJob.salary_range || 'Competitive'}`
              }
            ]
          })
        });
        const data = await response.json();
        setCurrentJob({ ...currentJob, seo_title: data.choices[0].message.content.replace(/"/g, '') });
      } else if (check.category === 'meta') {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Rewrite this meta description for http://www.hiringstores.com so that:
1. Total length is EXACTLY 130-160 characters (count carefully)
2. Focus keyword appears naturally once
3. Mentions salary if provided
4. Ends EXACTLY with: 'Apply now on http://www.hiringstores.com.'
Return ONLY the new description string. No quotes or explanation.`
              },
              {
                role: 'user',
                content: `Current meta: ${currentJob.meta_description}, Focus Keyword: ${currentJob.focus_keyword}, Company: ${companies.find(c => c.id === currentJob.company_id)?.name || 'Gethyrd'}, Salary: ${currentJob.salary_range || 'Competitive'}`
              }
            ]
          })
        });
        const data = await response.json();
        setCurrentJob({ ...currentJob, meta_description: data.choices[0].message.content.replace(/"/g, '') });
      } else if (check.category === 'url') {
        const slug = (currentJob.focus_keyword || '')
          .toLowerCase()
          .replace(/\b(in|at|for|the|and|a|an|with|by|to|from)\b/g, '') // Remove stop words
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
          .trim()
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Remove double hyphens
          .replace(/^-|-$/g, ''); // Trim hyphens
        setCurrentJob({ ...currentJob, url_slug: slug });
      } else if (check.category === 'content') {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Fix this specific SEO issue in the job description: ${check.name}. 
${check.message}
Instructions:
- If links are missing, add them naturally.
- If paragraphs are too long, split them into max 3 sentences.
- If word count is low, expand the content with useful details.
- Use HTML format. Return ONLY the updated HTML description.`
              },
              {
                role: 'user',
                content: `Current Description: ${currentJob.description}, Focus Keyword: ${currentJob.focus_keyword}`
              }
            ]
          })
        });
        const data = await response.json();
        const updatedContent = data.choices[0].message.content.replace(/```html|```/g, '').trim();
        setCurrentJob({ ...currentJob, description: updatedContent, content_html: updatedContent });
      }
    } catch (error) {
      console.error('AI Fix Error:', error);
    } finally {
      setFixingCheckId(null);
    }
  };

  const handleFixAllChecklist = async () => {
    setIsFixingAll(true);
    try {
      const selectedCompany = companies.find(c => c.id === currentJob.company_id);
      const companyData = currentJob.company_id === 'new' 
        ? { name: currentJob.new_company_name } 
        : selectedCompany || { name: 'Gethyrd' };

      const enhanced = await enhanceJobSEO(currentJob, companyData);

      setCurrentJob(prev => ({
        ...prev,
        focus_keyword: enhanced.focus_keyword,
        seo_title: enhanced.seo_title,
        meta_description: enhanced.meta_description,
        url_slug: enhanced.url_slug,
        description: enhanced.content_html,
        content_html: enhanced.content_html,
        seo_score: enhanced.seo_score
      }));
    } catch (error) {
      console.error('All Checklist Enhance Error:', error);
      alert('Failed to enhance checklist. Please try again.');
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!currentJob.description) return;
    setIsEnhancing(true);
    try {
      const selectedCompany = companies.find(c => c.id === currentJob.company_id);
      const companyData = currentJob.company_id === 'new' 
        ? { name: currentJob.new_company_name } 
        : selectedCompany || { name: 'Gethyrd' };

      const enhanced = await enhanceJobSEO(currentJob, companyData);
      
      setCurrentJob({ 
        ...currentJob, 
        focus_keyword: enhanced.focus_keyword,
        seo_title: enhanced.seo_title,
        meta_description: enhanced.meta_description,
        url_slug: enhanced.url_slug,
        description: enhanced.content_html,
        content_html: enhanced.content_html,
        seo_score: enhanced.seo_score
      });
    } catch (error) {
      console.error('Enhance Error:', error);
      alert('Failed to enhance description. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };


  const internalOnSave = (isApproved: boolean) => {
    if (!currentJob.title || (!currentJob.company_id && !currentJob.new_company_name) || !currentJob.description || !currentJob.location) {
      alert('Please fill in required fields (Title, Company, Description, Location)');
      return;
    }

    setSavingType(isApproved ? 'publish' : 'draft');
    
    const finalJob = {
      ...currentJob,
      is_approved: isApproved,
      seo_score: seoReport.score
    };
    onSave(finalJob);
  };

  const selectedCompany = companies.find(c => c.id === currentJob.company_id);
  const companyName = currentJob.company_id === 'new' ? currentJob.new_company_name : selectedCompany?.name;

  return (
    <Card className="p-0 border-0 bg-transparent shadow-none overflow-visible">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-8 items-start"
      >
        {/* Main Job Details Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 max-w-[650px] bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-10"
        >
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
            {/* Row 1: Title & Company */}
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Job Title *</label>
              </div>
              <Input 
                className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                placeholder="e.g. Senior Frontend Developer" 
                value={currentJob.title || ''}
                onChange={e => setCurrentJob({...currentJob, title: e.target.value})}
              />
            </div>
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Company *</label>
              </div>
              <div className="space-y-3">
                <select 
                  className="flex h-12 w-full rounded-xl border-0 bg-gray-50 px-4 text-sm font-bold shadow-none focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  value={currentJob.company_id || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setCurrentJob({
                      ...currentJob, 
                      company_id: val, 
                      new_company_name: val === 'new' ? (currentJob.new_company_name || '') : ''
                    });
                  }}
                >
                  <option value="">Select Existing Company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="new">+ Add New Company</option>
                </select>
                
                {(currentJob.company_id === 'new' || !currentJob.company_id) && (
                  <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                    <Building2 className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                    <Input 
                      className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                      placeholder="Or type a new company name..." 
                      value={currentJob.new_company_name || ''}
                      onChange={e => setCurrentJob({
                        ...currentJob, 
                        new_company_name: e.target.value,
                        company_id: e.target.value ? 'new' : ''
                      })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Location & Salary */}
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Location *</label>
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                <Input 
                  className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. Pune, Maharashtra" 
                  value={currentJob.location || ''}
                  onChange={e => setCurrentJob({...currentJob, location: e.target.value})}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between h-6 mb-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Salary Range</label>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-[2] relative group">
                    <div className="absolute left-4 top-4 h-4 w-4 text-indigo-500 transition-all group-focus-within:scale-110 z-10">
                      {currentJob.salary_range?.includes('$') || currentJob.salary_range?.includes('USD') ? <DollarSign className="w-full h-full" /> : <Zap className="w-full h-full" />}
                    </div>
                    <Input 
                      className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                      placeholder="e.g. 80k - 120k" 
                      value={(currentJob.salary_range || "")
                        .replace(/^[₹\$]/, "")
                        .replace(/\s?USD|\s?Rupee|\s?Dollar/gi, "")
                        .replace(/\s?\/\s?month|\s?PA/gi, "")
                        .trim()}
                      onChange={e => {
                        const amount = e.target.value;
                        const current = currentJob.salary_range || "";
                        const prefix = current.match(/^[₹\$]/)?.[0] || "";
                        const cSuffix = current.match(/\s?USD|\s?Rupee|\s?Dollar/gi)?.[0] || "";
                        const fSuffix = current.match(/\s?\/\s?month|\s?PA/gi)?.[0] || "";
                        setCurrentJob({...currentJob, salary_range: prefix + amount + cSuffix + fSuffix});
                      }}
                    />
                  </div>
                  <div className="flex-1 relative group">
                    <Globe className="absolute left-3 top-4 h-4 w-4 text-gray-400 group-focus-within:text-indigo-400 transition-colors z-10 pointer-events-none" />
                    <Select 
                      className="h-12 pl-10 border-gray-100 bg-gray-50 font-bold text-[10px]"
                      value={
                        currentJob.salary_range?.startsWith('₹') ? '₹' :
                        currentJob.salary_range?.startsWith('$') ? '$' :
                        currentJob.salary_range?.includes('USD') ? 'USD' :
                        currentJob.salary_range?.includes('Rupee') ? 'Rupee' :
                        currentJob.salary_range?.includes('Dollar') ? 'Dollar' : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        let amount = (currentJob.salary_range || "")
                          .replace(/^[₹\$]/, "")
                          .replace(/\s?USD|\s?Rupee|\s?Dollar/gi, "")
                          .replace(/\s?\/\s?month|\s?PA/gi, "")
                          .trim();
                        const fSuffix = (currentJob.salary_range || "").match(/\s?\/\s?month|\s?PA/gi)?.[0] || "";
                        
                        if (val === '₹' || val === '$') {
                          setCurrentJob({...currentJob, salary_range: val + amount + fSuffix});
                        } else if (val) {
                          setCurrentJob({...currentJob, salary_range: amount + ' ' + val + fSuffix});
                        } else {
                          setCurrentJob({...currentJob, salary_range: amount + fSuffix});
                        }
                      }}
                    >
                      <option value="">Currency</option>
                      <option value="₹">₹ INR</option>
                      <option value="$">$ USD</option>
                      <option value="USD">USD</option>
                    </Select>
                  </div>
                  <div className="flex-1 relative group">
                    <Clock className="absolute left-3 top-4 h-4 w-4 text-gray-400 group-focus-within:text-indigo-400 transition-colors z-10 pointer-events-none" />
                    <Select 
                      className="h-12 pl-10 border-gray-100 bg-gray-50 font-bold text-[10px]"
                      value={
                        currentJob.salary_range?.includes('/ month') ? '/ month' :
                        currentJob.salary_range?.includes('PA') ? 'PA' : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        let base = (currentJob.salary_range || "")
                          .replace(/\s?\/\s?month|\s?PA/gi, "")
                          .trim();
                        setCurrentJob({...currentJob, salary_range: base + (val ? ' ' + val : '')});
                      }}
                    >
                      <option value="">Period</option>
                      <option value="/ month">Monthly</option>
                      <option value="PA">Yearly</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Job Type & Experience */}
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Job Type</label>
              </div>
              <select 
                className="flex h-12 w-full rounded-xl border-0 bg-gray-50 px-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                value={currentJob.job_type || ''}
                onChange={e => setCurrentJob({...currentJob, job_type: e.target.value})}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Experience</label>
              </div>
              <Input 
                className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                placeholder="e.g. 2-5 Years" 
                value={currentJob.experience_level || ''}
                onChange={e => setCurrentJob({...currentJob, experience_level: e.target.value})}
              />
            </div>

            {/* Row 4: Category & Apply Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Job Category</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    const newCat = prompt("Enter new category name:");
                    if (newCat) {
                      setCurrentJob({...currentJob, category: newCat});
                    }
                  }}
                  className="h-7 px-2 rounded-lg text-[9px] font-black text-primary hover:bg-primary/5 uppercase tracking-widest border border-primary/20"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add New
                </Button>
              </div>
              <div className="relative group">
                <Input 
                  className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. Production, Quality" 
                  value={currentJob.category || ''}
                  onChange={e => setCurrentJob({...currentJob, category: e.target.value})}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">External Apply Link</label>
              </div>
              <div className="relative">
                <Globe className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                <Input 
                  className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="https://company.com/careers" 
                  value={currentJob.apply_link || ''}
                  onChange={e => setCurrentJob({...currentJob, apply_link: e.target.value})}
                />
              </div>
            </div>

            {/* Row 5: Dates */}
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Date Posted</label>
              </div>
              <Input 
                type="date"
                className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                value={currentJob.date_posted || ''}
                onChange={e => setCurrentJob({...currentJob, date_posted: e.target.value})}
              />
            </div>
            <div>
              <div className="flex items-center justify-between h-6 mb-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Valid Through</label>
              </div>
              <Input 
                type="date"
                className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                value={currentJob.valid_through || ''}
                onChange={e => setCurrentJob({...currentJob, valid_through: e.target.value})}
              />
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
              value={currentJob.description || ''}
              onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
            />
          </div>
          
          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Job Media (Image/Video)</h3>
              <p className="text-[10px] text-gray-500 font-bold mb-6">Add an engaging image or video to highlight this job posting.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Source</label>
                    <div className="flex bg-gray-50 p-1 rounded-lg">
                      <button 
                        type="button"
                        onClick={() => setCurrentJob({...currentJob, media_type: 'image'})}
                        className={cn(
                          "px-3 py-1 text-[9px] font-black rounded-md transition-all",
                          currentJob.media_type === 'image' || !currentJob.media_type ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                        )}
                      >IMAGE</button>
                      <button 
                        type="button"
                        onClick={() => setCurrentJob({...currentJob, media_type: 'video'})}
                        className={cn(
                          "px-3 py-1 text-[9px] font-black rounded-md transition-all",
                          currentJob.media_type === 'video' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"
                        )}
                      >VIDEO</button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Input 
                      className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                      placeholder={currentJob.media_type === 'video' ? "Paste Video URL (YouTube/MP4)" : "Paste Image URL or Upload"}
                      value={currentJob.media_url || ''}
                      onChange={e => setCurrentJob({...currentJob, media_url: e.target.value})}
                    />
                  </div>

                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingMedia(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const filePath = `job-media/${fileName}`;
                          
                          const { error: uploadError } = await supabase.storage
                            .from('banners')
                            .upload(filePath, file);
                          
                          if (uploadError) throw uploadError;
                          
                          const { data } = supabase.storage
                            .from('banners')
                            .getPublicUrl(filePath);
                          
                          setCurrentJob({ 
                            ...currentJob, 
                            media_url: data.publicUrl,
                            media_type: file.type.startsWith('video/') ? 'video' : 'image'
                          });
                        } catch (err: any) {
                          alert('Upload failed: ' + err.message);
                        } finally {
                          setIsUploadingMedia(false);
                        }
                      }}
                      accept="image/*,video/*"
                      disabled={isUploadingMedia}
                    />
                    <Button variant="outline" className="h-12 w-full rounded-xl border-gray-100 bg-gray-50 hover:bg-white transition-all shadow-sm font-bold text-xs" disabled={isUploadingMedia}>
                      {isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2 text-indigo-500" />}
                      UPLOAD FROM COMPUTER
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden flex items-center justify-center min-h-[160px] relative">
                  {currentJob.media_url ? (
                    currentJob.media_type === 'video' ? (
                      <video src={currentJob.media_url} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={currentJob.media_url} alt="Job Media" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="text-center p-6">
                      <PlayCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Media Preview</p>
                    </div>
                  )}
                  {currentJob.media_url && (
                    <button 
                      onClick={() => setCurrentJob({...currentJob, media_url: '', media_type: 'image'})}
                      className="absolute top-3 right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8">
             <a 
               href={currentJob.id ? `/jobs/${currentJob.url_slug || currentJob.id}` : '#'} 
               target={currentJob.id ? "_blank" : "_self"}
               rel="noopener noreferrer"
               className="w-full sm:w-auto"
               onClick={(e) => {
                 if (!currentJob.id) {
                   e.preventDefault();
                   setShowPreview(true);
                 }
               }}
             >
               <Button 
                 variant="outline"
                 type="button"
                 className="h-11 px-5 border-2 border-indigo-100 bg-white text-indigo-600 font-bold rounded-xl transition-all w-full hover:bg-indigo-50 text-xs"
               >
                 <Eye className="h-4 w-4 mr-2" />
                 {currentJob.id ? 'VIEW LIVE' : 'PREVIEW'}
               </Button>
             </a>
             <Button 
               variant="outline"
               onClick={() => internalOnSave(false)} 
               disabled={loading} 
               className="h-11 px-5 border-2 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 font-bold rounded-xl transition-all w-full sm:w-auto text-xs"
             >
               {loading && savingType === 'draft' ? (
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                 <FileText className="h-4 w-4 mr-2" />
               )}
               <span className="whitespace-nowrap">SAVE DRAFT</span>
             </Button>
             <Button 
               onClick={() => internalOnSave(true)} 
               disabled={loading} 
               className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 w-full sm:w-auto text-xs"
             >
               {loading && savingType === 'publish' ? (
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               ) : (
                 <Save className="h-4 w-4 mr-2" />
               )}
               <span className="whitespace-nowrap">PUBLISH JOB</span>
             </Button>
          </div>
        </motion.div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gray-50 rounded-[40px] shadow-2xl overflow-hidden relative border border-gray-100">
                  {/* Modal Header/Close */}
                  <div className="absolute top-6 right-6 z-[110]">
                    <button 
                      onClick={() => setShowPreview(false)}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors text-white border border-white/20 shadow-xl"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="max-h-[90vh] overflow-y-auto">
                    {/* Gradient Header Mockup */}
                    <div className="h-48 bg-gradient-to-r from-indigo-600 to-indigo-900 relative">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
                    </div>

                    <div className="px-6 md:px-12 -mt-24 pb-16 relative z-10">
                      <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Content Area */}
                        <div className="flex-1 space-y-8">
                          <Card className="p-8 md:p-12 border-0 shadow-2xl shadow-gray-200/50 bg-white rounded-[32px]">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                              <div className="flex items-start gap-6">
                                <div className="w-20 h-20 rounded-[24px] bg-white border border-gray-100 shadow-xl shadow-gray-100 flex items-center justify-center text-3xl font-black text-indigo-600 p-2 overflow-hidden shrink-0">
                                  {companyName?.charAt(0) || 'G'}
                                </div>
                                <div className="space-y-2">
                                  <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight">
                                    {currentJob.title || 'Your Job Title Here'}
                                  </h1>
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-600" /> {companyName || 'Company Name'}</span>
                                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> {currentJob.location || 'Location'}</span>
                                    {currentJob.salary_range && (
                                      <span className="flex items-center gap-1.5 text-indigo-600"><Star className="w-4 h-4 fill-indigo-600" /> {currentJob.salary_range}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Badges Bar */}
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-8 mb-8 overflow-x-auto whitespace-nowrap">
                              <Badge className="px-4 py-1.5 font-black text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-widest">{currentJob.job_type || 'FULL-TIME'}</Badge>
                              <Badge className="px-4 py-1.5 font-black text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest">{currentJob.experience_level || 'EXPERIENCED'}</Badge>
                              <Badge className="px-4 py-1.5 font-black text-[10px] bg-amber-50 text-amber-600 border-amber-100 uppercase tracking-widest">URGENT</Badge>
                              <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Posted {new Date().toLocaleDateString()}
                              </span>
                            </div>

                            {/* Job Description Body */}
                            <div className="prose prose-slate max-w-none space-y-12">
                              <section>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                  </div> 
                                  Job Description
                                </h2>
                                <div 
                                  className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap html-content"
                                  dangerouslySetInnerHTML={{ __html: currentJob.description || '<p className="text-gray-400 italic">No description provided yet...</p>' }}
                                />
                              </section>

                              {currentJob.salary_range && (
                                <section className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
                                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-4">
                                    <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" /> Salary & Benefits
                                  </h2>
                                  <p className="text-gray-700 font-medium">
                                    This position at {companyName} offers a salary of <strong>{currentJob.salary_range}</strong>. Candidates will also be eligible for standard statutory benefits as per company policy.
                                  </p>
                                </section>
                              )}

                              <section className="pt-8 border-t border-gray-100">
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
                                  <Building2 className="w-6 h-6 text-indigo-600" /> About the Company
                                </h2>
                                <div className="text-gray-600 leading-relaxed font-medium">
                                  {companyName} is a verified employer in the industrial sector. They are looking for dedicated professionals to join their team and contribute to their growth.
                                </div>
                              </section>
                            </div>
                          </Card>
                        </div>

                        {/* Sidebar Mockup */}
                        <aside className="w-full lg:w-[350px] space-y-8">
                          <Card className="p-8 border-0 shadow-2xl shadow-indigo-100/30 bg-gray-900 text-white rounded-3xl sticky top-8">
                            <h3 className="text-xl font-black mb-6">Quick Overview</h3>
                            <div className="space-y-4 mb-10">
                              <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                                <span className="text-gray-400">Salary</span>
                                <span className="text-indigo-400">{currentJob.salary_range || 'Competitive'}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                                <span className="text-gray-400">Job Type</span>
                                <span className="text-white">{currentJob.job_type}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                                <span className="text-gray-400">Location</span>
                                <span className="text-white">{currentJob.location || 'Remote'}</span>
                              </div>
                            </div>
                            
                            <Button className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-500/20 pointer-events-none">
                              APPLY NOW
                            </Button>
                          </Card>
                        </aside>
                      </div>

                      <div className="mt-12 flex justify-center pb-8">
                        <Button 
                          onClick={() => setShowPreview(false)}
                          className="h-14 px-12 bg-gray-900 text-white font-black rounded-2xl shadow-xl transition-transform hover:scale-105"
                        >
                          CLOSE PREVIEW & CONTINUE EDITING
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SEO Sidebar */}
        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-[380px] shrink-0 space-y-8 sticky top-10"
        >
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
                    value={currentJob.focus_keyword || ''}
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
                    value={currentJob.url_slug || ''}
                    onChange={e => {
                        const val = e.target.value.toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except space and hyphen
                            .replace(/\s+/g, '-')       // Replace spaces with hyphens
                            .replace(/-+/g, '-');       // Replace multiple hyphens with single hyphen
                        setCurrentJob({...currentJob, url_slug: val});
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">SEO Title</label>
                <div className="relative group">
                  <Input 
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl pr-12 focus:ring-indigo-500/50"
                    value={currentJob.seo_title || ''}
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
                    value={currentJob.meta_description || ''}
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

            <div className="pt-4 mt-6 border-t border-white/10">
              <Button 
                onClick={handleFixAllChecklist}
                disabled={isFixingAll}
                className="h-12 w-full text-[12px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-500/20"
              >
                {isFixingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Full SEO Optimization
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest whitespace-nowrap">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> SEO Checklist
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFixAllChecklist}
                disabled={isFixingAll}
                className="h-8 px-3 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg uppercase tracking-wider"
              >
                {isFixingAll ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
                AI ENHANCE
              </Button>
            </div>
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

        </motion.aside>
      </motion.div>
    </Card>
  );
}
