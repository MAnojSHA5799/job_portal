"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Building2,
  X
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
  description?: string;
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
  { id: 'experience_level', name: 'Experience Level', options: ['Fresher', '1-3 Years', '3-5 Years', '5+ Years', '5 to 8 years', '8 to 10', '10 to 15', '16+'] },
];

import { ApplyButton } from '@/components/ApplyButton';

function JobListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('job_type') || '');
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get('experience_level') || '');
  const [selectedSkills, setSelectedSkills] = useState(searchParams.get('skills') || '');
  const [selectedSalary, setSelectedSalary] = useState(searchParams.get('salary') || '');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_salary' | 'relevant'>('newest');

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Suggestions state
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);

  const fetchCompanyNames = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .order('name');

      if (error) throw error;
      if (data) {
        const uniqueNames = Array.from(new Set(data.map(c => c.name).filter(Boolean)));
        setCompanySuggestions(uniqueNames as string[]);
      }
    } catch (error) {
      console.error('Error fetching company names:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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

      if (error) {
        console.error('Supabase Query Error:', error);
        throw error;
      }

      const fetchedJobs = (data as any) || [];
      setJobs(fetchedJobs);

      // Process Category Counts dynamically
      const counts: Record<string, number> = {};
      fetchedJobs.forEach((job: any) => {
        if (job.category) {
          counts[job.category] = (counts[job.category] || 0) + 1;
        }
      });
      setCategoryCounts(counts);

      // Extract unique locations for suggestions
      const uniqueLocations = Array.from(new Set(fetchedJobs.map((j: any) => j.location).filter(Boolean)));
      setLocationSuggestions(uniqueLocations as string[]);

    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseSalary = (salaryStr: string): number => {
    if (!salaryStr) return 0;
    let clean = salaryStr.toLowerCase().replace(/,/g, '');

    const lakhMatch = clean.match(/(\d+(\.\d+)?)\s*(l|lac|lakh)/);
    if (lakhMatch) {
      return parseFloat(lakhMatch[1]) * 100000;
    }

    const kMatch = clean.match(/(\d+(\.\d+)?)\s*(k|thousand)/);
    if (kMatch) {
      return parseFloat(kMatch[1]) * 1000;
    }

    const plainMatch = clean.match(/\d+/);
    if (plainMatch) {
      return parseInt(plainMatch[0], 10);
    }

    return 0;
  };

  useEffect(() => {
    fetchCompanyNames();
    fetchJobs();
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setLocationQuery(searchParams.get('location') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedType(searchParams.get('job_type') || '');
    setSelectedExperience(searchParams.get('experience_level') || '');
    setSelectedSkills(searchParams.get('skills') || '');
    setSelectedSalary(searchParams.get('salary') || '');
    setSelectedLanguage(searchParams.get('language') || '');
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationQuery, selectedCategory, selectedType, selectedExperience, selectedSalary, selectedSkills, selectedLanguage]);

  // Real-time frontend filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const companyName = job.companies?.name || '';
      const matchesSearch = !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.category && job.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLocation = !locationQuery ||
        (job.location && job.location.toLowerCase().includes(locationQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || job.category === selectedCategory;

      const matchesExperience = !selectedExperience || (() => {
        const expStr = (job.experience_level || '').toLowerCase();
        if (expStr === selectedExperience.toLowerCase()) return true;

        const nums = expStr.match(/\d+(\.\d+)?/g);
        let minExp = -1;

        if (nums && nums.length > 0) {
          minExp = parseFloat(nums[0]);
        } else {
          if (selectedExperience === 'Fresher') return expStr.includes('fresher') || expStr.includes('entry') || expStr.includes('intern');
          if (selectedExperience === '1-3 Years') return expStr.includes('junior') || expStr.includes('associate');
          if (selectedExperience === '3-5 Years') return expStr.includes('mid');
          if (selectedExperience === '5+ Years') return expStr.includes('senior') || expStr.includes('lead');
          return false;
        }

        if (selectedExperience === 'Fresher') return minExp === 0;
        if (selectedExperience === '1-3 Years') return minExp >= 1 && minExp <= 3;
        if (selectedExperience === '3-5 Years') return minExp >= 3 && minExp <= 5;
        if (selectedExperience === '5+ Years') return minExp >= 5;

        return false;
      })();

      const matchesType = !selectedType || job.job_type === selectedType;

      const matchesSalary = !selectedSalary || (() => {
        const minRequired = parseInt(selectedSalary, 10);
        const clean = (job.salary_range || '').toLowerCase().replace(/,/g, '');

        const lakhs = clean.match(/(\d+(\.\d+)?)\s*(l|lac|lakh)/g);
        if (lakhs) {
          const vals = lakhs.map(l => {
            const num = l.match(/\d+(\.\d+)?/);
            return num ? parseFloat(num[0]) * 100000 : 0;
          });
          return Math.max(...vals) >= minRequired;
        }

        const ks = clean.match(/(\d+(\.\d+)?)\s*(k|thousand)/g);
        if (ks) {
          const vals = ks.map(k => {
            const num = k.match(/\d+(\.\d+)?/);
            return num ? parseFloat(num[0]) * 1000 : 0;
          });
          return Math.max(...vals) >= minRequired;
        }

        const nums = clean.match(/\d+/g);
        if (nums) {
          const vals = nums.map(n => parseInt(n, 10));
          return Math.max(...vals) >= minRequired;
        }
        return false;
      })();

      const matchesSkills = !selectedSkills ||
        (job.description && job.description.toLowerCase().includes(selectedSkills.toLowerCase())) ||
        (job.title && job.title.toLowerCase().includes(selectedSkills.toLowerCase()));

      const matchesLanguage = !selectedLanguage ||
        (job.description && job.description.toLowerCase().includes(selectedLanguage.toLowerCase()));

      return matchesSearch && matchesLocation && matchesCategory && matchesExperience && matchesType && matchesSalary && matchesSkills && matchesLanguage;
    });
  }, [jobs, searchQuery, locationQuery, selectedCategory, selectedExperience, selectedType, selectedSalary, selectedSkills, selectedLanguage]);

  // Real-time sorting
  const sortedJobs = useMemo(() => {
    const jobsCopy = [...filteredJobs];
    if (sortBy === 'newest') {
      return jobsCopy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'highest_salary') {
      return jobsCopy.sort((a, b) => parseSalary(b.salary_range) - parseSalary(a.salary_range));
    } else if (sortBy === 'relevant') {
      if (!searchQuery) return jobsCopy;
      return jobsCopy.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0;
        const bTitleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0;
        const aDescMatch = a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
        const bDescMatch = b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
        return (bTitleMatch + bDescMatch) - (aTitleMatch + aDescMatch);
      });
    }
    return jobsCopy;
  }, [filteredJobs, sortBy, searchQuery]);

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const currentJobs = sortedJobs.slice(indexOfFirstJob, indexOfLastJob);

  const handleDropdownChange = (name: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`/jobs?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedType) params.set('job_type', selectedType);
    if (selectedExperience) params.set('experience_level', selectedExperience);
    router.push(`/jobs?${params.toString()}`);
  };

  const renderFiltersContent = () => (
    <div className="space-y-7 pb-6">
      {/* Clear all header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" /> Filter Jobs
        </h2>
        {(selectedCategory || selectedExperience || selectedType || selectedSalary || selectedSkills || selectedLanguage || searchQuery || locationQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedExperience('');
              setSelectedType('');
              setSelectedSalary('');
              setSelectedSkills('');
              setSelectedLanguage('');
              setSearchQuery('');
              setLocationQuery('');
              router.push('/jobs');
            }}
            className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Section */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Category
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('');
              handleDropdownChange('category', '');
            }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group",
              !selectedCategory
                ? "bg-primary/10 text-primary"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span>All Categories</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              !selectedCategory ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
            )}>{jobs.length}</span>
          </button>
          {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  handleDropdownChange('category', cat);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="truncate pr-2">{cat}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                  isSelected ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                )}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Type Section */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-500" /> Job Type
        </h3>
        <div className="space-y-1">
          {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => {
                  const newVal = isSelected ? '' : type;
                  setSelectedType(newVal);
                  handleDropdownChange('job_type', newVal);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 border border-transparent",
                  isSelected
                    ? "bg-emerald-50/60 text-emerald-700 border-emerald-100/50"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                  isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 bg-white"
                )}>
                  {isSelected && <span className="text-[10px] leading-none font-bold">✓</span>}
                </div>
                <span>{type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-amber-500" /> Experience
        </h3>
        <div className="space-y-1">
          {['Fresher', '1-3 Years', '3-5 Years', '5+ Years'].map((exp) => {
            const isSelected = selectedExperience === exp;
            return (
              <button
                key={exp}
                onClick={() => {
                  const newVal = isSelected ? '' : exp;
                  setSelectedExperience(newVal);
                  handleDropdownChange('experience_level', newVal);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 border border-transparent",
                  isSelected
                    ? "bg-amber-50/60 text-amber-700 border-amber-100/50"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  isSelected ? "border-amber-500 bg-amber-500" : "border-gray-300 bg-white"
                )}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span>{exp}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Min Salary */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Banknote className="w-3.5 h-3.5 text-rose-500" /> Min Salary
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '₹10k+', value: '10000' },
            { label: '₹25k+', value: '25000' },
            { label: '₹50k+', value: '50000' },
            { label: '₹1L+', value: '100000' }
          ].map((sal) => {
            const isSelected = selectedSalary === sal.value;
            return (
              <button
                key={sal.value}
                onClick={() => {
                  setSelectedSalary(isSelected ? '' : sal.value);
                }}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center",
                  isSelected
                    ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "border-gray-200 text-gray-600 hover:border-rose-300 hover:bg-rose-50/20 hover:text-rose-600"
                )}
              >
                {sal.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-violet-500" /> Skills
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'React', value: 'React' },
            { label: 'Node', value: 'Node' },
            { label: 'Python', value: 'Python' },
            { label: 'Sales', value: 'Sales' },
            { label: 'Marketing', value: 'Marketing' },
            { label: 'Design', value: 'Design' },
            { label: 'Production', value: 'Production' },
            { label: 'Quality', value: 'Quality' },
            { label: 'Maintenance', value: 'Maintenance' }
          ].map((skill) => {
            const isSelected = selectedSkills === skill.value;
            return (
              <button
                key={skill.value}
                onClick={() => {
                  setSelectedSkills(isSelected ? '' : skill.value);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                  isSelected
                    ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-600/10"
                    : "border-gray-200 text-gray-600 hover:border-violet-300 hover:bg-violet-50/20 hover:text-violet-600 bg-white"
                )}
              >
                {skill.label}
              </button>
            );
          })}
        </div>
      </div>



      {/* Clear all bottom button */}
      {(selectedCategory || selectedExperience || selectedType || selectedSalary || selectedSkills || selectedLanguage || searchQuery || locationQuery) && (
        <button
          onClick={() => {
            setSelectedCategory('');
            setSelectedExperience('');
            setSelectedType('');
            setSelectedSalary('');
            setSelectedSkills('');
            setSelectedLanguage('');
            setSearchQuery('');
            setLocationQuery('');
            router.push('/jobs');
          }}
          className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-center flex items-center justify-center gap-1.5"
        >
          <span>Clear All Filters</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 tracking-tight">Browse Jobs</h1>
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/30 border border-gray-100 flex flex-col md:flex-row items-center gap-2 max-w-5xl mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Job title, keywords, or company"
                className="border-0 shadow-none pl-12 h-12 focus-visible:ring-0 text-sm font-semibold"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowCompanySuggestions(true);
                }}
                onFocus={() => setShowCompanySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
              />
              <AnimatePresence>
                {showCompanySuggestions && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden"
                  >
                    {companySuggestions
                      .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((name, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSearchQuery(name);
                            setShowCompanySuggestions(false);
                            handleDropdownChange('q', name);
                          }}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 text-sm font-bold text-gray-600 hover:text-primary transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-primary/10">
                            <Building2 className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                          </div>
                          {name}
                        </button>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="hidden md:block w-[1px] h-8 bg-gray-100 mx-2"></div>
            <div className="relative flex-1 w-full">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Location (e.g. Noida)"
                className="border-0 shadow-none pl-12 h-12 focus-visible:ring-0 text-sm font-semibold"
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
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden"
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
                            handleDropdownChange('location', loc);
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
            <button type="submit" className="h-12 w-full md:w-auto px-10 font-bold text-sm rounded-xl bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20 transition-all">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
            {renderFiltersContent()}
          </aside>

          {/* Main Listings Column */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="sr-only">Job Listings</h2>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="font-black text-gray-900">{Math.min((currentPage - 1) * itemsPerPage + 1, sortedJobs.length)}-{Math.min(currentPage * itemsPerPage, sortedJobs.length)}</span> of <span className="font-black text-gray-900">{sortedJobs.length}</span> jobs
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile Filters Button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold text-xs hover:border-primary/30 active:scale-95 transition-all shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>Filters</span>
                  {Object.values({ selectedCategory, selectedExperience, selectedType, selectedSalary, selectedSkills, selectedLanguage }).filter(Boolean).length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border-0 bg-transparent font-bold text-gray-900 focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest_salary">Highest Salary</option>
                  <option value="relevant">Relevant First</option>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
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
              <div className={viewMode === 'list' ? 'space-y-4 w-full' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                <AnimatePresence mode='popLayout'>
                  {currentJobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <Link href={`/jobs/${job.url_slug || job.id}`} target="_blank">
                        <Card className="p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white relative group cursor-pointer h-full flex flex-col justify-between">
                          <div>
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
                                  <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                    {job.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{job.companies?.name}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 mt-4">
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
                          className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all ${currentPage === page
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

      {/* Mobile Drawer (AnimatePresence) */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-full max-w-[280px] bg-white z-50 p-6 flex flex-col h-full shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" /> Filters
                </h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-gray-400 hover:text-gray-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
                {renderFiltersContent()}
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all text-center uppercase tracking-wider"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JobListingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <JobListingContent />
    </Suspense>
  );
}
