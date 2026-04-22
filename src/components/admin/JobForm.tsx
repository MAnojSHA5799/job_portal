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
  const [isFixingAll, setIsFixingAll] = useState(false);
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

  const generateFocusKeyword = (title: string, location: string | null | undefined) => {
    if (!location) return title || '';
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
                content: `Rewrite this SEO title for Gethyrd.in.
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
                content: `Rewrite this meta description for Gethyrd.in so that:
1. Total length is EXACTLY 130-160 characters (count carefully)
2. Focus keyword appears naturally once
3. Mentions salary if provided
4. Ends EXACTLY with: 'Apply now on Gethyrd.in.'
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
      const focusKeyword = currentJob.focus_keyword || generateFocusKeyword(currentJob.title, currentJob.location);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an ELITE SEO copywriter. Generate a perfectly optimized job posting for Gethyrd.in.
Target Score: 100/100.
Return ONLY a valid JSON object.

CRITICAL RULES (ABSOLUTE TRUTH):
1. "focus_keyword": Use exactly '${focusKeyword}'.
2. "seo_title": Length MUST BE 50-60 chars. Start with '${focusKeyword}'. Include ONE power word (Urgent, Top, Verified, Exclusive) AND ONE sentiment word (Best, Exciting, Rewarding, Great) AND a number (e.g., "10+ openings", "₹15L salary").
3. "meta_description": Length MUST BE 130-160 chars. Include '${focusKeyword}'. Mention salary. End EXACTLY with 'Apply now on Gethyrd.in.'
4. "url_slug": Lowercase, hyphenated. MUST be exactly '${focusKeyword.toLowerCase().replace(/\s+/g, '-')}' but remove stop words (in, at, for, the, and, a, an).
5. "description": HTML format. MIN 1000 words. MUST FOLLOW ALL CHECKLIST RULES:
    - MUST include an <h1> tag containing exactly '${focusKeyword}'.
    - MUST include exactly 3+ <h2> tags.
    - At least one <h2> or <h3> MUST contain '${focusKeyword}'.
    - MUST include a section with header "<h2>Table of Contents</h2>" and a <ul> list.
    - MUST include a "Frequently Asked Questions" (FAQ) section with 3+ relevant questions.
    - MUST include exactly 2 internal links: <a href="/jobs">View All Jobs</a> and <a href="/">Back to Home</a>.
    - MUST include 1 external link to an industry authority or company site.
    - MUST include an <img> tag with alt="${focusKeyword} logo".
    - Achieve 1.2% Keyword Density: Repeat '${focusKeyword}' naturally 12-15 times.
    - Each paragraph MUST BE strictly 1-2 sentences only.
    - Ensure '${focusKeyword}' appears in the first 100 words of the text.
    - If content is short, EXPAND it with sections for: Job Overview, Role Responsibilities, Skill Requirements, and Benefits.`
            },
            {
              role: 'user',
              content: `Job Title: ${currentJob.title}, Company: ${companies.find(c => c.id === currentJob.company_id)?.name || 'Gethyrd'}, Location: ${currentJob.location}, Salary: ${currentJob.salary_range || 'Competitive'}, Raw Description: ${currentJob.description}`
            }
          ]
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      let finalDescription = aiResponse.description || aiResponse.content_html || '';

      // POWER FIXER: Programmatically ensure missing SEO elements are present
      if (!finalDescription.includes('Table of Contents')) {
        finalDescription = `<h2>Table of Contents</h2><ul><li><a href="#overview">Role Overview</a></li><li><a href="#requirements">Requirements</a></li><li><a href="#apply">How to Apply</a></li></ul>` + finalDescription;
      }
      
      if (!finalDescription.includes('<img')) {
        finalDescription += `<br/><img src="/logo.png" alt="${focusKeyword} logo" style="max-width:200px;" />`;
      }

      if (!finalDescription.includes('FAQ') && !finalDescription.includes('Frequently Asked Questions')) {
        finalDescription += `<h3>Frequently Asked Questions</h3><p><strong>Is this a full-time role?</strong> Yes, this is a ${currentJob.job_type || 'Full-time'} position.</p><p><strong>Where is it located?</strong> The job is based in ${currentJob.location}.</p>`;
      }

      // Keyword Density Booster: Append a small summary section if needed
      finalDescription += `<div style="margin-top:40px; border-top:1px solid #eee; padding-top:20px; color:#666; font-size:12px;">
        <p>Seeking a <strong>${focusKeyword}</strong>? This <strong>${focusKeyword}</strong> role in <strong>${currentJob.location}</strong> is perfect for those looking for a <strong>${focusKeyword}</strong> career. Apply now for this <strong>${focusKeyword}</strong> opportunity.</p>
      </div>`;

      // Programmatic cleanup for title and meta
      let finalSeoTitle = aiResponse.seo_title || '';
      if (finalSeoTitle.length > 60) {
        finalSeoTitle = finalSeoTitle.split('|')[0].split('-')[0].trim();
        if (finalSeoTitle.length > 60) finalSeoTitle = finalSeoTitle.substring(0, 60);
      }
      if (finalSeoTitle.length < 50) finalSeoTitle = (finalSeoTitle + " - Apply Now on Gethyrd").substring(0, 60);
      
      let finalMeta = aiResponse.meta_description || '';
      if (finalMeta.length > 160) finalMeta = finalMeta.substring(0, 157) + '...';
      if (finalMeta.length < 130) finalMeta = (finalMeta + " View full job details and salary information for this position on Gethyrd.in today. Apply now!").substring(0, 160);

      setCurrentJob(prev => ({
        ...prev,
        focus_keyword: aiResponse.focus_keyword || focusKeyword,
        seo_title: finalSeoTitle,
        meta_description: finalMeta,
        url_slug: focusKeyword.toLowerCase().replace(/\b(in|at|for|the|and|a|an|with|by|to|from)\b/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        description: finalDescription,
        content_html: finalDescription
      }));

      // ITERATIVE FIXING: Automatically fix any remaining issues
      let retryCount = 0;
      const MAX_RETRIES = 3;

      while (retryCount < MAX_RETRIES) {
        // Re-calculate score with latest data
        const currentScore = calculateSEOScore({
          ...currentJob,
          seo_title: finalSeoTitle,
          meta_description: finalMeta,
          description: finalDescription,
          content_html: finalDescription,
          focus_keyword: aiResponse.focus_keyword || focusKeyword,
          url_slug: focusKeyword.toLowerCase().replace(/\b(in|at|for|the|and|a|an|with|by|to|from)\b/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        });

        const failedChecks = currentScore.checks.filter(c => !c.passed && c.autoFixAvailable);
        
        if (failedChecks.length === 0) break;

        console.log(`Iterative Fix Round ${retryCount + 1}: Fixing ${failedChecks.length} items.`);
        
        for (const check of failedChecks) {
          // Internal fix logic for each check
          if (check.category === 'title') {
            const fixResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: `Fix this SEO title: ${check.name}. ${check.message}. Target 50-60 chars. Return only the title.` }, { role: 'user', content: finalSeoTitle }]
              })
            });
            const fixData = await fixResponse.json();
            finalSeoTitle = fixData.choices[0].message.content.replace(/"/g, '').trim();
          } else if (check.category === 'meta') {
            const fixResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: `Fix this meta description: ${check.name}. ${check.message}. Target 130-160 chars. Return only the meta.` }, { role: 'user', content: finalMeta }]
              })
            });
            const fixData = await fixResponse.json();
            finalMeta = fixData.choices[0].message.content.replace(/"/g, '').trim();
          } else if (check.category === 'content') {
            const fixResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: `Fix this HTML content issue: ${check.name}. ${check.message}. Return only the updated HTML.` }, { role: 'user', content: finalDescription }]
              })
            });
            const fixData = await fixResponse.json();
            finalDescription = fixData.choices[0].message.content.replace(/```html|```/g, '').trim();
          }
        }

        retryCount++;
      }

      // Final update after all iterations
      setCurrentJob(prev => ({
        ...prev,
        seo_title: finalSeoTitle,
        meta_description: finalMeta,
        description: finalDescription,
        content_html: finalDescription
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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert SEO copywriter for Gethyrd.in. Return a JSON object. 
STRICT RULES:
1. Return ONLY valid JSON.
2. Total word count in content_html: 1000-1,200 words.
3. Focus Keyword: [KEYWORD]. Achievement 1.2% density (repeat keyword 12 times).
4. MUST include header "<h2>Table of Contents</h2>".
5. MUST include <img alt="[KEYWORD] logo" />.
6. Output JSON schema: { 
    "seo_title": "string (50-60 chars)", 
    "meta_description": "string (130-160 chars)", 
    "url_slug": "string", 
    "content_html": "string (HTML format)", 
    "focus_keyword": "string" 
}`
            },
            {
              role: 'user',
              content: `Job Title: ${currentJob.title}, Company: ${companies.find(c => c.id === currentJob.company_id)?.name || 'Gethyrd'}, Location: ${currentJob.location}, Salary: ${currentJob.salary_range || 'Competitive'}, Experience: ${currentJob.experience_level}, Raw Description: ${currentJob.description}, Focus Keyword: ${currentJob.focus_keyword}`
            }
          ]
        })
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'OpenAI API Error');
      }

      if (!data.choices || !data.choices[0]) {
        throw new Error('No response from AI. Please check your API key and quota.');
      }

      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      // Update the job with all AI generated SEO data
      setCurrentJob({ 
        ...currentJob, 
        focus_keyword: aiResponse.focus_keyword || currentJob.focus_keyword,
        seo_title: aiResponse.seo_title,
        meta_description: aiResponse.meta_description,
        url_slug: aiResponse.url_slug?.replace('/jobs/', ''),
        description: aiResponse.content_html || aiResponse.content,
        content_html: aiResponse.content_html
      });
    } catch (error) {
      console.error('Enhance Error:', error);
      alert('Failed to parse AI response. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const internalOnSave = () => {
    if (!currentJob.title || !currentJob.company_id || !currentJob.description || !currentJob.location) {
      alert('Please fill in required fields (Title, Company, Description, Location)');
      return;
    }

    if (seoReport.score < 70) {
      alert(`SEO Score is too low (${seoReport.score}/100). Minimum 70 required to publish. Please fix critical SEO checks.`);
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
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> SEO Checklist
              </h4>
              <Button 
                onClick={handleFixAllChecklist}
                disabled={isFixingAll}
                className="h-8 px-3 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg uppercase tracking-wider shadow-md shadow-indigo-200"
              >
                {isFixingAll ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-2" />}
                All Checklist Enhance
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
        </aside>
      </div>
    </Card>
  );
}
