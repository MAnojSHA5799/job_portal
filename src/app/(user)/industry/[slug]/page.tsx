"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import {
  ArrowLeft,
  MapPin,
  Banknote,
  Briefcase,
  Clock,
  Zap,
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  url_slug: string;
  location: string;
  salary_range: string;
  job_type: string;
  category: string;
  created_at: string;
  experience_level?: string;
  companies: {
    id: string;
    name: string;
    logo_url: string;
    url_slug: string;
    industry: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default function IndustryJobsPage() {
  const params = useParams();
  const slug = decodeURIComponent(params?.slug as string || '');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [industry, setIndustry] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch industry details
      const { data: indData } = await supabase
        .from('industries')
        .select('name, logo_url')
        .ilike('name', slug)
        .single();

      setIndustry(indData || { name: slug, logo_url: null });

      // Fetch jobs where the company's industry matches
      const { data: jobsData } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            url_slug,
            industry
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      // Filter by company industry
      const filtered = (jobsData || []).filter(
        (job: any) => job.companies?.industry?.trim().toLowerCase() === slug.trim().toLowerCase()
      );

      setJobs(filtered);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(
      job =>
        job.title?.toLowerCase().includes(q) ||
        job.companies?.name?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const currentJobs = filteredJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Banner */}
      <div className="bg-white border-b border-gray-100 py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          <div className="flex items-center gap-5 mb-6">
            {/* Industry Icon */}
            <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-white shadow-lg flex items-center justify-center overflow-hidden p-2 shrink-0">
              {industry?.logo_url ? (
                <img src={industry.logo_url} alt={industry.name} className="w-full h-full object-contain" />
              ) : (
                <Layers className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">Industry</p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                {industry?.name || slug}
              </h1>
              {!loading && (
                <p className="text-sm text-gray-500 font-semibold mt-0.5">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          </div>

          {/* Search within industry */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-11 pr-4 h-12 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 shadow-sm transition-all"
              placeholder={`Search jobs in ${industry?.name || slug}...`}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Loading jobs...</p>
          </div>
        ) : currentJobs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No jobs found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? 'Try a different search term.' : 'No jobs in this industry yet.'}
            </p>
          </div>
        ) : (
          <>
            {currentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.url_slug || job.id}`} target="_blank">
                <Card className="p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white group cursor-pointer mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden p-1 shrink-0 shadow-sm">
                      {job.companies?.logo_url ? (
                        <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xl bg-indigo-50">
                          {job.companies?.name?.charAt(0) || 'J'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                            {job.title}
                          </h3>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">{job.companies?.name}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-400 font-bold">{formatDate(job.created_at)}</span>
                          <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                        {job.location && (
                          <span className="flex items-center gap-1 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="flex items-center gap-1 font-semibold">
                            <Banknote className="w-3.5 h-3.5 text-gray-400" /> {job.salary_range}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.job_type && (
                          <span className="flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md text-[11px] font-bold text-indigo-600 border border-indigo-100/50">
                            <Clock className="w-3 h-3" /> {job.job_type}
                          </span>
                        )}
                        {job.category && (
                          <span className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-600 border border-emerald-100/50">
                            <Zap className="w-3 h-3" /> {job.category}
                          </span>
                        )}
                        {job.experience_level && (
                          <span className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-600 border border-amber-100/50">
                            <Briefcase className="w-3 h-3" /> {job.experience_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all bg-white shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-9 h-9 rounded-xl text-xs font-bold transition-all',
                        page === currentPage
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-gray-500 hover:bg-gray-100 border border-gray-200 bg-white'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all bg-white shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
