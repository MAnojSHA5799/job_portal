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
  Loader2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Company {
  id: string;
  name: string;
  url_slug: string;
  industry: string;
  location: string;
  logo_url: string;
  rating?: number;
  jobs: { id: string }[];
  team_size?: string;
}

export default function CompaniesDirectory() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryQuery, setIndustryQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [teamSizeQuery, setTeamSizeQuery] = useState('');

  // Suggestion states
  const [industries, setIndustries] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [teamSizes, setTeamSizes] = useState<string[]>([]);

  const fetchFilters = async () => {
    try {
      const { data } = await supabase.from('companies').select('industry, location, team_size');
      if (data) {
        const uniqueIndustries = Array.from(new Set(data.map(c => c.industry).filter(Boolean)));
        const uniqueLocations = Array.from(new Set(data.map(c => c.location).filter(Boolean)));
        const uniqueTeamSizes = Array.from(new Set(data.map(c => c.team_size).filter(Boolean)));
        
        setIndustries(uniqueIndustries);
        setLocations(uniqueLocations);
        setTeamSizes(uniqueTeamSizes);
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          jobs(id)
        `)
        .eq('jobs.is_approved', true);

      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      if (industryQuery) query = query.ilike('industry', `%${industryQuery}%`);
      if (locationQuery) query = query.ilike('location', `%${locationQuery}%`);
      if (teamSizeQuery) query = query.eq('team_size', teamSizeQuery);

      const { data, error } = await query;
      if (error) throw error;
      setCompanies((data as any) || []);
    } catch (error) {
      error && console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
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
            <div
                className="max-w-5xl"
            >
                
                <h1 
                  className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-8"
                >
                    Top <span className="text-primary italic">Hiring</span> Partners.
                </h1>
                
                <form 
                  onSubmit={handleSearch} 
                  className="bg-white p-2 rounded-2xl shadow-2xl shadow-gray-200 border border-gray-100 flex flex-col lg:flex-row items-stretch gap-2"
                >
                    <div className="relative flex-[1.2] min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <Input 
                            placeholder="Company Name" 
                            className="border-0 shadow-none pl-12 h-12 focus-visible:ring-0 font-bold w-full" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="hidden lg:block w-px bg-gray-100 my-2"></div>
                    
                    <div className="relative flex-1 min-w-0">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <select 
                            className="w-full border-0 bg-transparent pl-12 pr-10 h-12 focus-visible:ring-0 font-bold text-sm text-gray-600 appearance-none cursor-pointer outline-none"
                            value={industryQuery}
                            onChange={(e) => setIndustryQuery(e.target.value)}
                        >
                            <option value="">All Industries</option>
                            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    
                    <div className="hidden lg:block w-px bg-gray-100 my-2"></div>

                    <div className="relative flex-1 min-w-0">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <select 
                            className="w-full border-0 bg-transparent pl-12 pr-10 h-12 focus-visible:ring-0 font-bold text-sm text-gray-600 appearance-none cursor-pointer outline-none"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                        >
                            <option value="">All Locations</option>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="hidden lg:block w-px bg-gray-100 my-2"></div>

                    <div className="relative flex-1 min-w-0">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 font-black" />
                        <select 
                            className="w-full border-0 bg-transparent pl-12 pr-10 h-12 focus-visible:ring-0 font-bold text-sm text-gray-600 appearance-none cursor-pointer outline-none"
                            value={teamSizeQuery}
                            onChange={(e) => setTeamSizeQuery(e.target.value)}
                        >
                            <option value="">All Team Sizes</option>
                            {teamSizes.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <Button type="submit" size="lg" className="h-12 w-full lg:w-auto font-black px-10 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs">Search</Button>
                </form>
            </div>
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
          <div className="grid grid-cols-1 gap-6">
              {companies.map((company, i) => (
                  <Link
                    key={company.id}
                    href={`/company/${company.url_slug || company.id}`}
                    target="_blank"
                    className="block group/company-card"
                  >
                      <Card className="group relative bg-white rounded-3xl border border-gray-100 p-6 group-hover/company-card:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] group-hover/company-card:-translate-y-1 transition-all duration-300 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/company-card:opacity-100 transition-opacity" />
                          
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                              {/* Left: Logo */}
                              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-3 shrink-0 group-hover/company-card:scale-105 transition-transform">
                                  {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-primary text-3xl bg-indigo-50 rounded-xl">
                                        {company.name[0]}
                                    </div>
                                  )}
                              </div>

                              {/* Center: Info */}
                              <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-3 mb-2">
                                      <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight group-hover/company-card:text-primary transition-colors truncate">
                                          {company.name}
                                      </h3>
                                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> 
                                          <span className="font-bold text-[10px]">{company.rating || '4.5'}</span>
                                      </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-gray-400">
                                      <span className="flex items-center gap-2 italic">
                                          <Briefcase className="w-4 h-4 text-gray-300" /> {company.industry}
                                      </span>
                                      <span className="flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-gray-300" /> {company.location || 'Remote'}
                                      </span>
                                      {company.team_size && (
                                          <span className="flex items-center gap-2">
                                              <Users className="w-4 h-4 text-gray-300" /> {company.team_size} Employees
                                          </span>
                                      )}
                                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black border border-primary/10">
                                          <TrendingUp className="w-3 h-3" /> {company.jobs?.length || 0} Openings
                                      </div>
                                  </div>
                              </div>

                              {/* Right: Action */}
                              <div className="w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                                  <Button className="w-full md:w-auto px-10 h-12 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 pointer-events-none">
                                      View Profile <ArrowRight className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      </Card>
                  </Link>
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
      <section 
        className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
          <div className="bg-gray-900 rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden border border-white/5">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32">
                   {[
                       { label: 'Verified Partners', value: 840, suffix: '+', icon: Building2 },
                       { label: 'Monthly Applications', value: 12, suffix: 'K+', icon: TrendingUp },
                       { label: 'Unique Roles', value: 25, suffix: 'K+', icon: Briefcase },
                   ].map((stat, i) => (
                       <div key={i} className="space-y-3">
                           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary mx-auto border border-white/5">
                               <stat.icon className="h-5 w-5" />
                           </div>
                           <h4 className="text-3xl md:text-4xl font-black text-white leading-none flex items-center justify-center">
                               {stat.value}
                               <span className="text-primary ml-1">{stat.suffix}</span>
                           </h4>
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">{stat.label}</p>
                       </div>
                   ))}
               </div>
               {/* Background glow */}
               <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-[-50%]"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full translate-y-1/2 translate-x-1/2"></div>
          </div>
      </section>
    </div>
  );
}
