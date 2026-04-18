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
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
        .order('created_at', { ascending: false })
        .range(from, to);

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

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [currentPage, itemsPerPage]);

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
            <Button variant="outline" className="h-11 px-5 border-gray-200 bg-white hover:bg-gray-50 transition-all rounded-xl shadow-sm font-bold text-gray-700">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Link href="/admin/jobs/new">
              <Button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all font-black rounded-xl border-0">
                <Plus className="mr-2 h-4 w-4" /> POST NEW JOB
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
            <div className="flex items-center gap-4">
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
                              "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm",
                              (job.seo_score || 0) >= 85 ? "bg-emerald-50 text-emerald-600" :
                              (job.seo_score || 0) >= 70 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {job.seo_score || 0}
                            </div>
                            {(job.seo_score || 0) < 85 && (
                              <Tooltip text="Low SEO Score - Recommended to optimize">
                                <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <Badge className={cn(
                             "border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-lg",
                             job.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                           )}>
                             {job.is_approved ? 'Approved' : 'Audit Needed'}
                           </Badge>
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
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-4xl font-black text-indigo-600 shadow-sm">
                    {viewingJob.title.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{viewingJob.title}</h2>
                    <p className="text-lg font-bold text-indigo-600 uppercase tracking-widest">{viewingJob.companies?.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewingJob(null)} className="rounded-2xl h-12 w-12 hover:bg-rose-50 hover:text-rose-500">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="p-10 pt-8 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-3xl space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Location</span>
                    <div className="flex items-center gap-3 font-bold text-gray-900 text-lg">
                      <MapPin className="h-5 w-5 text-indigo-500" /> {viewingJob.location}
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Type & Level</span>
                    <div className="flex items-center gap-3 font-bold text-gray-900 text-lg">
                      <Clock className="h-5 w-5 text-indigo-500" /> {viewingJob.job_type} • {viewingJob.experience_level}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Job Description</span>
                  <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                    {viewingJob.description}
                  </div>
                </div>
              </div>

              <div className="p-10 pt-0 flex items-center justify-between">
                <div className="text-sm font-bold text-gray-400">
                  Last Updated: {new Date(viewingJob.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-gray-200 font-bold" onClick={() => window.open(viewingJob.source_url, '_blank')}>
                    <ExternalLink className="mr-2 h-5 w-5" /> View Original
                  </Button>
                  <Button size="lg" className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100" onClick={() => {
                    router.push(`/admin/jobs/${viewingJob.id}/edit`);
                    setViewingJob(null);
                  }}>
                    <Pencil className="mr-2 h-5 w-5" /> EDIT POSTING
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
