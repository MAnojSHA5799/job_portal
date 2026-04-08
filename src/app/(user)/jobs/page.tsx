"use client";

import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Filter, 
  ChevronDown, 
  Star, 
  Clock, 
  DollarSign,
  Grid,
  List,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const filterCategories = [
  { name: 'Category', options: ['Engineering', 'Design', 'Marketing', 'Product Manager', 'Sales', 'Data Science'] },
  { name: 'Experience', options: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'] },
  { name: 'Job Type', options: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'] },
  { name: 'Salary Range', options: ['$50k - $80k', '$80k - $120k', '$120k - $160k', '$160k - $200k', '$200k+'] },
];

const mockJobs = [
  { id: 1, title: 'Senior Frontend Engineer', company: 'Google', location: 'Mountain View, CA', salary: '$160k - $220k', logo: 'G', type: 'Full-time', posted: '2h ago', tags: ['React', 'TypeScript', 'Tailwind'] },
  { id: 2, title: 'Lead Product Designer', company: 'Meta', location: 'Remote', salary: '$180k - $250k', logo: 'M', type: 'Remote', posted: '5h ago', tags: ['Figma', 'System Design', 'UX'] },
  { id: 3, title: 'Backend Developer', company: 'Stripe', location: 'Dublin, Ireland', salary: '€90k - €130k', logo: 'S', type: 'Full-time', posted: '1d ago', tags: ['Go', 'Kubernetes', 'Redis'] },
  { id: 4, title: 'Growth Marketer', company: 'Shopify', location: 'Ottawa, Canada', salary: '$110k - $150k', logo: 'Sh', type: 'Full-time', posted: '2d ago', tags: ['Ads', 'Analytics', 'Growth'] },
  { id: 5, title: 'Senior Data Scientist', company: 'Netflix', location: 'Los Gatos, CA', salary: '$200k - $300k', logo: 'N', type: 'Hybrid', posted: '3d ago', tags: ['Python', 'ML', 'Big Data'] },
];

export default function JobListingPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter">Browse Jobs</h1>
            <div className="bg-white p-2 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row items-center gap-2 max-w-4xl">
              <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                  <Input placeholder="Job title, keywords, or company" className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0" />
              </div>
              <div className="hidden md:block w-[1px] h-6 bg-gray-100 mx-2"></div>
              <div className="relative flex-1 w-full">
                  <MapPin className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                  <Input placeholder="Location or remote" className="border-0 shadow-none pl-12 h-11 focus-visible:ring-0" />
              </div>
              <Button className="h-11 w-full md:w-auto px-8 font-bold rounded-xl">
                  Filter Matches
              </Button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-8 shrink-0">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 flex items-center">
                    <Filter className="w-4 h-4 mr-2" /> Filters
                </h3>
                <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">Reset All</button>
            </div>

            {filterCategories.map((filter, i) => (
                <div key={i} className="space-y-4 border-b border-gray-100 pb-6">
                    <button className="flex items-center justify-between w-full text-sm font-bold text-gray-900 group">
                        {filter.name}
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="space-y-3">
                        {filter.options.map((opt, j) => (
                            <label key={j} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary/20 accent-primary" />
                                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
          </aside>

          {/* Job List */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="text-sm text-gray-500 font-medium">
                    Showing <span className="font-black text-gray-900">482</span> jobs matching your criteria
                </div>
                <div className="flex items-center gap-4">
                    <select className="text-sm border-0 bg-transparent font-bold text-gray-900 focus:ring-0 outline-none cursor-pointer">
                        <option>Newest First</option>
                        <option>Highest Salary</option>
                        <option>Relevant First</option>
                    </select>
                    <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
              {mockJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: job.id * 0.1 }}
                >
                  <Card className={`p-6 border-0 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden bg-white ${viewMode === 'list' ? 'flex flex-col md:flex-row md:items-center justify-between gap-6' : ''}`}>
                    <div className="flex items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                            {job.logo}
                        </div>
                        <div className="space-y-2">
                           <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg md:text-xl font-black text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                                  {job.title}
                              </h3>
                              {job.id <= 2 && <Badge variant="success" className="h-5 text-[10px]">NEW</Badge>}
                           </div>
                           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                              <span className="flex items-center gap-1.5">
                                 <Briefcase className="w-4 h-4" /> {job.company}
                              </span>
                              <span className="flex items-center gap-1.5">
                                 <MapPin className="w-4 h-4" /> {job.location}
                              </span>
                              <span className="flex items-center gap-1.5 text-primary">
                                 <Star className="w-4 h-4 fill-primary" /> {job.salary}
                              </span>
                           </div>
                           <div className="flex flex-wrap gap-2 pt-2">
                              {job.tags.map((tag, t) => (
                                <span key={t} className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                   {tag}
                                </span>
                              ))}
                           </div>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between gap-6 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50 ${viewMode === 'list' ? 'md:flex-col md:items-end md:justify-center' : ''}`}>
                        <div className="flex flex-col md:items-end gap-1">
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Posted {job.posted}
                            </span>
                            <span className="text-[10px] font-black text-secondary tracking-widest uppercase">Verified Employer</span>
                        </div>
                        <Button className="font-bold shadow-md shadow-primary/10 px-8 rounded-xl h-10 group-hover:bg-primary/90 transition-all">
                            Apply Now
                        </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="pt-12 text-center">
                <Button variant="outline" size="lg" className="font-bold border-2 rounded-xl px-12 hover:border-primary hover:text-primary transition-all">
                    Load More Positions
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


