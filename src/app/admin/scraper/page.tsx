"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Play, 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Zap,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Briefcase,
  Search,
  Download,
  Calendar,
  Building2,
  Filter,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ScraperLog {
  id: string;
  status: 'running' | 'completed' | 'failed';
  jobs_found: number;
  error_message: string;
  duration?: number;
  created_at: string;
  company_id?: string;
}

interface CompanyStat {
  id: string;
  name: string;
  website?: string;
  total_jobs: number;
  last_scraped: string;
}

const STATUS_COLORS = {
  completed: '#10b981', // Emerald 500
  failed: '#f43f5e',    // Rose 500
  running: '#f59e0b',   // Amber 500
};

export default function ScraperManager() {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeTab, setActiveTab] = useState<'logs' | 'companies'>('companies');
  
  // Pagination State
  const [logsPage, setLogsPage] = useState(1);
  const [companiesPage, setCompaniesPage] = useState(1);
  const itemsPerPage = 10;

  // Scraper Filters
  const [showFilters, setShowFilters] = useState(false);
  const [scrapeFilters, setScrapeFilters] = useState({
    jobType: 'All',
    jobAge: 'Any',
    target: 'All Data'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Logs
      const { data: logsData } = await supabase
        .from('scraper_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsData) setLogs(logsData);

      // Fetch Companies and Jobs
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, website');

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('company_id, created_at');

      if (companiesData && jobsData) {
        const jobCounts = jobsData.reduce((acc: any, job: any) => {
          if (!acc[job.company_id]) {
            acc[job.company_id] = { count: 0, latest: job.created_at };
          }
          acc[job.company_id].count++;
          if (new Date(job.created_at) > new Date(acc[job.company_id].latest)) {
            acc[job.company_id].latest = job.created_at;
          }
          return acc;
        }, {});

        const stats = companiesData.map(c => ({
          id: c.id,
          name: c.name,
          website: c.website,
          total_jobs: jobCounts[c.id]?.count || 0,
          last_scraped: jobCounts[c.id]?.latest || null
        })).sort((a, b) => b.total_jobs - a.total_jobs);

        setCompanyStats(stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  // Calculate Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const completed = logs.filter(l => l.status === 'completed').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const inProgress = logs.filter(l => l.status === 'running').length;
    
    const completedLogs = logs.filter(l => l.status === 'completed' && l.duration);
    const avgDuration = completedLogs.length > 0 
      ? Math.round(completedLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0) / completedLogs.length)
      : 0;

    return { total, completed, failed, inProgress, avgDuration };
  }, [logs]);

  // Chart Data: Last 7 Days
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayLogs = logs.filter(l => l.created_at.startsWith(date));
      return {
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: dayLogs.filter(l => l.status === 'completed').length,
        failed: dayLogs.filter(l => l.status === 'failed').length,
        inProgress: dayLogs.filter(l => l.status === 'running').length,
      };
    });
  }, [logs]);

  const pieData = [
    { name: 'Completed', value: stats.completed, color: STATUS_COLORS.completed },
    { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS.running },
    { name: 'Failed', value: stats.failed, color: STATUS_COLORS.failed },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (log.error_message || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || log.status === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  const paginatedLogs = useMemo(() => {
    const from = (logsPage - 1) * itemsPerPage;
    const to = from + itemsPerPage;
    return filteredLogs.slice(from, to);
  }, [filteredLogs, logsPage]);

  const filteredCompanies = useMemo(() => {
    return companyStats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [companyStats, searchQuery]);

  const paginatedCompanies = useMemo(() => {
    const from = (companiesPage - 1) * itemsPerPage;
    const to = from + itemsPerPage;
    return filteredCompanies.slice(from, to);
  }, [filteredCompanies, companiesPage]);

  const handleTriggerScraper = async () => {
    setTriggering(true);
    setShowFilters(false);
    try {
      const response = await fetch('/api/scraper', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: scrapeFilters })
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
        alert('Scraper initiated with selected filters!');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error triggering scraper: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getCompanyByUrl = (url: string) => {
    if (!url) return null;
    const cleanDomain = url.replace('https://', '').replace('http://', '').split('/')[0].toLowerCase().replace('www.', '').replace(/[^a-z0-9]/g, '');
    
    return companyStats.find(c => {
      const cleanName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanWebsite = c.website?.replace('https://', '').replace('http://', '').split('/')[0].toLowerCase().replace('www.', '').replace(/[^a-z0-9]/g, '');
      
      return (cleanWebsite && (cleanDomain.includes(cleanWebsite) || cleanWebsite.includes(cleanDomain))) || 
             (cleanName && (cleanDomain.includes(cleanName) || cleanName.includes(cleanDomain)));
    });
  };

  const handleCleanupStaleLogs = async () => {
    if (!confirm('Are you sure you want to clear stuck runs? All "In Progress" logs older than 1 hour will be marked as Failed.')) return;
    
    try {
      setTriggering(true);
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      
      const { error } = await supabase
        .from('scraper_logs')
        .update({ 
          status: 'failed', 
          error_message: 'Terminated: System detected this run was stuck or orphaned.' 
        })
        .eq('status', 'running')
        .lt('created_at', oneHourAgo);

      if (error) throw error;
      fetchData();
      alert('Stuck runs have been cleared.');
    } catch (error: any) {
      alert('Error clearing logs: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 bg-gray-50/30 min-h-screen p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scraper Hub</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm font-medium">Manage companies, trigger scrapes and monitor logs.</p>
          </div>
        </div>
        
      </div>

      {stats.inProgress > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between shadow-sm shadow-orange-100/20"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-900">Active Scraper Run Detected</p>
              <p className="text-xs text-orange-600 font-medium">There are currently {stats.inProgress} runs marked as in progress. If this seems stuck, you can clear them.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCleanupStaleLogs}
            disabled={triggering}
            className="border-orange-200 text-orange-700 hover:bg-orange-100 font-bold"
          >
            Clear Stuck Runs
          </Button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('companies')}
          className={cn("pb-4 text-sm font-bold border-b-2 transition-colors", activeTab === 'companies' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Data
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={cn("pb-4 text-sm font-bold border-b-2 transition-colors", activeTab === 'logs' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Scraper Logs
          </div>
        </button>
      </div>

      {activeTab === 'companies' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="relative max-w-md w-full group">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                placeholder="Search companies..." 
                className="pl-11 h-11 bg-white border-none shadow-sm shadow-gray-200/50 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCompaniesPage(1);
                }}
              />
            </div>
          </div>

          <Card className="border-none shadow-sm shadow-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              {loading && companyStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-gray-400 animate-pulse font-medium">Crunching company data...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-indigo-50/40 border-b border-indigo-50">
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Company Name</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Total Scraped Jobs</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Last Scraping Run</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {paginatedCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-indigo-50/20 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <span className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {company.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <Link href={`/admin/companies/${company.id}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[13px] font-black tracking-tight cursor-pointer transition-colors">
                              <Briefcase className="w-4 h-4 text-emerald-500/70" />
                              {company.total_jobs} Jobs
                            </div>
                          </Link>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                             <span className="text-[12px] font-black text-gray-700">
                               {company.last_scraped ? new Date(company.last_scraped).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                             </span>
                             {company.last_scraped && (
                               <span className="text-[10px] font-bold text-gray-400">
                                 {new Date(company.last_scraped).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                               </span>
                               
                             )}
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Link href={`/admin/jobs?search=${encodeURIComponent(company.name)}`}>
                            <Button variant="ghost" className="h-9 px-4 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 shadow-sm shadow-indigo-100/20 border border-indigo-50">
                              <Eye className="h-4 w-4 mr-2" /> View Jobs
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filteredCompanies.length === 0 && !loading && (
                       <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium text-sm">
                            No companies found. Try a different search.
                          </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredCompanies.length > itemsPerPage && (
              <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-gray-50/30">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Showing <span className="text-gray-900">{(companiesPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(companiesPage * itemsPerPage, filteredCompanies.length)}</span> of <span className="text-gray-900">{filteredCompanies.length}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={companiesPage === 1}
                    onClick={() => setCompaniesPage(prev => prev - 1)}
                    className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={companiesPage >= Math.ceil(filteredCompanies.length / itemsPerPage)}
                    onClick={() => setCompaniesPage(prev => prev + 1)}
                    className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Total Scraper Runs', value: stats.total, trend: '+ 12.5%', icon: History, color: 'bg-indigo-50 text-indigo-600', trendColor: 'text-emerald-500' },
              { title: 'Completed', value: stats.completed, trend: '75.0%', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', trendColor: 'text-emerald-500' },
              { title: 'In Progress', value: stats.inProgress, trend: '6.3%', icon: Clock, color: 'bg-orange-50 text-orange-600', trendColor: 'text-orange-500' },
              { title: 'Failed', value: stats.failed, trend: '3.1%', icon: XCircle, color: 'bg-rose-50 text-rose-600', trendColor: 'text-rose-500' },
              { title: 'Avg. Duration', value: formatDuration(stats.avgDuration), trend: '- 18s faster', icon: Zap, color: 'bg-purple-50 text-purple-600', trendColor: 'text-emerald-500' },
            ].map((item, idx) => (
              <Card key={idx} className="p-5 border-none shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 rounded-lg", item.color)}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.title}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{item.value}</h3>
                      <div className={cn("flex items-center text-[10px] font-bold mt-1", item.trendColor)}>
                        {item.trend.includes('+') ? <TrendingUp className="h-3 w-3 mr-1" /> : item.trend.includes('-') ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                        {item.trend}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10" />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 border-none shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-900">Scraper Activity <span className="text-sm font-medium text-gray-400 ml-2">(Last 7 Days)</span></h3>
                <div className="flex items-center gap-4">
                  {['Completed', 'Failed', 'In Progress'].map(label => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[label.toLowerCase().replace(' ', '') as keyof typeof STATUS_COLORS] }}></span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={STATUS_COLORS.completed} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={STATUS_COLORS.completed} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="completed" stroke={STATUS_COLORS.completed} fillOpacity={1} fill="url(#colorComp)" strokeWidth={3} />
                    <Area type="monotone" dataKey="failed" stroke={STATUS_COLORS.failed} fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="inProgress" stroke={STATUS_COLORS.running} fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-sm flex flex-col h-full">
              <h3 className="text-lg font-bold text-gray-900 mb-8">Status Distribution</h3>
              <div className="flex-1 flex flex-col">
                <div className="relative h-[240px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-900 leading-none block">{stats.total}</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Runs</p>
                  </div>
                </div>
                
                <div className="mt-8 space-y-3">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900">{item.value}</span>
                        <span className="text-[10px] font-bold text-gray-400 ml-2">({stats.total > 0 ? Math.round(item.value / stats.total * 100) : 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="flex flex-1 items-center gap-4 max-w-3xl">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  placeholder="Search by run ID or error..." 
                  className="pl-11 h-11 bg-white border-none shadow-sm shadow-gray-200/50 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setLogsPage(1);
                  }}
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-4 rounded-xl border-none bg-white shadow-sm shadow-gray-200/50 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 min-w-[140px]"
              >
                <option>All Status</option>
                <option>Completed</option>
                <option>Failed</option>
                <option>In Progress</option>
              </select>
            </div>
            <Button variant="ghost" className="text-indigo-600 font-bold text-sm hover:bg-indigo-50" onClick={() => { setSearchQuery(''); setStatusFilter('All Status'); setLogsPage(1); }}>
              Clear Filters
            </Button>
          </div>

          <Card className="border-none shadow-sm shadow-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              {loading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-gray-400 animate-pulse font-medium">Crunching history data...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-indigo-50/40 border-b border-indigo-50">
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Run ID</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Source</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Started At</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Jobs Found</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-indigo-50/20 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-indigo-600">
                              #SR-{log.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 max-w-[200px]">
                           <div className="flex flex-col">
                             <span className="text-[11px] font-bold text-gray-700 truncate" title={log.error_message}>
                               {log.error_message?.replace('https://', '').replace('http://', '').split('/')[0] || 'Manual Scrape'}
                             </span>
                             <span className="text-[10px] text-gray-400 truncate opacity-70">
                               {log.error_message || 'No details available'}
                             </span>
                           </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="text-[12px] font-black text-gray-700">{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                             <span className="text-[10px] font-bold text-gray-400">{new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           {(() => {
                             const companyId = log.company_id || getCompanyByUrl(log.error_message)?.id;
                             const domain = log.error_message?.replace('https://', '').replace('http://', '').split('/')[0] || '';
                             const targetUrl = companyId 
                               ? `/admin/companies/${companyId}` 
                               : `?search=${encodeURIComponent(domain)}`;
                             
                             return (
                               <Link href={targetUrl} onClick={() => !companyId && setActiveTab('companies')} className="group/count">
                                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[13px] font-black tracking-tight cursor-pointer transition-colors">
                                   <Briefcase className="w-4 h-4 text-emerald-500/70" />
                                   {log.jobs_found} Jobs
                                 </div>
                               </Link>
                             );
                           })()}
                        </td>
                        <td className="px-8 py-5">
                           <Badge className={cn(
                             "font-black text-[9px] px-2 py-0.5 shadow-none ring-1",
                             log.status === 'completed' ? "bg-emerald-50 text-emerald-600 ring-emerald-100" :
                             log.status === 'running' ? "bg-orange-50 text-orange-600 ring-orange-100" :
                             "bg-rose-50 text-rose-600 ring-rose-100"
                           )}>
                             {log.status === 'completed' ? 'Completed' : log.status === 'running' ? 'In Progress' : 'Failed'}
                           </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => {
                                const details = `Run ID: ${log.id}\nStatus: ${log.status}\nJobs Found: ${log.jobs_found}\nDuration: ${formatDuration(log.duration)}\nError: ${log.error_message || 'None'}`;
                                alert(details);
                              }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredLogs.length > itemsPerPage && (
              <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-gray-50/30">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Showing <span className="text-gray-900">{(logsPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(logsPage * itemsPerPage, filteredLogs.length)}</span> of <span className="text-gray-900">{filteredLogs.length}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage(prev => prev - 1)}
                    className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={logsPage >= Math.ceil(filteredLogs.length / itemsPerPage)}
                    onClick={() => setLogsPage(prev => prev + 1)}
                    className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
