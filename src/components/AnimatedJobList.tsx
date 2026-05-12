"use client";

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { MapPin, Briefcase } from 'lucide-react';
import { ApplyButton } from '@/components/ApplyButton';

interface AnimatedJobListProps {
  jobs: any[];
  cityName: string;
}

export const AnimatedJobList = ({ jobs, cityName }: AnimatedJobListProps) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div 
        className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100"
      >
         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <MapPin className="w-10 h-10" />
         </div>
         <h3 className="text-2xl font-black text-gray-900 mb-2">No jobs in {cityName} yet</h3>
         <p className="text-gray-500 font-medium">Try searching in nearby cities or different categories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-gray-900 px-2 flex items-center gap-3">
        Job Listings in {cityName}
        <Badge className="bg-emerald-50 text-emerald-600 border-0">{jobs.length} Active</Badge>
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {jobs.map((job, index) => (
          <div
            key={job.id}
          >
            <Card className="p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all bg-white group rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-0 group-hover:h-full bg-indigo-600 transition-all duration-300" />
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white flex items-center justify-center text-3xl font-black text-indigo-600 border border-gray-50 transition-all shrink-0 overflow-hidden shadow-sm p-2 group-hover:border-indigo-100">
                  {job.companies?.logo_url ? (
                    <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                  ) : (
                    job.companies?.name?.charAt(0) || 'G'
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      <a href={`/jobs/${job.url_slug || job.id}`}>{job.title}</a>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Briefcase className="w-3 h-3" /> {job.companies?.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-indigo-600" /> {job.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <Badge className="bg-emerald-50 text-emerald-600 border-0 font-bold text-[10px] px-4 py-1.5 rounded-lg">{job.salary_range || 'Competitive Pay'}</Badge>
                    <Badge className="bg-indigo-50 text-indigo-600 border-0 font-bold text-[10px] px-4 py-1.5 rounded-lg">{job.job_type}</Badge>
                    <Badge className="bg-amber-50 text-amber-600 border-0 font-bold text-[10px] px-4 py-1.5 rounded-lg">{job.experience_level}</Badge>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                  <a href={`/jobs/${job.url_slug || job.id}`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full md:w-auto h-12 px-8 rounded-2xl font-bold border-gray-100 hover:border-indigo-600 hover:text-indigo-600 transition-all text-xs">
                        Quick View
                    </Button>
                  </a>
                  <ApplyButton 
                    jobId={job.id}
                    jobTitle={job.title}
                    companyId={job.companies?.id}
                    companyName={job.companies?.name}
                    applyLink={job.apply_link || '#'}
                    className="flex-1 md:flex-none h-12 text-xs px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold"
                  />
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
