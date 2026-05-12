"use client";

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, Banknote, Briefcase, Clock, Share2, 
  Flame, Zap, CheckCircle2, Building2, ChevronRight,
  TrendingUp, ShieldCheck
} from 'lucide-react';
import { ApplyButton } from '@/components/ApplyButton';
import Link from 'next/link';

interface JobDetailContentProps {
  job: any;
  relatedJobs: any[];
}

export const JobDetailContent = ({ job, relatedJobs }: JobDetailContentProps) => {
  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6 pb-20">
      {/* Main Summary Card */}
      <div>
        <Card className="p-8 border-0 shadow-xl shadow-gray-100/50 rounded-[32px] bg-white overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-600" />
           
           <div className="flex items-start gap-6 mb-8">
              <div 
                className="w-20 h-20 rounded-2xl bg-white border border-gray-50 flex items-center justify-center overflow-hidden p-2 shrink-0 shadow-sm group-hover:border-primary/20"
              >
                  {job.companies?.logo_url ? (
                      <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-primary text-3xl bg-primary/5">
                          {job.companies?.name?.charAt(0) || 'J'}
                      </div>
                  )}
              </div>
              <div className="space-y-1">
                  <h1 
                    className="text-2xl md:text-3xl font-black text-gray-900 leading-tight tracking-tight"
                  >
                    {job.title}
                  </h1>
                  <p 
                    className="text-lg text-indigo-600 font-bold"
                  >
                    {job.companies?.name}
                  </p>
              </div>
           </div>

           <div 
             className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
           >
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Location</p>
                    <p className="text-sm font-bold">{job.location}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Banknote className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Salary</p>
                    <p className="text-sm font-bold">{job.salary_range || 'Not disclosed'}</p>
                  </div>
              </div>
           </div>

           <div 
             className="flex flex-wrap gap-2 mb-10"
           >
              {[
                { icon: Clock, label: job.job_type || 'Full Time', color: 'indigo' },
                { icon: Briefcase, label: job.experience_level || 'Any experience', color: 'amber' },
                { icon: ShieldCheck, label: 'Verified Listing', color: 'emerald' }
              ].map((badge, i) => (
                <div key={i} className={`flex items-center gap-2 bg-${badge.color}-50 px-4 py-2 rounded-xl text-xs font-black text-${badge.color}-600 border border-${badge.color}-100/50`}>
                  <badge.icon className="w-4 h-4" /> {badge.label}
                </div>
              ))}
           </div>

           <div 
             className="flex gap-4"
           >
              <ApplyButton 
                  jobId={job.id}
                  jobTitle={job.title}
                  companyId={job.companies?.id}
                  companyName={job.companies?.name}
                  applyLink={job.apply_link || '#'}
                  className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl border-0 shadow-lg shadow-primary/20 text-sm uppercase tracking-widest"
              />
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-gray-100 text-gray-600 font-bold flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all">
                  <Share2 className="w-5 h-5" />
              </Button>
           </div>
        </Card>
      </div>

      {/* Highlights & Details */}
      <div
        className="space-y-6"
      >
        <div className="bg-[#f0f7ff] border border-[#dceaff] rounded-[32px] p-8">
           <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
             <TrendingUp className="w-6 h-6 text-primary" /> Why you should apply
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: Flame, title: 'Urgently hiring', desc: 'Hiring for immediate joining', color: 'orange' },
                { icon: Zap, title: 'Verified Job', desc: `Verified by ${job.companies?.name}`, color: 'indigo' },
                { icon: CheckCircle2, title: 'Full Benefits', desc: 'Statutory benefits included', color: 'emerald' },
                { icon: Clock, title: 'Recent Posting', desc: `Listed on ${new Date(job.created_at).toLocaleDateString()}`, color: 'blue' }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-4"
                >
                    <div className={`p-3 bg-${item.color}-50 rounded-xl`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-500 shrink-0`} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                </div>
              ))}
           </div>
        </div>

        <Card className="p-10 border-0 shadow-xl shadow-gray-100/50 rounded-[40px] bg-white space-y-12">
           <section>
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" /> Job Description
              </h3>
              <div 
                  className="text-sm text-gray-600 leading-relaxed font-medium html-content prose prose-indigo max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
              />
           </section>

           <section className="pt-10 border-t border-gray-50">
              <h3 className="text-xl font-black text-gray-900 mb-8">Role Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {[
                    { icon: Briefcase, label: 'Department', value: job.category || 'General' },
                    { icon: ShieldCheck, label: 'Role Title', value: job.title },
                    { icon: Clock, label: 'Employment', value: job.job_type || 'Full Time' },
                    { icon: Briefcase, label: 'Experience', value: job.experience_level || 'Any' }
                  ].map((detail, i) => (
                    <div key={i} className="flex gap-4">
                        <detail.icon className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{detail.label}</p>
                            <p className="text-sm font-bold text-gray-700">{detail.value}</p>
                        </div>
                    </div>
                  ))}
              </div>
           </section>

           <section className="pt-10 border-t border-gray-50">
              <h3 className="text-xl font-black text-gray-900 mb-8">About the Employer</h3>
              <div className="bg-gray-50 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 shadow-sm">
                          {job.companies?.logo_url ? (
                              <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                          ) : (
                              <Building2 className="w-6 h-6 text-gray-400" />
                          )}
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name</p>
                          <p className="text-base font-black text-indigo-600">{job.companies?.name}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headquarters</p>
                          <p className="text-sm font-bold text-gray-700 leading-relaxed">{job.location}, India</p>
                      </div>
                  </div>
              </div>
           </section>

           <div className="pt-6 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 italic">Job verified by Gethyrd Compliance Team</p>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Currently Active</span>
              </div>
           </div>
        </Card>
      </div>

      {/* Related Jobs */}
      {relatedJobs && relatedJobs.length > 0 && (
        <section 
          className="pt-12 space-y-6"
        >
            <h3 className="text-xl font-black text-gray-900 px-2 flex items-center justify-between">
              Similar Opportunities
              <Link href="/jobs" className="text-sm text-primary hover:underline">View All</Link>
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {relatedJobs.map((rj, i) => (
                    <div
                      key={rj.id}
                    >
                      <Link href={`/jobs/${rj.url_slug || rj.id}`}>
                          <Card className="p-6 border-0 shadow-sm bg-white rounded-3xl hover:shadow-xl hover:shadow-indigo-50 transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden">
                              <div className="absolute top-0 left-0 h-full w-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden p-1">
                                    {rj.companies?.logo_url ? <img src={rj.companies.logo_url} className="w-full h-full object-contain" /> : <Briefcase className="w-5 h-5 text-gray-400" />}
                                 </div>
                                 <div>
                                    <h4 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{rj.title}</h4>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{rj.companies?.name} • {rj.location}</p>
                                 </div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                          </Card>
                      </Link>
                    </div>
                ))}
            </div>
        </section>
      )}
    </div>
  );
};
