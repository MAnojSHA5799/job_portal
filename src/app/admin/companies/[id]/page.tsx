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
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
}

export default function CompanyJobsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                            onClick={() => window.open(job.apply_link || job.source_url, '_blank')}
                          >
                             <ExternalLink className="w-3 h-3 mr-1.5" /> View / Apply
                          </Button>
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
    </div>
  );
}
