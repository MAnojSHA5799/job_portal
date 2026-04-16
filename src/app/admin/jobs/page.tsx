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
  created_at: string;
  companies: {
    name: string;
  };
}

export default function JobsQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    is_approved: true
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    failed: 0
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
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
    fetchCompanies();
    fetchStats();
  }, []);

  const handleSaveJob = async () => {
    try {
      setLoading(true);
      if (!currentJob.title || !currentJob.company_id || !currentJob.description || !currentJob.location) {
        alert('Please fill in required fields (Title, Company, Description, Location)');
        return;
      }

      // Cleanup job data (remove joined companies object before save)
      const { companies, ...jobData } = currentJob as any;

      let result;
      if (editingId) {
        result = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('jobs')
          .insert([jobData]);
      }

      if (result.error) throw result.error;

      setIsAdding(false);
      setEditingId(null);
      setCurrentJob({
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
        is_approved: true
      });
      fetchJobs();
      fetchStats();
    } catch (error: any) {
      alert('Error saving job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setCurrentJob({
      title: job.title,
      company_id: job.company_id,
      description: job.description,
      location: job.location,
      salary_range: job.salary_range,
      job_type: job.job_type,
      experience_level: job.experience_level,
      category: job.category,
      apply_link: job.apply_link,
      source_url: job.source_url,
      is_approved: job.is_approved
    });
    setEditingId(job.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentJob({
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
      is_approved: true
    });
  };

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
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Add Job
            </Button>
          )}
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

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-8 border-indigo-100 bg-white shadow-xl shadow-indigo-100/30 ring-1 ring-indigo-50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Job Posting' : 'Post New Job Manually'}</h2>
                  <p className="text-sm text-gray-500">{editingId ? 'Modify the details of this job posting.' : 'Fill in the details below to add a job to the queue.'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancel} className="hover:bg-rose-50 hover:text-rose-500">
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
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Job Description *</label>
                    <textarea 
                      className="flex min-h-[120px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500"
                      placeholder="Detailed job responsibilities and requirements..."
                      value={currentJob.description}
                      onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button variant="ghost" onClick={handleCancel} className="h-11 px-6 font-semibold">Cancel</Button>
                <Button onClick={handleSaveJob} disabled={loading} className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">
                  <Save className="mr-2 h-4 w-4" /> {editingId ? 'Save Changes' : 'Save Job Post'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <span className="text-gray-900 font-bold">{Math.min(jobs.length, 10)}</span>
                    <span className="text-gray-500 font-medium">of</span>
                    <span className="text-gray-900 font-bold">{stats.total}</span>
                    <span className="text-gray-500 font-medium">Jobs</span>
                </div>
                <div className="flex items-center gap-2">
                    <select className="h-9 px-2 rounded-lg border-gray-200 bg-white text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100">
                      <option>10</option>
                      <option>20</option>
                      <option>50</option>
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
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Experience</th>
                    {/* <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Salary</th> */}
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Status</th>
                    {/* <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Added On</th> */}
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {jobs.map((job) => (
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
                      <td className="px-6 py-5">
                         <p className="text-[12px] text-gray-500 leading-relaxed max-w-[180px] line-clamp-2">
                           {job.description}
                         </p>
                      </td>
                      <td className="px-6 py-5">
                         <span className="text-[12px] font-bold text-gray-700">{job.experience_level || '2 - 4 Years'}</span>
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
                      {/* <td className="px-6 py-5">
                         <span className="text-[12px] font-semibold text-gray-400">
                           {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                         </span>
                      </td> */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 transition-opacity">
                            {job.is_approved ? (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => handleStatusUpdate(job.id, false)}
                                title="Mark as Pending"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleStatusUpdate(job.id, true)}
                                title="Approve Job"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => window.open(job.source_url, '_blank')}
                              title="View Original"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => handleEdit(job)}
                              title="Edit Job"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDeleteJob(job.id)}
                                title="Delete Job"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              <Button variant="outline" size="sm" className="h-9 px-4 border-gray-100 text-gray-500 font-bold hover:bg-gray-50">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((page) => (
                      <button 
                          key={page} 
                          className={cn(
                            "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                            page === 1 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                              : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                          )}
                      >
                          {page}
                      </button>
                  ))}
                  <span className="text-gray-300 px-1 text-xs font-bold">...</span>
                  <button className="w-9 h-9 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all">128</button>
              </div>
              <Button variant="outline" size="sm" className="h-9 px-4 border-gray-100 text-indigo-600 font-bold hover:bg-indigo-50">
                  Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}



