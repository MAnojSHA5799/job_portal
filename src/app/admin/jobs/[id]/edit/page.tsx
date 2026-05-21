"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { JobForm } from '@/components/admin/JobForm';
import { Loader2, ArrowLeft, Briefcase, Sparkles, CheckCircle2, X, Globe, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  url_slug: string | null;
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const searchParams = useSearchParams();
  const isPublishedQuery = searchParams?.get('published') === 'true';

  useEffect(() => {
    if (isPublishedQuery && job) {
      const slug = job.url_slug || id;
      const url = `${window.location.origin}/jobs/${slug}`;
      setPublishedUrl(url);
      
      // Clean up the URL query parameter so it doesn't show again on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [isPublishedQuery, job, id]);

  const handleCopy = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();
        
        if (jobError) throw jobError;
        setJob(jobData);

        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, url_slug')
          .order('name');
        
        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Could not fetch job data');
        router.push('/admin/jobs');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleSave = async (jobData: any) => {
    setSaving(true);
    try {
      let finalCompanyId = jobData.company_id;

      // Handle new company creation
      if (jobData.new_company_name && (jobData.company_id === 'new' || !jobData.company_id)) {
        const cleanName = jobData.new_company_name.trim();
        
        // 1. Check if exists
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', cleanName)
          .single();
        
        if (existing) {
          finalCompanyId = existing.id;
        } else {
          // 2. Create new
          const { data: created, error: createError } = await supabase
            .from('companies')
            .insert([{ name: cleanName, industry: 'Technology' }])
            .select('id')
            .single();
          
          if (createError) throw createError;
          finalCompanyId = created.id;
        }
      }

      // Cleanup job data
      const { id: jobId, created_at, companies: _, new_company_name, ...updateData } = jobData;

      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ ...updateData, company_id: finalCompanyId })
        .eq('id', id)
        .select('id, url_slug')
        .single();
      
      if (error) throw error;
      
      if (!jobData.is_approved) {
        alert('Draft saved successfully!');
      } else {
        const slug = updatedJob?.url_slug || jobData.url_slug || id;
        const url = `${window.location.origin}/jobs/${slug}`;
        setPublishedUrl(url);
        // Update local job state to reflect any new changes (like url_slug)
        setJob((prev: any) => ({ ...prev, ...updateData, url_slug: updatedJob?.url_slug }));
      }
    } catch (error: any) {
      alert('Error saving job: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F8FAFC] gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
        </div>
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading job data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
           <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/jobs')}
                className="group -ml-3 text-gray-500 hover:text-indigo-600 hover:bg-transparent font-bold flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Queue
              </Button>
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   Edit Posting <Sparkles className="h-6 w-6 text-indigo-500 fill-indigo-500" />
                 </h1>
                 <p className="text-gray-500 font-medium">Refine the job details and maximize SEO performance.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 pr-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Briefcase className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job ID</p>
                 <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{id}</p>
              </div>
           </div>
        </div>

        <JobForm 
          key={job ? `${job.id}-${job.url_slug || ''}` : 'new'}
          initialData={job}
          companies={companies} 
          onSave={handleSave} 
          onCancel={() => router.push('/admin/jobs')}
          loading={saving}
          title="Core Job Details"
          subtitle="All fields marked with * are mandatory for publishing."
        />
      </div>

      {/* Premium Publish Success Modal */}
      <AnimatePresence>
        {publishedUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-lg bg-white rounded-[32px] border border-gray-100 shadow-2xl p-8 relative overflow-hidden"
            >
              {/* Background Glows */}
              <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setPublishedUrl(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 border border-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                {/* Success Icon Badge */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100/30 text-emerald-500 p-2 shrink-0"
                >
                  <CheckCircle2 className="h-10 w-10 animate-pulse" />
                </motion.div>

                {/* Headings */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2">
                    Job Published Successfully! <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-500" />
                  </h2>
                  <p className="text-sm text-gray-500 font-medium max-w-sm">
                    Your job posting is now live and SEO optimized for candidates and search engines.
                  </p>
                </div>

                {/* Live URL Slug Box */}
                <div className="w-full space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left block pl-2">
                    Live Job URL
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <div className="flex-1 min-w-0 flex items-center gap-2 pl-2">
                      <Globe className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-sm font-bold text-gray-700 truncate select-all text-left">
                        {publishedUrl}
                      </span>
                    </div>
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className={cn(
                        "h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm cursor-pointer",
                        copied 
                          ? "bg-emerald-500 text-white shadow-emerald-200" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <a 
                    href={publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button 
                      variant="outline"
                      className="w-full h-12 border-2 border-indigo-100 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 text-xs flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      VIEW LIVE JOB
                    </Button>
                  </a>
                  
                  <Button 
                    onClick={() => setPublishedUrl(null)}
                    className="w-full h-12 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 text-xs flex items-center justify-center gap-2"
                  >
                    DISMISS
                  </Button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
