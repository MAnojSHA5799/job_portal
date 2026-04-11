"use client";
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Copy, 
  Trash2, 
  Merge, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  title: string;
  location: string;
  created_at: string;
  source_url: string;
  company_id: string;
  companies: {
    name: string;
  } | null;
}

interface DuplicateSet {
  title: string;
  companyName: string;
  jobs: Job[];
}

export default function DuplicateJobs() {
  const [duplicateSets, setDuplicateSets] = useState<DuplicateSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*, companies(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by title + company name
      const groups: Record<string, Job[]> = {};
      data?.forEach((job: any) => {
        const key = `${job.title.toLowerCase().trim()}|${(job.companies?.name || 'Unknown').toLowerCase().trim()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(job);
      });

      // Filter for groups with more than 1 job
      const sets: DuplicateSet[] = Object.values(groups)
        .filter(jobs => jobs.length > 1)
        .map(jobs => ({
          title: jobs[0].title,
          companyName: jobs[0].companies?.name || 'Unknown',
          jobs: jobs
        }));

      setDuplicateSets(sets);
    } catch (err) {
      console.error('Error fetching duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleIgnore = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      await fetchDuplicates();
    } catch (err) {
      alert('Failed to ignore/delete job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMerge = async (set: DuplicateSet) => {
    try {
      const primaryJob = set.jobs[0];
      const otherIds = set.jobs.slice(1).map(j => j.id);
      
      setActionLoading('merge-' + primaryJob.id);

      // 1. Approve primary job
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ is_approved: true })
        .eq('id', primaryJob.id);

      if (updateError) throw updateError;

      // 2. Delete duplicates
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .in('id', otherIds);

      if (deleteError) throw deleteError;

      await fetchDuplicates();
      alert(`Successfully merged ${set.jobs.length} instances into one approved job.`);
    } catch (err) {
      alert('Failed to merge jobs');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkCleanup = async () => {
    if (!confirm(`Are you sure you want to automatically resolve all ${duplicateSets.length} duplicate sets? This will keep one instance for each and delete the rest.`)) return;
    
    try {
      setLoading(true);
      for (const set of duplicateSets) {
        const otherIds = set.jobs.slice(1).map(j => j.id);
        await supabase.from('jobs').delete().in('id', otherIds);
      }
      await fetchDuplicates();
      alert('Bulk cleanup completed successfully.');
    } catch (err) {
      alert('Bulk cleanup encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Duplicate Jobs</h1>
          <p className="text-gray-500">Review and merge job postings that appear on multiple sources.</p>
        </div>
        {duplicateSets.length > 0 && (
          <Badge variant="warning" className="px-4 py-2 text-sm font-bold animate-pulse">
              <AlertTriangle className="h-4 w-4 mr-2" /> {duplicateSets.length} Potential Sets
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {loading ? (
             <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-gray-500 font-bold">Scanning for duplicates...</p>
             </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {duplicateSets.length === 0 ? (
               <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Duplicates Found!</h3>
                  <p className="text-gray-500 font-medium">Your job queue is clean and well-organized.</p>
               </div>
            ) : (
              duplicateSets.map((set, index) => (
                <motion.div
                  key={`${set.title}-${set.companyName}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="p-8 border-0 shadow-sm bg-white overflow-hidden relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <Copy className="h-5 w-5" />
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-gray-900">{set.title}</h3>
                              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{set.companyName}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {set.jobs.map((job) => (
                            <div key={job.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{job.source_url.split('/')[2] || 'Source'}</span>
                                  <span className="text-[10px] font-bold text-gray-400">Scraped {new Date(job.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-gray-400 hover:text-danger"
                                      onClick={() => handleIgnore(job.id)}
                                      disabled={!!actionLoading}
                                   >
                                      {actionLoading === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                   </Button>
                                   <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 text-gray-300 hover:text-primary transition-colors" />
                                   </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 lg:border-l lg:border-gray-100 lg:pl-10">
                          <Button 
                            className="flex-1 lg:flex-none shadow-lg shadow-primary/20 bg-primary"
                            onClick={() => handleMerge(set)}
                            disabled={!!actionLoading}
                          >
                              {actionLoading === 'merge-' + set.jobs[0].id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Merge className="h-4 w-4 mr-2" />}
                              Merge & Approve
                          </Button>
                      </div>
                    </div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      {!loading && duplicateSets.length > 0 && (
        <div className="bg-gray-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="relative z-10">
                <h3 className="text-xl font-black mb-2 tracking-tight">Bulk Cleanup Tool</h3>
                <p className="text-gray-400 text-sm font-medium">Clear all duplicate instances automatically. This will keep the latest entry for each set.</p>
            </div>
            <Button 
              variant="ghost" 
              className="relative z-10 text-white border-2 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest px-10 rounded-2xl"
              onClick={handleBulkCleanup}
            >
                Launch Bulk Action <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
      )}
    </div>
  );
}

// Helper icons that were used before
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
