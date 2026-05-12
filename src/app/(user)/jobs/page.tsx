"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter, 
  ChevronDown, 
  Star, 
  Clock, 
  Banknote,
  Bike,
  Languages,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  LayoutGrid,
  LayoutList,
  ArrowRight,
  Loader2,
  Zap,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  title: string;
  url_slug: string;
  location: string;
  salary_range: string;
  job_type: string;
  category: string;
  created_at: string;
  apply_link: string;
  experience_level?: string;
  featured?: boolean;
  tags?: string[];
  companies: {
    id: string;
    name: string;
    logo_url: string;
    url_slug: string;
  };
}

const defaultFilters = [
  { id: 'category', name: 'Category', options: ['Production', 'Quality', 'Maintenance', 'Store', 'HR', 'Accountant'] },
  { id: 'job_type', name: 'Job Type', options: ['Full-time', 'Part-time', 'Contract', 'Remote'] },
];

import { ApplyButton } from '@/components/ApplyButton';

export default function JobListingPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filterCategories, setFilterCategories] = useState(defaultFilters);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    category: [],
    job_type: [],
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Suggestions state
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            url_slug
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      if (locationQuery) {
        query = query.ilike('location', `%${locationQuery}%`);
      }

      // Apply category filters
      if (selectedFilters.category.length > 0) {
        query = query.in('category', selectedFilters.category);
      }

      // Apply job type filters
      if (selectedFilters.job_type.length > 0) {
        query = query.in('job_type', selectedFilters.job_type);
      }

      console.log('Fetching jobs with filters:', selectedFilters, 'Search:', searchQuery, 'Location:', locationQuery);
      const { data, error } = await query;

      if (error) {
        console.error('Supabase Query Error:', error);
        throw error;
      }
      
      const fetchedJobs = (data as any) || [];
      console.log('Fetched Jobs Count:', fetchedJobs.length);
      console.log('Fetched Jobs Data (first 2):', fetchedJobs.slice(0, 2));
      
      setJobs(fetchedJobs);
      setCurrentPage(1); // Reset to page 1 on new search/filter

      // Dynamically update filter options based on what's available in DB
      if (fetchedJobs.length > 0) {
        const uniqueCategories = Array.from(new Set(fetchedJobs.map((j: any) => j.category).filter(Boolean)));
        const uniqueJobTypes = Array.from(new Set(fetchedJobs.map((j: any) => j.job_type).filter(Boolean)));
        const uniqueLocations = Array.from(new Set(fetchedJobs.map((j: any) => j.location).filter(Boolean)));
        
        setFilterCategories([
          { id: 'category', name: 'Category', options: uniqueCategories as string[] },
          { id: 'job_type', name: 'Job Type', options: uniqueJobTypes as string[] },
        ]);
        setLocationSuggestions(uniqueLocations as string[]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, locationQuery, selectedFilters]);

  // Pagination calculations
  const filteredJobs = jobs; // Filtered by Supabase query
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const handleFilterChange = (categoryId: string, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[categoryId] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      return { ...prev, [categoryId]: updated };
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 tracking-tight">Browse Jobs</h1>
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col md:flex-row items-center gap-2 max-w-5xl">
              <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Job title, keywords, or company" 
                    className="border-0 shadow-none pl-12 h-12 focus-visible:ring-0 text-sm font-medium" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="hidden md:block w-[1px] h-8 bg-gray-100 mx-2"></div>
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                    placeholder="Location (e.g. Noida)" 
                    className="border-0 shadow-none pl-12 h-12 focus-visible:ring-0 text-sm font-medium"
                    value={locationQuery}
                    onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                />
                <AnimatePresence>
                    {showLocationSuggestions && locationQuery && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden"
                        >
                            {locationSuggestions
                                .filter(loc => loc.toLowerCase().includes(locationQuery.toLowerCase()))
                                .slice(0, 5)
                                .map((loc, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setLocationQuery(loc);
                                            setShowLocationSuggestions(false);
                                        }}
                                        className="w-full px-6 py-4 text-left hover:bg-gray-50 text-sm font-bold text-gray-600 hover:text-primary transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10">
                                            <MapPin className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                                        </div>
                                        {loc}
                                    </button>
                                ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
              <Button type="submit" className="h-12 w-full md:w-auto px-10 font-black text-xs uppercase tracking-widest rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                  Filter Matches
              </Button>
            </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-8 shrink-0">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center">
                    <Filter className="w-4 h-4 mr-2" /> Filters
                </h3>
                <button 
                  onClick={() => setSelectedFilters({ category: [], job_type: [] })}
                  className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Reset All
                </button>
            </div>

            {filterCategories.map((filter, i) => (
                <div key={i} className="space-y-4 border-b border-gray-100 pb-6">
                    <button className="flex items-center justify-between w-full text-sm font-bold text-gray-900 group">
                        {filter.name}
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="space-y-3">
                        {filter.options.map((opt, j) => (
                            <label key={j} className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary/20 accent-primary" 
                                  checked={(selectedFilters[filter.id] || []).includes(opt)}
                                  onChange={() => handleFilterChange(filter.id, opt)}
                                />
                                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
          </aside>

          
          {/* Job List */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="text-sm text-gray-500 font-medium">
                    Showing <span className="font-black text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredJobs.length)}-{Math.min(currentPage * itemsPerPage, filteredJobs.length)}</span> of <span className="font-black text-gray-900">{filteredJobs.length}</span> jobs
                </div>
                <div className="flex items-center gap-4">
                    <select className="text-sm border-0 bg-transparent font-bold text-gray-900 focus:ring-0 outline-none cursor-pointer">
                        <option>Newest First</option>
                        <option>Highest Salary</option>
                        <option>Relevant First</option>
                    </select>
                    <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <LayoutList className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-40 rounded-3xl bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : currentJobs.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No jobs found</h3>
                  <p className="text-gray-500 mt-2">Try adjusting your filters or search keywords.</p>
              </div>
            ) : (
              <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
                <AnimatePresence mode='popLayout'>
                  {currentJobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Link href={`/jobs/${job.url_slug || job.id}`}>
                        <Card className="p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white relative group cursor-pointer">
                          <div className="flex items-start justify-between mb-4">
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
                              <div>
                                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                      {job.title}
                                  </h3>
                                  <p className="text-sm text-gray-500 font-semibold">{job.companies?.name}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-[#006d5b] shrink-0" />
                          </div>

                          <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-gray-500">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-semibold">{job.location || 'India'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                  <Banknote className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-semibold">{job.salary_range || 'Not disclosed'}</span>
                              </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                             {job.job_type && (
                               <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-indigo-600 border border-indigo-100/50">
                                   <Clock className="w-3.5 h-3.5" /> {job.job_type}
                               </div>
                             )}
                             {job.category && (
                               <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-emerald-600 border border-emerald-100/50">
                                   <Zap className="w-3.5 h-3.5" /> {job.category}
                               </div>
                             )}
                             {job.experience_level && (
                               <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-amber-600 border border-amber-100/50">
                                   <Briefcase className="w-3.5 h-3.5" /> {job.experience_level}
                               </div>
                             )}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination UI */}
            {!loading && totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2 pb-10">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(prev => prev - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-30 shadow-sm h-10 w-10"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            if (
                                page === 1 || 
                                page === totalPages || 
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => {
                                          setCurrentPage(page);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all ${
                                            currentPage === page 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 2 || 
                                page === currentPage + 2
                            ) {
                                return <span key={page} className="text-gray-300 px-1 font-bold">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(prev => prev + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-30 shadow-sm h-10 w-10"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



