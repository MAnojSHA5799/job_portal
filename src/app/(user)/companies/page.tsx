"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Search, 
  Briefcase, 
  Star, 
  Users, 
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Company {
  id: string;
  name: string;
  url_slug: string;
  industry: string;
  location: string;
  logo_url: string;
  rating?: number;
  jobs: { count: number }[];
}

export default function CompaniesDirectory() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryQuery, setIndustryQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          jobs:jobs(count)
        `);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (industryQuery) {
        query = query.ilike('industry', `%${industryQuery}%`);
      }

      if (locationQuery) {
        query = query.ilike('location', `%${locationQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCompanies((data as any) || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <section className="bg-gray-50 border-b border-gray-100 py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-8">
                    <Building2 className="w-3 h-3 fill-primary" /> Verified Partners
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-8">
                    Top <span className="text-primary italic">Hiring</span> Partners.
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed mb-12">
                    Discover world-class companies and their culture. Explore high-growth opportunities at industry leaders.
                </p>

                <form onSubmit={handleSearch} className="max-w-5xl bg-white p-2 rounded-2xl shadow-2xl shadow-gray-200 border border-gray-100 flex flex-col md:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <Input 
                            placeholder="Company Name" 
                            className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0 font-bold" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="hidden md:block w-px h-8 bg-gray-100"></div>
                    <div className="relative flex-1 w-full">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <Input 
                            placeholder="Industry" 
                            className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0 font-bold" 
                            value={industryQuery}
                            onChange={(e) => setIndustryQuery(e.target.value)}
                        />
                    </div>
                    <div className="hidden md:block w-px h-8 bg-gray-100"></div>
                    <div className="relative flex-1 w-full">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <Input 
                            placeholder="Location" 
                            className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0 font-bold" 
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" size="lg" className="h-11 w-full md:w-auto font-black px-10 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs">Search</Button>
                </form>
            </motion.div>
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 z-20 relative">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[40px] border border-dashed border-gray-200 shadow-sm">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900">No companies found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">We couldn't find any companies matching your search filters. Try adjusting your keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((company, i) => (
                  <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                  >
                      <Card className="p-8 hover:shadow-2xl hover:shadow-primary/5 border-0 shadow-sm transition-all group group overflow-hidden bg-white">
                          <div className="flex justify-between items-start mb-8">
                              <Link href={`/company/${company.url_slug || company.id}`} className="w-16 h-16 rounded-[24px] bg-white border border-gray-100 shadow-xl shadow-gray-100 flex items-center justify-center text-3xl font-black text-primary p-2 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6 overflow-hidden">
                                  {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                                  ) : (
                                    company.name[0]
                                  )}
                              </Link>
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/5 text-accent border border-accent/10">
                                  <Star className="h-3.5 w-3.5 fill-accent" /> <span className="font-bold text-xs">{company.rating || '4.5'}</span>
                              </div>
                          </div>

                          <Link href={`/company/${company.url_slug || company.id}`}>
                              <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight tracking-tight group-hover:text-primary transition-colors cursor-pointer">
                                  {company.name}
                              </h3>
                          </Link>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">{company.industry}</p>
                          
                          <div className="space-y-4 mb-10 pb-10 border-b border-gray-50 font-medium">
                              <div className="flex items-center text-gray-500 gap-3 text-sm">
                                  <MapPin className="h-4 w-4" /> {company.location || 'Remote'}
                              </div>
                              <div className="flex items-center text-gray-500 gap-3 text-sm">
                                  <Briefcase className="h-4 w-4" /> {company.jobs?.[0]?.count || 0} Active Jobs
                              </div>
                          </div>

                          <Link href={`/company/${company.url_slug || company.id}`}>
                              <Button className="w-full font-black text-xs uppercase tracking-widest h-12 rounded-2xl group-hover:shadow-lg transition-all group-hover:shadow-primary/20">
                                  View Careers <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                          </Link>
                      </Card>
                  </motion.div>
              ))}
          </div>
        )}

        {!loading && companies.length > 0 && (
          <div className="mt-20 text-center">
              <Button variant="outline" size="lg" className="px-16 h-14 font-black border-2 rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm">
                  Explore 500+ More Companies
              </Button>
          </div>
        )}
      </div>

      {/* Stats section */}
      <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32">
                   {[
                       { label: 'Verified Partners', value: '840+', icon: Building2 },
                       { label: 'Monthly Applications', value: '12K+', icon: TrendingUp },
                       { label: 'Unique Roles', value: '25K+', icon: Briefcase },
                   ].map((stat, i) => (
                       <div key={i} className="space-y-4">
                           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
                               <stat.icon className="h-6 w-6" />
                           </div>
                           <h4 className="text-4xl font-black text-white leading-none">{stat.value}</h4>
                           <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">{stat.label}</p>
                       </div>
                   ))}
               </div>
               {/* Background glow */}
               <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-[-50%]"></div>
          </div>
      </section>
    </div>
  );
}

