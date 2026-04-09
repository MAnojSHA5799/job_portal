"use client";

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Job {
  id: string;
  title: string;
  location: string;
  is_approved: boolean;
  created_at: string;
  source_url: string;
  companies: {
    name: string;
  };
}

export default function JobsQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStatusUpdate = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_approved: approved })
        .eq('id', id);

      if (error) throw error;
      fetchJobs(); // Refresh list
    } catch (error) {
      alert('Error updating job status');
    }
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
                <Input 
                  placeholder="Search job title, company..." 
                  className="pl-10 h-9 bg-white" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Total Jobs: {jobs.length}</span>
            </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                              {job.title}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{job.companies?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{job.location}</td>
                    <td className="px-6 py-4">
                       <Badge variant={job.is_approved ? 'success' : 'warning'} className="font-medium text-[10px]">
                         {job.is_approved ? 'Approved' : 'Pending'}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          {!job.is_approved && (
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 transition-all shadow-sm"
                                title="Approve"
                                onClick={() => handleStatusUpdate(job.id, true)}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {job.is_approved && (
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all shadow-sm"
                                title="Unapprove"
                                onClick={() => handleStatusUpdate(job.id, false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                          )}
                          <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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



