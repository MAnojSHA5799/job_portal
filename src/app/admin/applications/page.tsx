"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [currentPage, searchQuery]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('status');
      
      if (error) throw error;
      
      const counts = (data || []).reduce((acc: any, curr: any) => {
        acc.total++;
        if (curr.status === 'pending') acc.pending++;
        if (curr.status === 'reviewed') acc.reviewed++;
        if (curr.status === 'accepted') acc.shortlisted++;
        return acc;
      }, { total: 0, pending: 0, reviewed: 0, shortlisted: 0 });
      
      setStats(counts);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('job_applications')
        .select('*', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`user_name.ilike.%${searchQuery}%,user_email.ilike.%${searchQuery}%,job_title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setApplications(data || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError(error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setApplications(applications.map(app => app.id === id ? { ...app, status } : app));
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const filteredApplications = applications; // Already filtered server-side now

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            Job Applications
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage and track all candidate submissions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search candidates, jobs..."
              className="pl-10 pr-4 h-11 w-64 rounded-xl border-0 bg-white shadow-sm font-medium text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <Button variant="outline" className="rounded-xl h-11 gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Applications', value: stats.total, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-600' },
          { label: 'Reviewed', value: stats.reviewed, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-emerald-50 text-emerald-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-0 shadow-sm bg-white rounded-[24px]">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <p className={cn("text-3xl font-black", stat.color.split(' ')[1])}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Applications List */}
      <Card className="border-0 shadow-xl shadow-gray-100 bg-white rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Applied On</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode='popLayout'>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8">
                        <div className="h-12 bg-gray-50 rounded-2xl w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-red-600 font-bold">Error: {error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={fetchApplications}
                      >
                        Try Again
                      </Button>
                    </td>
                  </tr>
                ) : filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={app.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                            {app.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{app.user_name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold"><Mail className="w-3 h-3" /> {app.user_email}</span>
                              {app.user_phone && <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold"><Phone className="w-3 h-3" /> {app.user_phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-primary" /> {app.job_title}
                          </p>
                          <p className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" /> {app.company_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {new Date(app.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge 
                          variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'info'}
                          className="px-3 py-1 font-black text-[9px] uppercase tracking-wider rounded-lg"
                        >
                          {app.status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-lg hover:bg-emerald-50 hover:text-emerald-600"
                              onClick={() => updateStatus(app.id, 'accepted')}
                              title="Shortlist"
                           >
                             <CheckCircle2 className="w-4 h-4" />
                           </Button>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-lg hover:bg-danger/5 hover:text-danger"
                              onClick={() => updateStatus(app.id, 'rejected')}
                              title="Reject"
                           >
                             <XCircle className="w-4 h-4" />
                           </Button>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-lg hover:bg-primary/5 hover:text-primary"
                              title="View Profile"
                           >
                             <Eye className="w-4 h-4" />
                           </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-bold">No applications found</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalCount > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-6 border-t border-gray-50 bg-gray-50/30">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="text-gray-900">{totalCount}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Basic pagination logic: show 5 pages around current
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xs font-black transition-all",
                        currentPage === pageNum 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-white text-gray-400 hover:bg-gray-50 border border-transparent hover:border-gray-100"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
