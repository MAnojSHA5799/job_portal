"use client";

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter, 
  ChevronDown, 
  Star, 
  Clock, 
  DollarSign,
  Grid,
  List,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  title: string;
  location: string;
  salary_range: string;
  job_type: string;
  category: string;
  created_at: string;
  apply_link: string;
  companies: {
    name: string;
    logo_url: string;
  };
}

const filterCategories = [
  { id: 'category', name: 'Category', options: ['Engineering', 'Design', 'Marketing', 'Product Manager', 'Sales', 'Data Science'] },
  { id: 'job_type', name: 'Job Type', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'] },
];

export default function JobListingPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    category: [],
    job_type: [],
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name,
            logo_url
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
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

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedFilters]);

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
            <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter">Browse Jobs</h1>
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row items-center gap-2 max-w-4xl">
              <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Job title, keywords, or company" 
                    className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="hidden md:block w-[1px] h-6 bg-gray-100 mx-2"></div>
              <div className="relative flex-1 w-full">
                  <MapPin className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Location or remote" 
                    className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0" 
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
              </div>
              <Button type="submit" className="h-11 w-full md:w-auto px-8 font-bold rounded-xl">
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
                <h3 className="font-black text-gray-900 flex items-center">
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
                    Showing <span className="font-black text-gray-900">{jobs.length}</span> jobs matching your criteria
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
                            <List className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No jobs found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className={`p-6 border-0 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden bg-white ${viewMode === 'list' ? 'flex flex-col md:flex-row md:items-center justify-between gap-6' : ''}`}>
                      <div className="flex items-start gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0 overflow-hidden">
                              {job.companies?.logo_url ? (
                                <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-cover" />
                              ) : (
                                job.companies?.name?.charAt(0) || 'J'
                              )}
                          </div>
                          <div className="space-y-2">
                             <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg md:text-xl font-black text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                                    {job.title}
                                </h3>
                                {new Date(job.created_at) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) && (
                                  <Badge variant="success" className="h-5 text-[10px]">NEW</Badge>
                                )}
                             </div>
                             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                                <span className="flex items-center gap-1.5">
                                   <Briefcase className="w-4 h-4" /> {job.companies?.name}
                                </span>
                                <span className="flex items-center gap-1.5">
                                   <MapPin className="w-4 h-4" /> {job.location}
                                </span>
                                {job.salary_range && (
                                  <span className="flex items-center gap-1.5 text-primary">
                                     <Star className="w-4 h-4 fill-primary" /> {job.salary_range}
                                  </span>
                                )}
                             </div>
                             <div className="flex flex-wrap gap-2 pt-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                   {job.category}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                   {job.job_type}
                                </span>
                             </div>
                          </div>
                      </div>

                      <div className={`flex items-center justify-between gap-6 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50 ${viewMode === 'list' ? 'md:flex-col md:items-end md:justify-center' : ''}`}>
                          <div className="flex flex-col md:items-end gap-1">
                              <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] font-black text-secondary tracking-widest uppercase">Verified Employer</span>
                          </div>
                          <a href={job.apply_link} target="_blank" rel="noopener noreferrer">
                            <Button className="font-bold shadow-md shadow-primary/10 px-8 rounded-xl h-10 group-hover:bg-primary/90 transition-all">
                                Apply Now
                            </Button>
                          </a>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && jobs.length > 0 && (
              <div className="pt-12 text-center">
                  <Button variant="outline" size="lg" className="font-bold border-2 rounded-xl px-12 hover:border-primary hover:text-primary transition-all">
                      Load More Positions
                  </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



