"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { 
  MapPin, 
  Loader2, 
  Sparkles, 
  Save, 
  X 
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface Job {
  id?: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  experience_level: string;
  category: string;
  apply_link: string;
  source_url: string;
  company_id: string;
  is_approved: boolean;
  date_posted: string;
}

interface JobFormProps {
  initialData?: Partial<Job>;
  companies: Company[];
  onSave: (data: Partial<Job>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  title: string;
  subtitle: string;
}

export function JobForm({ 
  initialData = {}, 
  companies, 
  onSave, 
  onCancel, 
  loading = false,
  title,
  subtitle
}: JobFormProps) {
  const [currentJob, setCurrentJob] = useState<Partial<Job>>({
    title: '',
    company_id: '',
    description: '',
    location: '',
    salary_range: '',
    job_type: 'Full-time',
    experience_level: '',
    category: '',
    apply_link: '',
    source_url: '',
    is_approved: true,
    date_posted: new Date().toISOString().split('T')[0],
    ...initialData
  });

  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhanceDescription = async () => {
    if (!currentJob.description) {
      alert('Please provide some initial description to enhance.');
      return;
    }
    
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
              content: `You are an expert HR and Technical Recruitment specialist. Your task is to transform raw, unstructured job data into a highly professional, engaging, and perfectly formatted job description. 

Format the output strictly as clear plain text using standard spacing and characters (like '-' for bullets) so it looks great in a standard text field. Follow this exact structure:

Company Introduction & Role Overview:
(A brief, engaging 2-3 sentence introduction about the opportunity and what the candidate will do)

Key Responsibilities:
- (Action-oriented bullet points)
- (Detailing exactly what the day-to-day looks like)

Requirements & Qualifications:
- (Required skills, experience, and education)
- (Clear, non-negotiable must-haves)

Why Join Us:
- (Any benefits, perks, or growth opportunities mentioned)

Keep the tone professional, inviting, and clear. Do NOT use markdown syntax (like **, ##, or \`\`\`). Respond ONLY with the final formatted job description.`
            },
            {
              role: 'user',
              content: currentJob.title ? `Job Title: ${currentJob.title}\nDescription:\n${currentJob.description}` : currentJob.description
            }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      const enhancedText = data.choices[0].message.content;
      setCurrentJob({...currentJob, description: enhancedText});
    } catch (error: any) {
      console.error('AI Enhancement Error:', error);
      alert('Error enhancing description: ' + error.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const internalOnSave = () => {
    if (!currentJob.title || !currentJob.company_id || !currentJob.description || !currentJob.location) {
      alert('Please fill in required fields (Title, Company, Description, Location)');
      return;
    }
    onSave(currentJob);
  };

  return (
    <Card className="p-8 border-indigo-100 bg-white shadow-xl shadow-indigo-100/30 ring-1 ring-indigo-50">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-rose-50 hover:text-rose-500">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Job Title *</label>
            <Input 
              className="h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              placeholder="e.g. Senior Frontend Developer" 
              value={currentJob.title}
              onChange={e => setCurrentJob({...currentJob, title: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Company *</label>
            <select 
              className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Location *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <Input 
                className="h-11 pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                placeholder="e.g. Remote, New York, NY" 
                value={currentJob.location}
                onChange={e => setCurrentJob({...currentJob, location: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Salary Range</label>
            <Input 
              className="h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              placeholder="e.g. $120k - $150k" 
              value={currentJob.salary_range}
              onChange={e => setCurrentJob({...currentJob, salary_range: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Job Type</label>
                <select 
                  className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
                  value={currentJob.job_type}
                  onChange={e => setCurrentJob({...currentJob, job_type: e.target.value})}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Freelance">Freelance</option>
                </select>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Experience</label>
                <Input 
                  className="h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                  placeholder="e.g. 3+ Years" 
                  value={currentJob.experience_level}
                  onChange={e => setCurrentJob({...currentJob, experience_level: e.target.value})}
                />
             </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
            <Input 
              className="h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              placeholder="e.g. Engineering, Design" 
              value={currentJob.category}
              onChange={e => setCurrentJob({...currentJob, category: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date Posted</label>
            <Input 
              type="date"
              className="h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              value={currentJob.date_posted}
              onChange={e => setCurrentJob({...currentJob, date_posted: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Apply Link (External)</label>
            <Input 
              className="h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
              placeholder="https://company.com/apply" 
              value={currentJob.apply_link}
              onChange={e => setCurrentJob({...currentJob, apply_link: e.target.value})}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Job Description *</label>
              <Button 
                variant="ghost" 
                size="sm" 
                type="button"
                onClick={handleEnhanceDescription}
                disabled={isEnhancing}
                className="h-6 px-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 uppercase tracking-wider rounded flex items-center shadow-sm"
              >
                {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
              </Button>
            </div>
            <textarea 
              className="flex min-h-[300px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
              placeholder="Detailed job responsibilities and requirements..."
              value={currentJob.description}
              onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
        <Button variant="ghost" onClick={onCancel} className="h-11 px-6 font-semibold">Cancel</Button>
        <Button onClick={internalOnSave} disabled={loading} className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 text-white">
          <Save className="mr-2 h-4 w-4" /> Save Job Post
        </Button>
      </div>
    </Card>
  );
}
