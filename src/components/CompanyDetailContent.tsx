"use client";

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, Briefcase, Clock, Star, Globe, Users, 
  Building2, ExternalLink, ShieldCheck, TrendingUp, 
  Award, ChevronRight, Zap
} from 'lucide-react';
import { ApplyButton } from '@/components/ApplyButton';
import Link from 'next/link';

interface CompanyDetailContentProps {
  company: any;
  jobs: any[];
}

export const CompanyDetailContent = ({ company, jobs }: CompanyDetailContentProps) => {
  const jobCount = jobs?.length || 0;

  return (
    <div className="bg-transparent">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-10">
            <div 
              className="w-36 h-36 rounded-[48px] bg-white border border-gray-50 shadow-2xl shadow-indigo-100/50 flex items-center justify-center p-6 overflow-hidden -mt-20 group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain relative z-10" />
              ) : (
                <Building2 className="w-16 h-16 text-indigo-600 relative z-10" />
              )}
            </div>
            
            <div className="flex-1 space-y-4 pb-2">
              <div>
                <Badge className="bg-indigo-600 text-white border-0 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest mb-2 shadow-lg shadow-indigo-200">
                  Verified Partner
                </Badge>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                  {company.name}
                </h1>
              </div>

              <div 
                className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-gray-500 font-bold uppercase tracking-widest"
              >
                <span className="flex items-center gap-2 group cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  {company.industry || 'Manufacturing'}
                </span>
                <span className="flex items-center gap-2 group cursor-default">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {company.location}
                </span>
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-indigo-600 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Globe className="w-4 h-4" />
                    </div>
                    Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
             <section>
                <div 
                  className="flex items-center justify-between mb-8 px-2"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Job Openings</h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{jobCount} Available Positions</p>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Currently Hiring</span>
                  </div>
                </div>

                {jobs && jobs.length > 0 ? (
                  <div className="space-y-6">
                      {jobs.map((job, index) => (
                        <div
                          key={job.id}
                        >
                          <Card className="p-8 border-0 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all bg-white group rounded-[32px] overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1.5 h-0 group-hover:h-full bg-primary transition-all duration-300" />
                            <div className="flex flex-col md:flex-row md:items-center gap-8">
                              <div className="flex-1 space-y-4">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                  <Link href={`/jobs/${job.url_slug || job.id}`}>{job.title}</Link>
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 font-black uppercase tracking-widest">
                                  <span className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                    <MapPin className="w-4 h-4" /> {job.location}
                                  </span>
                                  {job.salary_range && (
                                    <span className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
                                      <Zap className="w-4 h-4" /> {job.salary_range}
                                    </span>
                                  )}
                                  {job.job_type && (
                                    <span className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl">
                                      <Clock className="w-4 h-4" /> {job.job_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                                <ApplyButton 
                                  jobId={job.id}
                                  jobTitle={job.title}
                                  companyId={company.id}
                                  companyName={company.name}
                                  applyLink={job.apply_link || '#'}
                                  className="flex-1 md:flex-none h-14 text-xs px-10 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase tracking-widest border-0"
                                />
                                <Link href={`/jobs/${job.url_slug || job.id}`} className="hidden md:block">
                                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                    <ChevronRight className="w-6 h-6" />
                                  </div>
                                </Link>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div 
                    className="bg-white p-24 rounded-[48px] text-center border-2 border-dashed border-gray-100 shadow-sm shadow-gray-50/50"
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      <Briefcase className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Open Roles</h3>
                    <p className="text-gray-500 font-medium max-w-xs mx-auto">There are no active openings at the moment. Please check back later!</p>
                  </div>
                )}
             </section>

             <section
             >
                <Card className="p-12 border-0 shadow-2xl shadow-gray-100/50 bg-white rounded-[48px] prose prose-indigo max-w-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                      <Building2 className="w-64 h-64" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" /> Company Culture & Overview
                    </h2>
                    {company.description ? (
                      <div 
                          className="text-gray-600 font-medium leading-relaxed html-content prose-lg"
                          dangerouslySetInnerHTML={{ __html: company.description }}
                      />
                    ) : (
                      <div className="text-lg text-gray-600 font-medium leading-relaxed">
                          {`${company.name} is a leading industry player in the ${company.industry || 'Manufacturing'} sector, currently expanding their operations and hiring top talent for ${jobCount} verified positions.`}
                      </div>
                    )}
                </Card>
             </section>
          </div>

          <aside className="space-y-8">
             <div>
               <Card className="p-10 border-0 shadow-2xl shadow-gray-100 bg-white rounded-[48px] sticky top-24">
                  <h3 className="text-xl font-black text-gray-900 mb-10 tracking-tight flex items-center justify-between">
                    Snapshot
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                  </h3>
                  <div className="space-y-8">
                     {[
                       { icon: Users, label: 'Team Size', value: company.team_size || 'N/A', color: 'indigo' },
                       { icon: Briefcase, label: 'Industry', value: company.industry || 'Manufacturing', color: 'emerald' },
                       { icon: MapPin, label: 'Headquarters', value: company.location, color: 'amber' }
                     ].map((stat, i) => (
                       <div 
                         key={i} 
                         className="flex items-center gap-5 group"
                       >
                          <div className={`w-14 h-14 rounded-[20px] bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                            <stat.icon className="w-7 h-7" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{stat.label}</span>
                            <span className="font-black text-gray-900 text-lg leading-none">{stat.value}</span>
                          </div>
                       </div>
                     ))}
                  </div>
                  
                  <div className="mt-12 pt-10 border-t border-gray-100 space-y-4">
                      {company.website && (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 transition-all font-black text-gray-600 text-xs uppercase tracking-widest shadow-sm"
                          >
                              <span className="flex items-center gap-3"><Globe className="w-5 h-5" /> Visit Website</span>
                              <ExternalLink className="w-5 h-5" />
                          </a>
                      )}
                      <Card className="p-6 bg-indigo-600 text-white rounded-[32px] border-0 shadow-xl shadow-indigo-200 mt-8">
                         <div className="flex items-center gap-3 mb-4">
                           <Zap className="w-6 h-6 fill-white" />
                           <span className="font-black text-[10px] uppercase tracking-widest">Hiring Alert</span>
                         </div>
                         <p className="text-sm font-bold leading-relaxed mb-6 opacity-90">Get notified immediately when {company.name} posts new opportunities.</p>
                         <Button className="w-full h-12 rounded-2xl bg-white text-indigo-600 font-black hover:bg-gray-100 border-0 shadow-lg text-[10px] uppercase tracking-widest">Follow Company</Button>
                      </Card>
                  </div>
               </Card>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
