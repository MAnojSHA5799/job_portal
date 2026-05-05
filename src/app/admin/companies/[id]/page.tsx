"use client";

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Building2, 
  Briefcase, 
  MapPin, 
  Calendar,
  ChevronLeft,
  Search,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Eye,
  Star,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  experience_level: string;
  apply_link: string;
  source_url: string;
  is_approved: boolean;
  date_posted: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  career_page_url?: string;
}

export default function CompanyJobsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingJob, setViewingJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, [resolvedParams.id]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      // Fetch Company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();
      
      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch Jobs for Company
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching company details');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const approvedCount = jobs.filter(j => j.is_approved).length;
  const pendingCount = jobs.length - approvedCount;

  return (
    <div className="space-y-8 p-6 bg-gray-50/30 min-h-screen">
      {/* Header Section */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-4 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 font-bold -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {company?.name || 'Loading Company...'}
              </h1>
              <p className="text-gray-500 mt-1 text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Company Jobs Overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               className="h-12 px-6 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700 shadow-sm"
               onClick={() => router.push(`/admin/companies/${resolvedParams.id}/edit`)}
             >
                <Edit3 className="w-4 h-4 mr-2 text-indigo-500" /> Edit Profile
             </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 transition-colors">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500">Total Scraped Jobs</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-gray-900 leading-none">{jobs.length}</h3>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 transition-colors">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500">Approved Jobs</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-gray-900 leading-none">{approvedCount}</h3>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 transition-colors">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500">Pending Review</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-gray-900 leading-none">{pendingCount}</h3>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="relative max-w-md w-full group">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder="Search jobs by title or location..." 
                  className="pl-11 h-11 bg-white border-none shadow-sm shadow-gray-200/50 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* Table Container */}
        <Card className="border-none shadow-sm shadow-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-gray-400 animate-pulse font-medium">Loading company jobs...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/40 border-b border-indigo-50">
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Job Title</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Posted / Validity</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredJobs.map((job) => {
                    const refDate = new Date(job.date_posted || job.created_at || new Date());
                    const diffTime = Math.abs(new Date().getTime() - refDate.getTime());
                    const daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const isExpired = daysOld >= 15;

                    return (
                      <tr key={job.id} className="hover:bg-indigo-50/20 transition-all group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col space-y-1">
                              <span className="text-[13px] font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {job.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge className="text-[9px] px-1.5 py-0 bg-indigo-50 text-indigo-500 border-indigo-100 font-bold">
                                  {job.job_type || 'Full Time'}
                                </Badge>
                                <span className="text-[11px] font-medium text-gray-400 capitalize">{job.experience_level || 'Any Exp'}</span>
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-1.5 text-gray-500">
                             <MapPin className="h-3 w-3" />
                             <span className="text-[12px] font-medium">{job.location}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col gap-1">
                             <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {job.date_posted || 'Recently'}
                             </span>
                             <div>
                                <Badge className={cn(
                                "font-bold text-[9px] px-2 py-0.5 shadow-none ring-1 w-fit",
                                isExpired
                                    ? "bg-rose-50 text-rose-600 ring-rose-100" 
                                    : "bg-emerald-50 text-emerald-600 ring-emerald-100"
                                )}>
                                {isExpired ? 'Expired' : 'Valid'}
                                </Badge>
                             </div>
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
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => setViewingJob(job)}
                                title="Preview Job"
                             >
                                <Eye className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}
                                title="Edit & SEO Enhance"
                             >
                                <Edit3 className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 ml-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors rounded-xl"
                                onClick={() => window.open(job.apply_link || job.source_url, '_blank')}
                             >
                                <ExternalLink className="w-3 h-3 mr-1.5" /> Source
                             </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-full bg-gray-50 mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No jobs found</h3>
              <p className="text-sm text-gray-500 max-w-xs">There are no scraped jobs available for this company.</p>
            </div>
          )}
        </Card>
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
                          {(company?.name || 'J').charAt(0).toUpperCase()}
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
                          {company?.name || 'Top Company'}
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
                          Edit Job <Edit3 className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
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
