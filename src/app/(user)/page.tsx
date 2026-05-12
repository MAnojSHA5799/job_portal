"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ArrowRight,
  Star,
  Coins,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  Settings2,
  Languages,
  Wrench,
  Building2,
  Users,
  Clock,
  Newspaper
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ApplyButton } from '@/components/ApplyButton';
import { Banner } from '@/components/Banner';
import Link from 'next/link';

const BRANDS = [
  { name: 'Teleperformance', logo: 'https://logo.clearbit.com/teleperformance.com' },
  { name: 'Bajaj Allianz', logo: 'https://logo.clearbit.com/bajajallianz.com' },
  { name: 'Bigbasket', logo: 'https://logo.clearbit.com/bigbasket.com' },
  { name: 'Droom', logo: 'https://logo.clearbit.com/droom.in' },
  { name: 'Dunzo', logo: 'https://logo.clearbit.com/dunzo.com' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSalary, setSelectedSalary] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [popularCompanies, setPopularCompanies] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Jobs
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

      if (error) throw error;
      setJobs(data || []);
      setTotalJobs(data?.length || 0);

      // Fetch Unique Company Logos
      const { data: compData } = await supabase
        .from('companies')
        .select('name, logo_url')
        .not('logo_url', 'is', null)
        .limit(15);
      
      setDbCompanies(compData || []);

      // Fetch Popular Companies (sorted by team size if possible, or just limit)
      const { data: popCompData } = await supabase
        .from('companies')
        .select(`
          *,
          jobs(id)
        `)
        .not('logo_url', 'is', null)
        .limit(10);
      
      setPopularCompanies(popCompData || []);

      // Fetch Latest Blogs
      const { data: blogData } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setBlogs(blogData || []);

      // Process Category Counts
      const counts: Record<string, number> = {};
      data?.forEach(job => {
        if (job.category) {
          counts[job.category] = (counts[job.category] || 0) + 1;
        }
      });
      setCategoryCounts(counts);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const companyName = job.companies?.name || '';
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = job.location?.toLowerCase().includes(locationQuery.toLowerCase());
      const matchesCategory = selectedCategory ? job.category === selectedCategory : true;
      const matchesType = selectedType ? job.job_type === selectedType : true;
      const matchesExperience = selectedExperience ? job.experience_level === selectedExperience : true;
      
      // Salary filter logic (basic string check for now)
      const matchesSalary = selectedSalary ? (job.salary_range || '').includes(selectedSalary) : true;
      const matchesSkills = selectedSkills ? (job.description || '').toLowerCase().includes(selectedSkills.toLowerCase()) : true;
      const matchesLanguage = selectedLanguage ? (job.description || '').toLowerCase().includes(selectedLanguage.toLowerCase()) : true;
      
      return matchesSearch && matchesLocation && matchesCategory && matchesType && matchesExperience && matchesSalary && matchesSkills && matchesLanguage;
    });
  }, [searchQuery, locationQuery, selectedCategory, selectedType, selectedExperience, selectedSalary, selectedSkills, selectedLanguage, jobs]);

  const shuffledJobs = useMemo(() => {
    return [...filteredJobs].sort(() => Math.random() - 0.5);
  }, [filteredJobs]);

  const popularCategories = useMemo(() => {
    // Basic types from job fields
    const baseTypes = [
      { title: 'Freshers', count: jobs.filter(j => j.experience?.toLowerCase().includes('fresher')).length, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=256&h=256&fit=crop' },
      { title: 'Work from home', count: jobs.filter(j => j.location?.toLowerCase().includes('remote')).length, image: 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=256&h=256&fit=crop' },
      { title: 'Full time', count: jobs.filter(j => j.type?.toLowerCase().includes('full')).length, image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=256&h=256&fit=crop' },
    ];

    // Dynamic categories from DB
    const dbCats = Object.entries(categoryCounts)
      .filter(([name]) => name !== 'General')
      .map(([name, count]) => ({
        title: name,
        count: count,
        image: `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=256&h=256&fit=crop` // Default professional image
      }));

    return [...baseTypes, ...dbCats].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [categoryCounts, jobs]);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-16 pb-0 bg-[#F8F9FE] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-left">
              <span className="text-[#4f46e5] font-bold text-xs uppercase tracking-widest mb-4 block">INDIA'S #1 JOB PLATFORM</span>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
                Your job search <br />ends here
              </h1>
              <p className="text-gray-500 text-lg font-medium mb-10">
                Discover {totalJobs.toLocaleString()}+ career opportunities
              </p>

              {/* New Search UI matching image */}
              <div className="w-full space-y-6">
                <div className="relative group max-w-4xl">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Job Title or Company name..."
                    className="w-full h-16 pl-14 pr-20 bg-white rounded-full shadow-lg border-0 text-base font-medium focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
                  />
                  <div className="absolute right-2 inset-y-2">
                    <button className="h-full px-5 bg-gray-50 hover:bg-gray-100 rounded-full transition-all flex items-center justify-center text-gray-900 group/btn">
                      <Filter className="w-5 h-5 text-[#4a3728]" />
                    </button>
                  </div>
                </div>

                {/* Filter Pills Grid */}
                <div className="flex flex-wrap gap-2.5 max-w-5xl">
                  {/* Job Category */}
                  <div className="relative group">
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">📂 Job Category</option>
                      {Object.keys(categoryCounts).sort().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Location */}
                  <div className="relative group">
                    <select 
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">🌍 Your Location</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Remote">Work From Home</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Experience */}
                  <div className="relative group">
                    <select 
                      value={selectedExperience}
                      onChange={(e) => setSelectedExperience(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">⭐ Experience</option>
                      <option value="Fresher">Fresher</option>
                      <option value="1-3 Years">1-3 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5+ Years">5+ Years</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Employment Type */}
                  <div className="relative group">
                    <select 
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">💼 Employment Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Skills */}
                  <div className="relative group">
                    <select 
                      value={selectedSkills}
                      onChange={(e) => setSelectedSkills(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">🛠️ Skills</option>
                      <option value="React">React / Frontend</option>
                      <option value="Node">Node / Backend</option>
                      <option value="Python">Python / AI</option>
                      <option value="Sales">Sales / Business</option>
                      <option value="Marketing">Marketing / SEO</option>
                      <option value="Design">UI / UX Design</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Salary */}
                  <div className="relative group">
                    <select 
                      value={selectedSalary}
                      onChange={(e) => setSelectedSalary(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">💰 Minimum Salary</option>
                      <option value="10000">₹10k+</option>
                      <option value="25000">₹25k+</option>
                      <option value="50000">₹50k+</option>
                      <option value="100000">₹1L+</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Language */}
                  <div className="relative group">
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="appearance-none pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-full text-gray-700 font-bold text-sm hover:border-primary/20 hover:bg-gray-50/50 transition-all cursor-pointer focus:outline-none"
                    >
                      <option value="">🗣️ Language</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>

                  {/* Clear Filters (Optional but good) */}
                  {(selectedCategory || locationQuery || selectedExperience || selectedType || selectedSalary || selectedSkills || selectedLanguage) && (
                    <button 
                      onClick={() => {
                        setSelectedCategory('');
                        setLocationQuery('');
                        setSelectedExperience('');
                        setSelectedType('');
                        setSelectedSalary('');
                        setSelectedSkills('');
                        setSelectedLanguage('');
                      }}
                      className="px-4 py-3.5 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-full transition-all"
                    >
                      ✕ Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
               
                <div>
                  <p className="text-[10px] mt-3 font-bold text-gray-400 uppercase tracking-widest mb-3">Trusted by 1000+ enterprises and 7 lakh+ MSMEs for hiring</p>
                  <div className="relative overflow-hidden w-full h-16">
                    <div className="flex items-center gap-12 animate-infinite-scroll whitespace-nowrap absolute left-0 top-0 h-full">
                      {[...dbCompanies, ...dbCompanies, ...dbCompanies].map((company, i) => (
                        <img 
                          key={`${company.name}-${i}`} 
                          src={company.logo_url} 
                          alt={company.name} 
                          className="h-8 w-auto object-contain inline-block" 
                          style={{ filter: 'none', opacity: 1 }}
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      ))}
                      {dbCompanies.length === 0 && BRANDS.map(brand => (
                        <img 
                          key={brand.name} 
                          src={brand.logo} 
                          alt={brand.name} 
                          className="h-8 w-auto object-contain inline-block"
                          style={{ filter: 'none', opacity: 1 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* New ATS Score Section from Image */}
                <div className="mt-12 group">
                  
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative w-[500px]">
               <img src="/assets/hero-3d.png" alt="Professional Growth" className="w-full relative z-10 rounded-[2.5rem] shadow-2xl animate-float" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f46e5]/10 rounded-full blur-[100px] -z-0 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ATS Score Section - Compact Version */}
      <section className="bg-gray-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-gray-100 border border-gray-100">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 tracking-tight">
                Check Your <span className="text-primary">ATS Score</span> For Free
              </h2>
              <p className="text-gray-500 text-sm font-medium max-w-xl">
                Upload your resume & instantly get your ATS score.
              </p>
            </div>
            <div className="shrink-0">
              <Link href="/ats-score">
                <button className="group px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
                  Upload Resume & Check Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Banner />


      {/* Recent Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-50">
        <div className="flex items-center justify-between mb-12">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Recent Jobs</h2>
                <p className="text-gray-500 font-medium">Explore the latest opportunities across all categories</p>
            </div>
            <Link href="/jobs" className="hidden sm:block">
                <Button variant="ghost" className="text-primary font-bold">View all jobs <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence mode='popLayout'>
              {loading ? (
                Array(9).fill(0).map((_, i) => (
                    <div key={i} className="h-[220px] rounded-2xl bg-gray-50 animate-pulse"></div>
                ))
              ) : shuffledJobs.length > 0 ? (
                shuffledJobs
                  .slice(0, 9) // Show 9 jobs
                  .map((job) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={job.id}
                  >
                    <Card className="p-6 rounded-2xl hover:shadow-xl transition-all border border-gray-100 bg-white group h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100 p-2">
                                    {job.companies?.logo_url ? (
                                        <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-lg">
                                            {(job.companies?.name || 'J').charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-tight border border-green-100">
                                    {job.type || 'Full Time'}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                {job.title}
                            </h3>
                            <p className="text-sm font-semibold text-gray-500 mb-4">{job.companies?.name}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-xs font-semibold text-gray-500">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" /> {job.location || 'India'}
                                </div>
                                <div className="flex items-center text-xs font-semibold text-gray-500">
                                    <Coins className="w-4 h-4 mr-2 text-gray-400" /> {job.salary || 'Not disclosed'}
                                </div>
                                <div className="flex items-center text-xs font-semibold text-gray-500">
                                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" /> {job.experience || 'Fresher'}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                                {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                                <Link href={`/jobs/${job.url_slug || job.id}`}>
                                    <Button variant="outline" className="h-9 px-4 rounded-lg font-bold text-xs border-gray-200 hover:bg-gray-50 transition-colors">
                                        View
                                    </Button>
                                </Link>
                                <ApplyButton 
                                    jobId={job.id}
                                    jobTitle={job.title}
                                    companyId={job.companies?.id}
                                    companyName={job.companies?.name}
                                    applyLink={job.apply_link || '#'}
                                    className="h-9 px-4 rounded-lg font-bold text-xs"
                                />
                            </div>
                        </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                    <p className="text-gray-500 font-bold">No jobs found in your database.</p>
                </div>
              )}
            </AnimatePresence>
        </div>

        {/* Bottom See More Button */}
        {!loading && filteredJobs.length > 9 && (
          <div className="mt-12 text-center">
            <Link href="/jobs">
              <Button size="lg" className="px-12 h-14 bg-white border-2 border-primary/10 text-primary hover:bg-primary hover:text-white font-black rounded-2xl shadow-xl shadow-gray-100 transition-all group">
                See More Jobs
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </section>



      {/* Popular Companies Section - Minimalist Image-Based Design */}
      <section className="bg-white py-12 border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Popular <span className="text-primary italic">Companies</span></h2>
              <p className="text-gray-500 font-medium text-sm">Top hiring partners and industry leaders</p>
            </div>
            <Link href="/companies" className="text-primary font-bold text-sm hover:underline">View All</Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide no-scrollbar snap-x">
            {popularCompanies.map((company) => (
              <Link key={company.id} href={`/company/${company.url_slug || company.id}`} className="snap-start">
                <motion.div
                  whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  className="w-[180px] h-[200px] bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-6 shadow-sm transition-all text-center"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 overflow-hidden p-3">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-emerald-600 font-bold text-xl">{company.name[0]}</div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{company.name}</h3>
                  <p className="text-xs font-medium text-gray-400">{company.jobs?.length || 0} Jobs</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* Blog Section */}
      <section className="bg-gray-50 py-12 border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
             
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Expert <span className="text-primary italic">Insights</span></h2>
              <p className="text-gray-500 mt-3 font-medium text-lg">Tips, trends, and career advice from our expert team</p>
            </div>
            <Link href="/blog">
              <Button size="lg" className="bg-white border-2 border-primary/10 text-primary hover:bg-primary hover:text-white font-black rounded-2xl shadow-xl shadow-gray-100 transition-all group px-8 h-12 text-sm">
                See All Articles
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col group"
              >
                <div className="h-60 bg-gray-100 relative overflow-hidden">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <Newspaper className="w-12 h-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  {/* <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 line-clamp-3">
                    {post.excerpt}
                  </p> */}
                  <div className="mt-auto">
                    <Link href={`/blog/${post.slug || post.id}`}>
                      <Button variant="ghost" className="text-primary font-black text-xs uppercase tracking-widest px-0 hover:bg-transparent group/btn">
                        Read More <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
