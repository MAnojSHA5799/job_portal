"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button, Input, Card, Badge } from '@/components/ui';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Zap, 
  Globe, 
  Laptop, 
  Code, 
  BarChart, 
  Palette, 
  ArrowRight,
  Star,
  Users,
  Folder,
  SlidersHorizontal,
  Coins,
  MessageCircle,
  Hammer,
  Loader2,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterDropdown } from '@/components/FilterDropdown';
import { cn } from '@/lib/utils';

const categories = [
  { icon: Code, name: 'Engineering', count: '1,234 Jobs', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { icon: Palette, name: 'Design', count: '456 Jobs', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { icon: BarChart, name: 'Marketing', count: '323 Jobs', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  { icon: Laptop, name: 'Product', count: '189 Jobs', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { icon: Users, name: 'Sales', count: '276 Jobs', color: 'bg-green-50 text-green-600 border-green-100' },
  // { icon: Globe, name: 'Remote', count: '2,450 Jobs', color: 'bg-teal-50 text-teal-600 border-teal-100' },
];

const BRANDS = [
  { name: 'Google', color: 'hover:text-[#4285F4]' },
  { name: 'Infosys', color: 'hover:text-[#007CC3]' },
  { name: 'Meta', color: 'hover:text-[#0668E1]' },
  { name: 'Apple', color: 'hover:text-[#555555]' },
  { name: 'Stripe', color: 'hover:text-[#635BFF]' },
  { name: 'Microsoft', color: 'hover:text-[#F25022]' },
  { name: 'Amazon', color: 'hover:text-[#FF9900]' },
  { name: 'Netflix', color: 'hover:text-[#E50914]' },
  { name: 'Tesla', color: 'hover:text-[#E82127]' },
  { name: 'IBM', color: 'hover:text-[#052D84]' }
];

const FILTER_OPTIONS = {
  category: ['Engineering', 'Design', 'Marketing', 'Product', 'Sales', 'Customer Support'],
  location: ['Remote', 'USA', 'Germany', 'India', 'UK', 'Canada', 'Singapore'],
  experience: ['Entry Level', 'Intermediate', 'Senior', 'Lead', 'Expert'],
  type: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
  salary: ['$50k+', '$80k+', '$100k+', '$150k+', '$200k+'],
  language: ['English', 'Spanish', 'German', 'Hindi', 'French', 'Japanese'],
  skills: ['React', 'Next.js', 'Python', 'Node.js', 'Figma', 'UI/UX', 'SEO'],
};

// Mock data removed in favor of Supabase fetching

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'Job Category',
    location: 'Your Location',
    experience: 'Experience',
    type: 'Employment Type',
    salary: 'Minimum Salary',
    language: 'Language',
    skills: 'Skills',
  });

  const [user, setUser] = useState<{fullName: string, role: string} | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = (jobTitle: string) => {
    if (!user) {
      alert("First login then apply");
      return;
    }
    alert(`Applied for ${jobTitle} successfully!`);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const companyName = job.companies?.name || '';
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           companyName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filters.category === 'Job Category' || job.category === filters.category;
      const matchesLocation = filters.location === 'Your Location' || job.location === filters.location || (filters.location === 'Remote' && job.location === 'Remote');
      const matchesExperience = filters.experience === 'Experience' || job.experience === filters.experience;
      const matchesType = filters.type === 'Employment Type' || job.type === filters.type;
      const matchesLanguage = filters.language === 'Language' || job.language === filters.language;
      const matchesSkills = filters.skills === 'Skills' || (job.skills && job.skills.includes(filters.skills));

      // Simple salary matching (needs more robust parsing for real apps)
      const matchesSalary = filters.salary === 'Minimum Salary' || true; 

      return matchesSearch && matchesCategory && matchesLocation && matchesExperience && matchesType && matchesLanguage && matchesSkills && matchesSalary;
    });
  }, [searchQuery, filters, jobs]);

  return (
    <div className="pb-12 bg-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary font-bold text-xs mb-8">
                        <Badge variant="info" className="bg-primary text-white border-0">NEW</Badge> 2,568+ new jobs added this week <ArrowRight className="w-3 h-3" />
                    </div>
                    <h1 className="text-6xl md:text-[80px] font-black text-gray-900 tracking-tighter leading-[0.9] mb-8">
                        Find Your<br />
                        <span className="text-primary italic">Dream Job</span> Today
                    </h1>
                    <p className="text-gray-500 text-lg font-medium mb-10 max-w-lg leading-relaxed">
                        Discover thousands of opportunities with top companies hiring now.
                    </p>
                    
                    {/* Advanced Search */}
                    <div className="relative mb-8">
                        <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-primary/10 border border-gray-100 flex items-center gap-2 p-2 pr-2 h-20">
                            <div className="pl-4 flex items-center gap-3 flex-grow">
                                <Search className="h-5 w-5 text-primary" />
                                <input 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Job title, skills, or company name..." 
                                    className="border-0 shadow-none h-full w-full text-base font-medium focus:outline-none placeholder:text-gray-400 bg-transparent" 
                                />
                            </div>
                            <Button size="lg" className="rounded-xl px-8 h-14 font-black">
                                Search Jobs
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                        <FilterDropdown 
                            icon={Folder} 
                            label="Job Category" 
                            value={filters.category} 
                            options={FILTER_OPTIONS.category}
                            onChange={(v) => handleFilterChange('category', v)}
                        />
                        <FilterDropdown 
                            icon={Globe} 
                            label="Your Location" 
                            value={filters.location} 
                            options={FILTER_OPTIONS.location}
                            onChange={(v) => handleFilterChange('location', v)}
                        />
                        <FilterDropdown 
                            icon={Star} 
                            label="Experience" 
                            value={filters.experience} 
                            options={FILTER_OPTIONS.experience}
                            onChange={(v) => handleFilterChange('experience', v)}
                        />
                        <FilterDropdown 
                            icon={Briefcase} 
                            label="Employment Type" 
                            value={filters.type} 
                            options={FILTER_OPTIONS.type}
                            onChange={(v) => handleFilterChange('type', v)}
                        />
                        <FilterDropdown 
                            icon={Hammer} 
                            label="Skills" 
                            value={filters.skills} 
                            options={FILTER_OPTIONS.skills}
                            onChange={(v) => handleFilterChange('skills', v)}
                        />
                         <FilterDropdown 
                            icon={Coins} 
                            label="Minimum Salary" 
                            value={filters.salary} 
                            options={FILTER_OPTIONS.salary}
                            onChange={(v) => handleFilterChange('salary', v)}
                        />
                        <FilterDropdown 
                            icon={MessageCircle} 
                            label="Language" 
                            value={filters.language} 
                            options={FILTER_OPTIONS.language}
                            onChange={(v) => handleFilterChange('language', v)}
                        />
                    </div>

                    <div className="flex items-center gap-3 text-sm font-bold">
                        <span className="text-gray-400">Popular Searches:</span>
                        <div className="flex flex-wrap gap-2">
                            {['Frontend Developer', 'UI/UX Designer', 'Product Manager', 'Data Scientist'].map((tag) => (
                                <button key={tag} className="text-primary/70 hover:text-primary transition-colors">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative z-10"
                    >
                        <div className="w-full aspect-square rounded-[100px] overflow-hidden bg-primary/5 border border-primary/10">
                            <img src="/hero_team.png" alt="Professional Team" className="w-full h-full object-cover" />
                        </div>
                    </motion.div>

                    {/* Statistic Cards */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-10 -left-10 z-20 bg-white p-6 rounded-3xl shadow-2xl shadow-primary/10 border border-gray-50 flex flex-col items-center text-center w-40"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                            <Briefcase className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900">25,000+</h4>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Active Jobs</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="absolute top-20 -right-4 z-20 bg-white p-6 rounded-3xl shadow-2xl shadow-primary/10 border border-gray-50 flex flex-col items-center text-center w-40"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                            <Globe className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900">8,500+</h4>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Top Companies</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="absolute bottom-10 -left-10 z-20 bg-white p-6 rounded-3xl shadow-2xl shadow-primary/10 border border-gray-50 flex flex-col items-center text-center w-40"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900">1.2M+</h4>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Job Seekers</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                        className="absolute bottom-40 -right-10 z-20 bg-white p-6 rounded-3xl shadow-2xl shadow-primary/10 border border-gray-50 flex flex-col items-center text-center w-40"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center mb-4">
                            <Star className="w-6 h-6 text-pink-600 fill-pink-600" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900">4.8/5</h4>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">User Rating</p>
                    </motion.div>
                </div>
            </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-5">
            <div>
                <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Popular Categories</h2>
                <p className="text-gray-500 font-medium">Explore jobs by industry and expertise</p>
            </div>
            <Link href="/companies" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                View All Categories <ArrowRight className="w-4 h-4" />
            </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((cat, i) => (
                <motion.div
                    key={i}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={cn("p-5 flex flex-col items-center text-center rounded-[32px] border transition-all cursor-pointer group", cat.color)}
                >
                    <div className="w-12 h-12 rounded-[20px] bg-white shadow-sm flex items-center justify-center mb-3 transition-all group-hover:shadow-lg">
                        <cat.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-sm text-gray-900 mb-0.5">{cat.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{cat.count}</p>
                    <div className="w-7 h-7 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Featured Opportunities</h2>
                    <p className="text-gray-500 font-medium">Hand-picked jobs from top companies with verified salaries</p>
                </div>
                <Link href="/jobs" className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                    View All Jobs <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode='popLayout'>
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-[280px] rounded-[32px] bg-gray-50 animate-pulse border border-gray-100"></div>
                    ))
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -6 }}
                        transition={{ duration: 0.2 }}
                        key={job.id}
                        className="h-full"
                      >
                        <Card className="p-6 rounded-[32px] hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-transparent hover:border-primary/20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group h-full flex flex-col">
                            {/* Animated top gradient line */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-400 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
                            
                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div className="w-12 h-12 bg-gray-50/80 rounded-xl flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 shadow-inner group-hover:scale-110 group-hover:-rotate-6 group-hover:text-primary transition-all duration-300 overflow-hidden shrink-0">
                                    {job.companies?.logo_url ? (
                                        <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        (job.companies?.name || 'J').charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1.5 origin-top-right">
                                    <button className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all bg-white shadow-sm hover:shadow-md hover:shadow-rose-100 mb-1 group/star">
                                        <Star className="w-4 h-4 group-hover/star:fill-rose-500 transition-colors" />
                                    </button>
                                    <Badge variant="info" className="bg-primary/5 text-primary border-primary/10 rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-colors duration-300">{job.type || 'Full-time'}</Badge>
                                </div>
                            </div>

                            <div className="mb-4 relative z-10">
                                <h3 className="text-base font-black text-gray-900 leading-[1.3] group-hover:text-primary transition-colors cursor-pointer line-clamp-2 min-h-[42px]">
                                    {job.title}
                                </h3>
                                <p className="text-gray-400 font-bold text-[11px] mt-1.5 group-hover:text-gray-500 transition-colors">
                                    {job.companies?.name || 'Top Company'}
                                </p>
                            </div>
                            
                            <div className="mb-5 flex-grow relative z-10">
                                <div className="flex flex-wrap items-center gap-y-1.5 text-[11px] text-gray-500 font-bold bg-gray-50/80 p-2.5 rounded-xl group-hover:bg-primary/[0.03] transition-colors duration-300">
                                    <div className="flex items-center group-hover:text-primary transition-colors duration-300">
                                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" /> {job.location || 'Remote'}
                                    </div>
                                    <span className="mx-2 text-gray-200">|</span>
                                    <div className="flex items-center group-hover:text-primary transition-colors duration-300">
                                      <Briefcase className="w-3.5 h-3.5 mr-1.5 text-primary" /> {job.experience || '3-5 Years'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-auto pt-5 border-t border-gray-50 group-hover:border-primary/10 transition-colors duration-300 relative z-10">
                                <div className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors duration-300">
                                    {job.salary || '$95k - $130k'}
                                </div>
                                <Button 
                                    onClick={() => handleApply(job.title)}
                                    className="rounded-xl px-4 h-10 text-sm font-black shadow-md shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1 flex items-center gap-1.5 group/btn bg-primary hover:bg-primary/90 text-white"
                                >
                                    Apply Now <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-500 font-medium">Try adjusting your filters or search keywords.</p>
                        <Button 
                          variant="ghost" 
                          className="mt-6 font-black text-primary hover:bg-primary/5 rounded-2xl"
                          onClick={() => {
                            setSearchQuery('');
                            setFilters({
                              category: 'Job Category',
                              location: 'Your Location',
                              experience: 'Experience',
                              type: 'Employment Type',
                              salary: 'Minimum Salary',
                              language: 'Language',
                              skills: 'Skills',
                            });
                          }}
                        >
                          Clear all filters
                        </Button>
                    </div>
                  )}
                </AnimatePresence>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="relative bg-primary rounded-[40px] p-8 md:p-12 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_30px_80px_-20px_rgba(37,99,235,0.4)]">
              <div className="relative z-10 max-w-xl text-center lg:text-left">
                  <p className="text-white/70 uppercase tracking-[0.2em] font-black text-[10px] mb-2">Ready to get started?</p>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-[1.1]">Post a Job and <br />Start hiring Today!</h2>
                  <p className="text-white/60 text-base font-medium mb-8 leading-relaxed">
                      Join thousands of companies finding top talent on JobPortal.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <Button size="lg" className="bg-white text-primary hover:bg-gray-100 rounded-xl h-12 px-8 text-sm font-black shadow-xl hover:-translate-y-0.5 transition-transform">
                          <Plus className="w-4 h-4 mr-2" /> Post Your First Job
                      </Button>
                      <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 rounded-xl h-12 px-8 text-sm font-black flex items-center gap-2">
                          Learn More <ArrowRight className="w-4 h-4" />
                      </Button>
                  </div>
              </div>

              <div className="relative z-10 w-full max-w-md hidden xl:block">
                  <div className="bg-white rounded-[24px] p-6 shadow-2xl border border-white/20">
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-50">
                          <h4 className="font-black text-gray-900 text-sm">Create New Job</h4>
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                      </div>
                      <div className="space-y-5">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Job Title</label>
                            <Input placeholder="UI/UX Designer" className="bg-gray-50 border-0 h-10 rounded-xl text-xs" disabled />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Location</label>
                                <Input placeholder="New York, NY" className="bg-gray-50 border-0 h-10 rounded-xl text-xs" disabled />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                                <div className="h-10 bg-primary/10 flex items-center px-4 rounded-xl text-primary font-black text-xs">Full-time</div>
                            </div>
                          </div>
                          <Button className="w-full h-12 rounded-xl font-black text-sm shadow-lg shadow-primary/20" disabled>Publish Job</Button>
                      </div>
                  </div>
                  {/* Floating elements */}
                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-8 -right-8 w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center rotate-12"
                  >
                    <Briefcase className="w-6 h-6 text-white" />
                  </motion.div>
                   <motion.div 
                    animate={{ x: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute top-1/2 -left-8 w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center -rotate-12"
                  >
                    <Star className="w-5 h-5 text-white" />
                  </motion.div>
              </div>

              {/* Decorative circle */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 blur-[100px] rounded-full pointer-events-none"></div>
          </div>
      </section>
    </div>
  );
}
