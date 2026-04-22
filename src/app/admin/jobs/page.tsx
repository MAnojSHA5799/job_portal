"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Check, 
  X, 
  Zap, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trash2,
  Eye,
  Plus,
  Save,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Pencil,
  FileDown,
  Globe,
  Sparkles,
  RefreshCcw,
  ArrowLeft,
  Star,
  Wand2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { enhanceJobSEO } from '@/lib/seo-enhancer';

interface Job {
  id: string;
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
  date_posted: string | null;
  created_at: string;
  seo_score?: number;
  companies: {
    name: string;
  };
}

export default function JobsQueue() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isBulkEnhancing, setIsBulkEnhancing] = useState(false);
  const [enhancingJobIds, setEnhancingJobIds] = useState<Set<string>>(new Set());
  const [enhancingProgress, setEnhancingProgress] = useState({ current: 0, total: 0 });
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    failed: 0
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (selectedCompanyId !== 'all') {
        query = query.eq('company_id', selectedCompanyId);
      }

      query = query.range(from, to);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      setJobs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [
        { count: total },
        { count: pending },
        { count: approved },
        { count: failed }
      ] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('scraper_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed')
      ]);

      setStats({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        failed: failed || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [currentPage, itemsPerPage, selectedCompanyId]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStatusUpdate = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_approved: approved })
        .eq('id', id);

      if (error) throw error;
      fetchJobs();
      fetchStats();
    } catch (error) {
      alert('Error updating job status');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
      fetchJobs();
      fetchStats();
    } catch (e: any) {
      alert('Error deleting job: ' + e.message);
    }
  };

  const handleBulkEnhance = async () => {
    // Filter jobs that need enhancement (score < 70)
    const jobsToEnhance = jobs.filter(j => (j.seo_score || 0) < 70);
    
    if (!jobsToEnhance.length) {
      alert('All jobs on this page already have a satisfactory SEO score (70+).');
      return;
    }

    if (!confirm(`Found ${jobsToEnhance.length} jobs needing optimization (Score < 70). Do you want to AI Enhance them?`)) return;

    setIsBulkEnhancing(true);
    setEnhancingProgress({ current: 0, total: jobsToEnhance.length });
    setEnhancingJobIds(new Set());

    try {
      // Process in small batches to avoid rate limits and keep it fast
      const batchSize = 2; 
      for (let i = 0; i < jobsToEnhance.length; i += batchSize) {
        const batch = jobsToEnhance.slice(i, i + batchSize);
        
        // Mark these IDs as enhancing
        setEnhancingJobIds(prev => {
          const next = new Set(prev);
          batch.forEach(j => next.add(j.id));
          return next;
        });

        await Promise.all(batch.map(async (job) => {
          try {
            const enhancedData = await enhanceJobSEO(job, job.companies?.name || 'Gethyrd');
            
            const { error } = await supabase
              .from('jobs')
              .update({
                ...enhancedData,
                is_approved: true
              })
              .eq('id', job.id);

            if (error) throw error;
          } catch (err) {
            console.error(`Error enhancing job ${job.id}:`, err);
          } finally {
            setEnhancingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            setEnhancingJobIds(prev => {
              const next = new Set(prev);
              next.delete(job.id);
              return next;
            });
          }
        }));
      }
      
      fetchJobs();
      fetchStats();
      alert('Bulk SEO Enhancement completed successfully!');
    } catch (error) {
      console.error('Bulk Enhancement Error:', error);
      alert('Error during bulk enhancement');
    } finally {
      setIsBulkEnhancing(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      
      <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Jobs Queue <Badge className="bg-indigo-600 text-white border-0 font-bold">{totalCount}</Badge>
            </h1>
            <p className="text-gray-500 font-medium">Manage, audit, and optimize your manufacturing job postings.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => { fetchJobs(); fetchStats(); }}
              className="h-11 w-11 p-0 border-gray-200 bg-white hover:bg-gray-50 transition-all rounded-xl shadow-sm"
            >
              <RefreshCcw className={cn("h-4 w-4 text-gray-600", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" className="h-11 px-5 border-gray-200 bg-white hover:bg-gray-50 transition-all rounded-xl shadow-sm font-bold text-gray-700 whitespace-nowrap flex items-center justify-center">
              <FileDown className="mr-2 h-4 w-4 shrink-0" /> Export
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBulkEnhance}
              disabled={isBulkEnhancing || loading || jobs.length === 0}
              className="h-11 px-5 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all rounded-xl shadow-sm font-bold whitespace-nowrap flex items-center justify-center"
            >
              {isBulkEnhancing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {isBulkEnhancing ? `Enhancing ${enhancingProgress.current}/${enhancingProgress.total}` : 'ALL AI ENHANCE'}
              </span>
            </Button>
            <Link href="/admin/jobs/new" className="shrink-0">
              <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all font-black rounded-xl border-0 whitespace-nowrap flex items-center justify-center">
                <Plus className="mr-2 h-4 w-4 shrink-0" /> POST NEW JOB
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Postings', value: stats.total, icon: Briefcase, color: 'indigo' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'orange' },
            { label: 'Live on Portal', value: stats.approved, icon: CheckCircle2, color: 'emerald' },
            { label: 'Scraper Issues', value: stats.failed, icon: AlertCircle, color: 'rose' }
          ].map((stat, i) => (
            <Card key={i} className="p-6 border-0 shadow-sm bg-white rounded-3xl overflow-hidden relative group">
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150",
                `bg-${stat.color}-600`
              )} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                  "p-3 rounded-2xl transition-all",
                  `bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white`
                )}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters & Table Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg group">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Search jobs, categories, or cities..." 
                className="h-12 pl-11 bg-white border-0 shadow-sm rounded-2xl focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <select 
                className="h-12 pl-4 pr-10 rounded-2xl bg-white border-0 shadow-sm text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 outline-none min-w-[200px]"
                value={selectedCompanyId}
                onChange={e => {
                  setSelectedCompanyId(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Companies</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select 
                className="h-12 pl-4 pr-10 rounded-2xl bg-white border-0 shadow-sm text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                value={itemsPerPage}
                onChange={e => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10 Per Page</option>
                <option value={20}>20 Per Page</option>
                <option value={50}>50 Per Page</option>
              </select>
              <Button variant="outline" className="h-12 w-12 p-0 border-0 bg-white shadow-sm hover:bg-gray-50 rounded-2xl">
                <Filter className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white rounded-[32px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Job Information</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Location & Pay</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SEO Score</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading queue...</p>
                        </div>
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                            <Briefcase className="h-8 w-8 text-gray-300" />
                          </div>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No jobs found in queue</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-indigo-50/30 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-indigo-600 shadow-sm overflow-hidden shrink-0">
                               {job.title.charAt(0)}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{job.companies?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                              <MapPin className="h-3 w-3 text-indigo-500" /> {job.location}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-lg">
                              <Star className="h-3 w-3 fill-indigo-600" /> {job.salary_range || 'Competitive'}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm relative",
                              enhancingJobIds.has(job.id) ? "bg-indigo-100 text-indigo-600" :
                              (job.seo_score || 0) >= 85 ? "bg-emerald-50 text-emerald-600" :
                              (job.seo_score || 0) >= 70 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {enhancingJobIds.has(job.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                job.seo_score || 0
                              )}
                            </div>
                            {(job.seo_score || 0) < 85 && !enhancingJobIds.has(job.id) && (
                              <Tooltip text="Low SEO Score - Recommended to optimize">
                                <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <Badge className={cn(
                               "border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-lg",
                               job.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                             )}>
                               {job.is_approved ? 'Approved' : 'Audit Needed'}
                             </Badge>
                             {!job.is_approved && (
                               <Button 
                                 size="sm" 
                                 onClick={() => handleStatusUpdate(job.id, true)}
                                 className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg border-0 shadow-sm"
                               >
                                 APPROVE
                               </Button>
                             )}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => setViewingJob(job)}
                               className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Link href={`/admin/jobs/${job.id}/edit`}>
                               <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-amber-50 hover:text-amber-600">
                                 <Pencil className="h-4 w-4" />
                               </Button>
                             </Link>
                             <div className="relative">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setOpenDropdownId(openDropdownId === job.id ? null : job.id)}
                                  className="h-9 w-9 rounded-xl hover:bg-gray-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                <AnimatePresence>
                                  {openDropdownId === job.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-12 z-50 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 overflow-hidden"
                                      >
                                        <button 
                                          onClick={() => { handleStatusUpdate(job.id, !job.is_approved); setOpenDropdownId(null); }}
                                          className={cn(
                                            "flex items-center w-full px-4 py-3 text-xs font-bold rounded-xl transition-colors mb-1",
                                            job.is_approved ? "text-orange-600 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"
                                          )}
                                        >
                                          {job.is_approved ? <X className="h-4 w-4 mr-3" /> : <Check className="h-4 w-4 mr-3" />}
                                          {job.is_approved ? 'Suspend Listing' : 'Approve Posting'}
                                        </button>
                                        <button 
                                          onClick={() => { window.open(job.source_url, '_blank'); setOpenDropdownId(null); }}
                                          className="flex items-center w-full px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors mb-1"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-3" /> View Source
                                        </button>
                                        <div className="h-px bg-gray-50 my-1" />
                                        <button 
                                          onClick={() => { handleDeleteJob(job.id); setOpenDropdownId(null); }}
                                          className="flex items-center w-full px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4 mr-3" /> Delete Permanently
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                             </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Showing {Math.min(jobs.length, itemsPerPage)} of {totalCount} records
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="h-10 px-4 rounded-xl border-gray-200 bg-white font-bold"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "h-10 w-10 rounded-xl text-xs font-black transition-all",
                        currentPage === i + 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="h-10 px-4 rounded-xl border-gray-200 bg-white font-bold"
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Viewing Modal */}
      <AnimatePresence>
        {viewingJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingJob(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] z-10"
            >
              <Card className="p-6 rounded-[32px] hover:shadow-2xl hover:shadow-indigo-600/10 transition-all duration-500 border border-transparent hover:border-indigo-600/20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group h-full flex flex-col">
                  {/* Animated top gradient line */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-400 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
                  
                  {/* Close button for modal */}
                  <button 
                    onClick={() => setViewingJob(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-20"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex justify-between items-start mb-5 relative z-10 pr-10">
                      <div className="w-12 h-12 bg-gray-50/80 rounded-xl flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 shadow-inner group-hover:scale-110 group-hover:-rotate-6 group-hover:text-indigo-600 transition-all duration-300 overflow-hidden shrink-0">
                          {(viewingJob.companies?.name || 'J').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 origin-top-right">
                          <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all bg-white shadow-sm hover:shadow-md hover:shadow-rose-100 mb-1 group/star">
                              <Star className="w-4 h-4 group-hover/star:fill-rose-500 transition-colors" />
                          </button>
                          <Badge variant="info" className="bg-indigo-600/5 text-indigo-600 border-indigo-600/10 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                              {viewingJob.job_type || 'Full-time'}
                          </Badge>
                      </div>
                  </div>

                  <div className="mb-4 relative z-10">
                      <h3 className="text-base font-black text-gray-900 leading-[1.3] group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2 min-h-[42px]">
                          {viewingJob.title}
                      </h3>
                      <p className="text-gray-400 font-bold text-[11px] mt-1.5 group-hover:text-gray-500 transition-colors">
                          {viewingJob.companies?.name || 'Top Company'}
                      </p>
                  </div>
                  
                  <div className="mb-5 flex-grow relative z-10">
                      <div className="flex flex-wrap items-center gap-y-1.5 text-[11px] text-gray-500 font-bold bg-gray-50/80 p-2.5 rounded-xl group-hover:bg-indigo-600/[0.03] transition-colors duration-300">
                          <div className="flex items-center group-hover:text-indigo-600 transition-colors duration-300">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> {viewingJob.location || 'Remote'}
                          </div>
                          <span className="mx-2 text-gray-200">|</span>
                          <div className="flex items-center group-hover:text-indigo-600 transition-colors duration-300">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> {viewingJob.experience_level || '3-5 Years'}
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-auto pt-5 border-t border-gray-50 group-hover:border-indigo-600/10 transition-colors duration-300 relative z-10">
                      <div className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                          {viewingJob.salary_range || '$95k - $130k'}
                      </div>
                      <Button 
                          onClick={() => {
                              router.push(`/admin/jobs/${viewingJob.id}/edit`);
                              setViewingJob(null);
                          }}
                          className="rounded-xl px-4 h-10 text-sm font-black shadow-md shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all hover:-translate-y-1 flex items-center gap-1.5 group/btn bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                          Edit Job <Pencil className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                  </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
