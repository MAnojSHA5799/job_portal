"use client";

import React, { useState, useMemo } from 'react';
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
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterDropdown } from '@/components/FilterDropdown';

const categories = [
  { icon: Code, name: 'Engineering', count: '1,284 jobs' },
  { icon: Palette, name: 'Design', count: '450 jobs' },
  { icon: BarChart, name: 'Marketing', count: '320 jobs' },
  { icon: Laptop, name: 'Product', count: '180 jobs' },
  { icon: Users, name: 'Sales', count: '210 jobs' },
  { icon: Globe, name: 'Remote', count: '2,400 jobs' },
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

const allJobs = [
  { id: 1, title: 'Senior Frontend Engineer', company: 'Google', location: 'USA', salary: '$160k - $220k', logo: 'G', type: 'Full-time', category: 'Engineering', experience: 'Senior', language: 'English', skills: ['React', 'Next.js'] },
  { id: 2, title: 'Lead Product Designer', company: 'Meta', location: 'Remote', salary: '$180k - $250k', logo: 'M', type: 'Contract', category: 'Design', experience: 'Lead', language: 'English', skills: ['Figma', 'UI/UX'] },
  { id: 3, title: 'Backend Developer', company: 'Stripe', location: 'Ireland', salary: '$120k - $160k', logo: 'S', type: 'Full-time', category: 'Engineering', experience: 'Intermediate', language: 'English', skills: ['Node.js', 'Python'] },
  { id: 4, title: 'Marketing Manager', company: 'Shopify', location: 'Canada', salary: '$90k - $130k', logo: 'Sh', type: 'Full-time', category: 'Marketing', experience: 'Senior', language: 'English', skills: ['SEO', 'Marketing'] },
  { id: 5, title: 'Customer Success', company: 'Zendesk', location: 'India', salary: '$50k - $70k', logo: 'Z', type: 'Full-time', category: 'Customer Support', experience: 'Entry Level', language: 'Hindi', skills: ['Communication'] },
  { id: 6, title: 'Sales Executive', company: 'Salesforce', location: 'USA', salary: '$150k - $200k', logo: 'Sf', type: 'Full-time', category: 'Sales', experience: 'Expert', language: 'English', skills: ['Sales', 'Negotiation'] },
];

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

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           job.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filters.category === 'Job Category' || job.category === filters.category;
      const matchesLocation = filters.location === 'Your Location' || job.location === filters.location || (filters.location === 'Remote' && job.location === 'Remote');
      const matchesExperience = filters.experience === 'Experience' || job.experience === filters.experience;
      const matchesType = filters.type === 'Employment Type' || job.type === filters.type;
      const matchesLanguage = filters.language === 'Language' || job.language === filters.language;
      const matchesSkills = filters.skills === 'Skills' || job.skills.includes(filters.skills);

      // Simple salary matching (needs more robust parsing for real apps)
      const matchesSalary = filters.salary === 'Minimum Salary' || true; 

      return matchesSearch && matchesCategory && matchesLocation && matchesExperience && matchesType && matchesLanguage && matchesSkills && matchesSalary;
    });
  }, [searchQuery, filters]);

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
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Main Search Bar */}
                    <div className="bg-white p-2.5 rounded-[32px] shadow-2xl shadow-primary/10 border border-gray-100 flex items-center gap-2 pr-4 pl-6 h-20">
                        <Search className="h-6 w-6 text-gray-400 shrink-0" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Job Title or Company name..." 
                            className="border-0 shadow-none h-full text-xl font-medium focus-visible:ring-0 placeholder:text-gray-300" 
                        />
                        <button className="w-14 h-14 rounded-2xl bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-primary transition-colors group">
                            <SlidersHorizontal className="w-6 h-6 group-hover:scale-110 transition-transform" />
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

                <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400 font-bold uppercase tracking-widest">
                    <span>Trusted by:</span>
                    <span className="text-gray-900">Google</span>
                    <span className="text-gray-900">Meta</span>
                    <span className="text-gray-900">Stripe</span>
                    <span className="text-gray-900">Apple</span>
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
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors mb-4 shadow-sm">
                        <cat.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{cat.name}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase">{cat.count}</p>
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
                  {filteredJobs.length > 0 ? (
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
                                    {job.logo}
                                </div>
                                <Badge variant="info">{job.type}</Badge>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                                {job.title}
                            </h3>
                            <p className="text-gray-500 font-bold text-sm mb-6 flex items-center">
                                <Briefcase className="w-4 h-4 mr-2" /> {job.company}
                            </p>
                            
                            <div className="space-y-3 mb-8 flex-grow">
                                <div className="flex items-center text-sm text-gray-400 font-medium">
                                    <MapPin className="w-4 h-4 mr-2" /> {job.location}
                                </div>
                                <div className="flex items-center text-sm text-primary font-bold bg-primary/5 px-3 py-1 rounded-lg w-fit">
                                    <Star className="w-4 h-4 mr-2 fill-primary" /> {job.salary}
                                </div>
                            </div>

                            <Button className="w-full font-bold group-hover:shadow-primary/30 transition-all">
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
