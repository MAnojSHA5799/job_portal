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
  ChevronRight,
  MapPin,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

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
  }, [currentPage, searchQuery, dateRange]);

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('job_applications')
        .select('status');

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

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

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
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

  const downloadCSV = async () => {
    try {
      let query = supabase.from('job_applications').select('*');

      if (searchQuery) {
        query = query.or(`user_name.ilike.%${searchQuery}%,user_email.ilike.%${searchQuery}%,job_title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No applications found to download.");
        return;
      }

      const headers = ['Candidate Name', 'Email', 'Phone', 'Location', 'Job Title', 'Company Name', 'Applied On', 'Status'];

      const rows = data.map(app => [
        `"${(app.user_name || '').replace(/"/g, '""')}"`,
        `"${(app.user_email || '').replace(/"/g, '""')}"`,
        `"${(app.user_phone || '').replace(/"/g, '""')}"`,
        `"${(app.user_location || '').replace(/"/g, '""')}"`,
        `"${(app.job_title || '').replace(/"/g, '""')}"`,
        `"${(app.company_name || '').replace(/"/g, '""')}"`,
        `"${new Date(app.created_at).toLocaleString().replace(/"/g, '""')}"`,
        `"${(app.status || 'pending').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to download CSV');
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

        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center px-3 py-1.5 border-r border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 hidden sm:inline">From</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, start: e.target.value }));
                  setCurrentPage(1);
                }}
                className="text-sm font-semibold bg-transparent outline-none text-gray-900 w-[110px]"
              />
            </div>
            <div className="flex items-center px-3 py-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 hidden sm:inline">To</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, end: e.target.value }));
                  setCurrentPage(1);
                }}
                className="text-sm font-semibold bg-transparent outline-none text-gray-900 w-[110px]"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="hidden sm:flex h-11 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-none border-0"
            onClick={() => {
              setDateRange({
                start: new Date().toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              });
              setCurrentPage(1);
            }}
          >
            Today
          </Button>

          <Button variant="outline" className="rounded-xl h-11 gap-2" onClick={downloadCSV}>
            <Download className="w-4 h-4" /> Export CSV
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
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold"><Mail className="w-3 h-3" /> {app.user_email}</span>
                              {app.user_phone && <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold"><Phone className="w-3 h-3" /> {app.user_phone}</span>}
                              {app.user_location && <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold"><MapPin className="w-3 h-3" /> {app.user_location}</span>}
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
                            onClick={() => setSelectedApp(app)}
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

      {/* Applicant Profile Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-indigo-400"></div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                  {selectedApp.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedApp.user_name}</h2>
                  <p className="text-gray-500 font-medium text-sm flex items-center gap-1 mt-1">
                    <Briefcase className="w-3.5 h-3.5" /> Applied for {selectedApp.job_title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-gray-900 font-bold text-sm">{selectedApp.user_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-gray-900 font-bold text-sm">{selectedApp.user_phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                  <p className="text-gray-900 font-bold text-sm">{selectedApp.user_location || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</p>
                  <p className="text-gray-900 font-bold text-sm">{selectedApp.company_name}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {selectedApp.resume_url ? (
                <a
                  href={selectedApp.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-2">
                    <ExternalLink className="w-4 h-4" /> View Resume
                  </Button>
                </a>
              ) : (
                <div className="flex-1 text-center py-2 text-sm font-bold text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                  No Resume Attached
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
