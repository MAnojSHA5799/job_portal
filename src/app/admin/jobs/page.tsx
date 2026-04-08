"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Check, 
  X, 
  Zap, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const mockJobs = [
  { id: 1, title: 'Senior Frontend Engineer', company: 'TechCorp', source: 'Indeed', seoScore: 92, status: 'pending' },
  { id: 2, title: 'Product Designer', company: 'Creative Labs', source: 'LinkedIn', seoScore: 78, status: 'pending' },
  { id: 3, title: 'Fullstack Developer', company: 'StartupX', source: 'Indeed', seoScore: 65, status: 'pending' },
  { id: 4, title: 'Backend Lead', company: 'Data Systems', source: 'Glassdoor', seoScore: 88, status: 'approved' },
  { id: 5, title: 'Marketing Manager', company: 'Global Brand', source: 'LinkedIn', seoScore: 45, status: 'rejected' },
];

export default function JobsQueue() {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs Queue</h1>
          <p className="text-gray-500">Manage, review, and optimize scraped job postings.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button size="sm">
                <ArrowUpRight className="mr-2 h-4 w-4" /> Export CSV
            </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search job title, company..." className="pl-10 h-9 bg-white" />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Showing 1-10 of 1,284 jobs</span>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SEO Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                            {job.title}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">ID: #JOB-{job.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{job.company}</td>
                  <td className="px-6 py-4">
                     <Badge variant="info" className="font-medium text-[10px]">{job.source}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getScoreColor(job.seoScore)}>
                        {job.seoScore}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 transition-all shadow-sm"
                            title="Approve"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all shadow-sm"
                            title="Reject"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="h-8 px-3 relative overflow-hidden group shadow-md shadow-primary/20"
                            title="AI Fix"
                        >
                            <Zap className="h-3 w-3 mr-1 fill-white animate-pulse" /> AI Fix
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                        </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <Button variant="ghost" size="sm" className="text-gray-500">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-1">
                {[1, 2, 3].map((page) => (
                    <button 
                        key={page} 
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${page === 1 ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                        {page}
                    </button>
                ))}
                <span className="text-gray-400 px-1 text-xs">...</span>
                <button className="w-8 h-8 rounded text-xs font-bold text-gray-500 hover:bg-gray-100">128</button>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-500">
                Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </Card>
    </div>
  );
}


