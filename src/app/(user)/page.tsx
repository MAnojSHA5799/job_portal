"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterDropdown } from '@/components/FilterDropdown';
import { cn } from '@/lib/utils';

const categories = [
  { icon: Code, name: 'Engineering', count: '1,284 jobs', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { icon: Palette, name: 'Design', count: '450 jobs', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { icon: BarChart, name: 'Marketing', count: '320 jobs', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { icon: Laptop, name: 'Product', count: '180 jobs', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { icon: Users, name: 'Sales', count: '210 jobs', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { icon: Globe, name: 'Remote', count: '2,400 jobs', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
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
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary font-bold text-xs mb-8">
                    <Zap className="w-3 h-3 fill-primary" /> NEW: 2,491 remote jobs added this week
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-8">
                    Discover your <span className="text-primary italic">dream career</span> in tech.
                </h1>
                
                {/* Advanced Search & Filters */}
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Main Search Bar */}
                    <div className="bg-white p-2 rounded-full shadow-2xl shadow-primary/30 border-4 border-primary/20 flex items-center gap-3 pr-3 pl-6 h-14 transform transition-all hover:scale-[1.02]">
                        <Search className="h-6 w-6 text-primary shrink-0" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type job title, skills, or company name..." 
                            className="border-0 shadow-none h-full text-lg font-bold focus-visible:ring-0 placeholder:text-gray-300 bg-transparent" 
                        />
                        <button className="w-12 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white shadow-lg shadow-primary/40 transition-colors group">
                            <SlidersHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {/* Filter Chips Container */}
                    <div className="flex flex-wrap justify-center gap-3">
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
                </div>

                <div className="mt-16 w-full overflow-hidden flex flex-col items-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Trusted by world-class teams</p>
                    <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                        <div className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
                            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8">
                                {BRANDS.map((brand, i) => (
                                    <li key={i} className={cn("text-2xl md:text-3xl font-black text-gray-300 transition-all duration-300 cursor-default whitespace-nowrap", brand.color)}>
                                        {brand.name}
                                    </li>
                                ))}
                            </ul>
                            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8" aria-hidden="true">
                                {BRANDS.map((brand, i) => (
                                    <li key={i + 'dup'} className={cn("text-2xl md:text-3xl font-black text-gray-300 transition-all duration-300 cursor-default whitespace-nowrap", brand.color)}>
                                        {brand.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Popular Categories</h2>
                <p className="text-gray-500 font-medium">Explore jobs by industry and expertise.</p>
            </div>
            <Button variant="ghost" className="text-primary font-bold">
                View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
                <motion.div
                    key={i}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={cn("p-6 rounded-[32px] border transition-all cursor-pointer group hover:shadow-2xl flex flex-col items-center text-center", cat.color, "hover:bg-white")}
                >
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-sm bg-white current-color")}>
                        <cat.icon className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-gray-900 mb-1">{cat.name}</h4>
                    <p className="text-xs font-bold uppercase opacity-80">{cat.count}</p>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider mb-4">
                  <Star className="w-3 h-3 fill-primary" /> {filteredJobs.length} Positions Found
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Featured Opportunities</h2>
                <p className="text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
                    Hand-picked jobs from top companies with verified salaries and instant response rates.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <AnimatePresence mode='popLayout'>
                  {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                      <p className="text-gray-500 font-bold animate-pulse">Loading amazing opportunities...</p>
                    </div>
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={job.id}
                      >
                        <Card className="p-8 hover:shadow-2xl transition-all border-0 shadow-sm relative overflow-hidden group h-full flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                    {(job.companies?.name || job.company || 'J').charAt(0).toUpperCase()}
                                </div>
                                <Badge variant="info">{job.type || 'Full-time'}</Badge>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                                {job.title}
                            </h3>
                            <p className="text-gray-500 font-bold text-sm mb-6 flex items-center">
                                <Briefcase className="w-4 h-4 mr-2" /> {job.companies?.name || job.company || 'Featured Company'}
                            </p>
                            
                            <div className="space-y-3 mb-8 flex-grow">
                                <div className="flex items-center text-sm text-gray-400 font-medium">
                                    <MapPin className="w-4 h-4 mr-2" /> {job.location}
                                </div>
                                <div className="flex items-center text-sm text-primary font-bold bg-primary/5 px-3 py-1 rounded-lg w-fit">
                                    <Star className="w-4 h-4 mr-2 fill-primary" /> {job.salary || 'Competitive Salary'}
                                </div>
                            </div>

                            <Button 
                                onClick={() => handleApply(job.title)}
                                className="w-full font-bold group-hover:shadow-primary/30 transition-all"
                            >
                                Apply Now
                            </Button>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-500 font-medium">Try adjusting your filters or search keywords.</p>
                        <Button 
                          variant="ghost" 
                          className="mt-6 font-bold text-primary"
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

            {filteredJobs.length > 0 && (
              <div className="mt-16 text-center">
                  <Button size="lg" variant="outline" className="px-12 font-bold border-2 hover:border-primary hover:text-primary">
                      Browse 25,000+ More Jobs
                  </Button>
              </div>
            )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gray-900 rounded-[40px] p-12 md:p-20 overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="relative z-10 max-w-xl">
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">Ready to take the <span className="text-primary italic">next step</span>?</h2>
                  <p className="text-gray-400 text-lg font-medium mb-10 leading-relaxed">
                      Upload your resume and join our talent network to get personalized job recommendations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                      <Button size="lg" className="font-bold px-10">Upload Resume</Button>
                      <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 font-bold px-10">Learn More</Button>
                  </div>
              </div>
              <div className="relative z-10 w-full max-w-sm hidden lg:block">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                          <div className="w-full h-32 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse"></div>
                          <div className="w-full h-48 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <div className="space-y-4 pt-8">
                          <div className="w-full h-48 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          <div className="w-full h-32 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                  </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[100px] rounded-full"></div>
          </div>
      </section>
    </div>
  );
}
