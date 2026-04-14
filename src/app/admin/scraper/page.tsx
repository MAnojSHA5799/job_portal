"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Play, 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCcw,
  Zap,
  Globe,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Briefcase,
  AlertTriangle,
  Search,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  Check
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
import { motion, AnimatePresence } from 'framer-motion';

interface ScraperLog {
  id: string;
  status: 'running' | 'completed' | 'failed';
  jobs_found: number;
  error_message: string;
  duration?: number;
  created_at: string;
}

const STATUS_COLORS = {
  completed: '#10b981', // Emerald 500
  failed: '#f43f5e',    // Rose 500
  running: '#f59e0b',   // Amber 500
};

export default function ScraperManager() {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); 
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

  const handleTriggerScraper = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/scraper', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchLogs();
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

  return (
    <div className="space-y-8 pb-12 bg-gray-50/30 min-h-screen p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scraper Status</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm font-medium">Last Updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
        <Button 
          size="lg" 
          onClick={handleTriggerScraper}
          disabled={triggering}
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all font-bold gap-2"
        >
          {triggering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
          Run Global Scrape
        </Button>
      </div>

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
            {/* Dedicated container for Chart + Centered Text */}
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
            
            {/* Legend Section */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <div className="flex items-center gap-2 h-11 px-4 bg-white rounded-xl shadow-sm shadow-gray-200/50 text-sm font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4" />
            <span>Apr 08 - Apr 14</span>
          </div>
        </div>
        <Button variant="ghost" className="text-indigo-600 font-bold text-sm hover:bg-indigo-50" onClick={() => { setSearchQuery(''); setStatusFilter('All Status'); }}>
          Clear Filters
        </Button>
      </div>

      <Card className="border-none shadow-sm shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-gray-400 animate-pulse font-medium">Crunching history data...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/40 border-b border-indigo-50">
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Run ID</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Source / Target</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Started At</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Duration</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Jobs Found</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest">Error (if any)</th>
                  <th className="px-8 py-4 text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-indigo-600 cursor-pointer">
                          #SR-{log.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">Auto • Daily</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                          {log.error_message?.includes('LinkedIn') ? 'IN' : 'GL'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-gray-900">{log.error_message?.includes('LinkedIn') ? 'LinkedIn Careers' : 'Global Discovery'}</span>
                          <span className="text-[10px] font-medium text-gray-400 truncate max-w-[120px]">https://career-portals.net</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex flex-col">
                         <span className="text-[12px] font-black text-gray-700">{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                         <span className="text-[10px] font-bold text-gray-400">{new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex items-center gap-1.5 text-gray-600">
                         <Clock className="h-3.5 w-3.5 text-gray-400" />
                         <span className="text-[12px] font-black">{formatDuration(log.duration)}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[12px] font-black">
                         {log.jobs_found}
                       </div>
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
                    <td className="px-8 py-5">
                       <span className="text-[11px] font-medium text-gray-400 max-w-[150px] line-clamp-1" title={log.error_message || '-'}>
                         {log.error_message || '-'}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => {
                            const details = `Run ID: ${log.id}\nStatus: ${log.status}\nJobs Found: ${log.jobs_found}\nDuration: ${formatDuration(log.duration)}\nError: ${log.error_message || 'None'}`;
                            alert(details);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Download className="h-4 w-4" />
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
