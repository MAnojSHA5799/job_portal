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
  PlusCircle,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Pencil,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  name: string;
}

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
        query = query.ilike('title', `%${searchQuery}%`);
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
      // 1. Total Jobs
      const { count: total, error: totalErr } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      // 2. Pending Jobs
      const { count: pending, error: pendingErr } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      // 3. Approved Jobs
      const { count: approved, error: approvedErr } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      // 4. Failed Scrapes (from scraper_logs)
      const { count: failed, error: failedErr } = await supabase
        .from('scraper_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');

      if (totalErr || pendingErr || approvedErr) {
        console.error('Stats fetch error:', { totalErr, pendingErr, approvedErr });
      }

      setStats({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        failed: failed || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [currentPage, itemsPerPage]); // Re-fetch when page or limit changes

  // Reset to first page when searching
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchJobs();
    }
  }, [searchQuery]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleStatusUpdate = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_approved: approved })
        .eq('id', id);

      if (error) throw error;
      fetchJobs(); // Refresh list
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
    } catch (e: any) {
      alert('Error deleting job: ' + e.message);
    }
  };



  return (
    <div className="space-y-8 p-6 bg-gray-50/30 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Jobs Queue</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Manage, review, and optimize scraped job postings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-4 border-gray-200 hover:bg-white hover:text-primary transition-all shadow-sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" className="h-10 px-4 border-gray-200 hover:bg-white hover:text-primary transition-all shadow-sm">
            <FileDown className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Link href="/admin/jobs/new">
            <Button className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Add Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Jobs', 
            value: stats.total, 
            trend: '+ 12.5%', 
            icon: Briefcase, 
            color: 'bg-indigo-50 text-indigo-600',
            trendColor: 'text-emerald-500',
            chartColor: 'indigo'
          },
          { 
            title: 'Pending Review', 
            value: stats.pending, 
            trend: '- 5.2%', 
            icon: Clock, 
            color: 'bg-orange-50 text-orange-600',
            trendColor: 'text-rose-500',
            chartColor: 'orange'
          },
          { 
            title: 'Approved Jobs', 
            value: stats.approved, 
            trend: '+ 8.1%', 
            icon: CheckCircle2, 
            color: 'bg-emerald-50 text-emerald-600',
            trendColor: 'text-emerald-500',
            chartColor: 'emerald'
          },
          { 
            title: 'Failed Scrapes', 
            value: stats.failed, 
            trend: '+ 2.4%', 
            icon: AlertCircle, 
            color: 'bg-rose-50 text-rose-600',
            trendColor: 'text-rose-500',
            chartColor: 'rose'
          }
        ].map((item, idx) => (
          <Card key={idx} className="p-6 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl transition-colors", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-gray-500">{item.title}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-3xl font-bold text-gray-900 leading-none">{item.value}</h3>
                  <div className={cn("flex items-center text-xs font-bold px-1.5 py-0.5 rounded-full bg-opacity-10", item.trendColor.replace('text-', 'bg-'), item.trendColor)}>
                    {item.trend.startsWith('+') ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {item.trend}
                  </div>
                </div>
              </div>
              {/* Subtle sparkline-like SVG */}
              <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30">
                <svg viewBox="0 0 100 40" className={cn("w-full h-full stroke-current fill-none", `text-${item.chartColor}-400`)}>
                  <path d="M0,35 Q20,30 40,20 T80,10 T100,5" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>



      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search & Tool Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="relative max-w-md w-full group">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder="Search job title, company, skills..." 
                  className="pl-11 h-11 bg-white border-none shadow-sm shadow-gray-200/50 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                />
            </div>
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Showing</span>
                    <span className="text-gray-900 font-bold">{jobs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>
                    <span className="text-gray-500 font-medium">-</span>
                    <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                    <span className="text-gray-500 font-medium">of</span>
                    <span className="text-gray-900 font-bold">{totalCount}</span>
                    <span className="text-gray-500 font-medium">Jobs</span>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                      className="h-9 px-2 rounded-lg border-gray-200 bg-white text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Table Container */}
        <Card className="border-none shadow-sm shadow-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-gray-400 animate-pulse font-medium">Loading jobs queue...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/40 border-b border-indigo-50">
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Job Title</th>
                    {/* <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Description</th> */}
                    {/* <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Experience</th> */}
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Posted</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Validity</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {jobs.map((job) => {
                    const refDate = new Date(job.date_posted || job.created_at || new Date());
                    const diffTime = Math.abs(new Date().getTime() - refDate.getTime());
                    const daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const isExpired = daysOld >= 15;

                    return (
                    <tr key={job.id} className="hover:bg-indigo-50/20 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-1">
                            <span className="text-[13px] font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors cursor-pointer">
                                {job.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 text-indigo-500 border-indigo-100 font-bold">
                                {job.job_type || 'Full Time'}
                              </Badge>
                              <span className="text-[11px] font-medium text-gray-400 capitalize">{job.companies?.name || 'Unknown Company'}</span>
                            </div>
                        </div>
                      </td>
                      {/* <td className="px-6 py-5">
                        <div className="max-w-[200px]">
                          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 whitespace-pre-wrap font-medium">
                            {job.description}
                          </p>
                        </div>
                      </td> */}
                      {/* <td className="px-6 py-5">
                         <span className="text-[12px] font-bold text-gray-700">{job.experience_level || '2 - 4 Years'}</span>
                      </td> */}
                      <td className="px-6 py-5">
                         <span className="text-[11px] font-semibold text-gray-500">{job.date_posted || 'Recently'}</span>
                      </td>
                      {/* <td className="px-6 py-5">
                         <span className="text-[12px] font-extrabold text-gray-900">₹ {job.salary_range || '8 - 12 LPA'}</span>
                      </td> */}
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-1.5 text-gray-500">
                           <MapPin className="h-3 w-3" />
                           <span className="text-[12px] font-medium">{job.location}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <Badge className={cn(
                           "font-bold text-[9px] px-2 py-0.5 shadow-none ring-1",
                           job.is_approved 
                             ? "bg-emerald-50 text-emerald-600 ring-emerald-100" 
                             : "bg-orange-50 text-orange-600 ring-orange-100"
                         )}>
                           {job.is_approved ? 'Approved' : 'Pending'}
                         </Badge>
                      </td>
                      <td className="px-6 py-5">
                         <Badge className={cn(
                           "font-bold text-[9px] px-2 py-0.5 shadow-none ring-1",
                           isExpired
                             ? "bg-rose-50 text-rose-600 ring-rose-100" 
                             : "bg-emerald-50 text-emerald-600 ring-emerald-100"
                         )}>
                           {isExpired ? 'Expired' : 'Valid'}
                         </Badge>
                      </td>
                      <td className="px-6 py-5 text-right relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => setOpenDropdownId(openDropdownId === job.id ? null : job.id)}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                        
                        <AnimatePresence>
                          {openDropdownId === job.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-12 top-10 z-50 w-48 bg-white rounded-xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-2 flex flex-col gap-1"
                              >
                                {job.is_approved ? (
                                  <button 
                                    className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    onClick={() => { handleStatusUpdate(job.id, false); setOpenDropdownId(null); }}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Mark as Pending
                                  </button>
                                ) : (
                                  <button 
                                    className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    onClick={() => { handleStatusUpdate(job.id, true); setOpenDropdownId(null); }}
                                  >
                                    <Check className="h-4 w-4 mr-2" /> Approve Job
                                  </button>
                                )}
                                <button 
                                  className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  onClick={() => { setViewingJob(job); setOpenDropdownId(null); }}
                                >
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </button>
                                <button 
                                  className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                  onClick={() => { window.open(job.source_url, '_blank'); setOpenDropdownId(null); }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" /> View Original Link
                                </button>
                                <Link href={`/admin/jobs/${job.id}/edit`} onClick={() => setOpenDropdownId(null)}>
                                  <button className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                    <Pencil className="h-4 w-4 mr-2" /> Edit Job
                                  </button>
                                </Link>
                                <div className="h-px bg-gray-100 my-1" />
                                <button 
                                  className="flex items-center w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  onClick={() => { handleDeleteJob(job.id); setOpenDropdownId(null); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Job
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!loading && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No jobs found</h3>
              <p className="text-sm text-gray-500 max-w-xs">We couldn't find any jobs matching your search criteria. Try a different keyword.</p>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-white">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Simple pagination logic to show current page and around it
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum + 2 > totalPages) pageNum = totalPages - 4 + i;
                    }

                    if (pageNum <= 0 || pageNum > totalPages) return null;

                    return (
                      <button 
                          key={pageNum} 
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className={cn(
                            "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                            pageNum === currentPage 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                              : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                          )}
                      >
                          {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-300 px-1 text-xs font-bold">...</span>
                      <button 
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={loading}
                        className={cn(
                          "w-9 h-9 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all",
                          currentPage === totalPages && "bg-indigo-600 text-white"
                        )}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 border-gray-100 text-indigo-600 font-bold hover:bg-indigo-50 disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || loading}
              >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
          </div>
        </Card>
      </div>

      {/* Viewing Modal */}
      <AnimatePresence>
        {viewingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{viewingJob.title}</h3>
                    <p className="text-sm font-semibold text-indigo-600">{viewingJob.companies?.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewingJob(null)} className="rounded-full hover:bg-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</span>
                    <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      {viewingJob.location}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job Type</span>
                    <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      {viewingJob.job_type || 'Full Time'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Experience</span>
                    <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <Zap className="h-4 w-4 text-indigo-500" />
                      {viewingJob.experience_level || 'Not Specified'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salary Range</span>
                    <div className="flex items-center gap-2 text-gray-900 font-extrabold">
                      {viewingJob.salary_range || 'Competitive'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enhanced Description</span>
                  <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {viewingJob.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <div className="text-[11px] text-gray-400 font-medium">
                  Added on {new Date(viewingJob.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => window.open(viewingJob.source_url, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" /> View Source
                  </Button>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => {
                    router.push(`/admin/jobs/${viewingJob.id}/edit`);
                    setViewingJob(null);
                  }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Post
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



