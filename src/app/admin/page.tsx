"use client";

import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const data = [
  { name: 'Mon', jobs: 40 },
  { name: 'Tue', jobs: 30 },
  { name: 'Wed', jobs: 55 },
  { name: 'Thu', jobs: 45 },
  { name: 'Fri', jobs: 70 },
  { name: 'Sat', jobs: 20 },
  { name: 'Sun', jobs: 10 },
];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState([
    { label: 'Total Jobs', value: '...', icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10', trend: '+12.5%' },
    { label: 'Pending Jobs', value: '...', icon: Clock, color: 'text-accent', bg: 'bg-accent/10', trend: '-5.2%' },
    { label: 'Approved Jobs', value: '...', icon: CheckCircle, color: 'text-secondary', bg: 'bg-secondary/10', trend: '+8.1%' },
    { label: 'Failed Scrapes', value: '...', icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', trend: '+2.4%' },
  ]);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      const getCount = async (table: string, filter?: object) => {
          let query = supabase.from(table).select('*', { count: 'exact', head: true });
          if (filter) query = query.match(filter);
          const { count } = await query;
          return count || 0;
      };

      const [total, pending, approved, failed] = await Promise.all([
          getCount('jobs'),
          getCount('jobs', { is_approved: false }),
          getCount('jobs', { is_approved: true }),
          getCount('scraper_logs', { status: 'failed' })
      ]);

      setStats([
        { label: 'Total Jobs', value: total.toLocaleString(), icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10', trend: '+12.5%' },
        { label: 'Pending Jobs', value: pending.toLocaleString(), icon: Clock, color: 'text-accent', bg: 'bg-accent/10', trend: '-5.2%' },
        { label: 'Approved Jobs', value: approved.toLocaleString(), icon: CheckCircle, color: 'text-secondary', bg: 'bg-secondary/10', trend: '+8.1%' },
        { label: 'Failed Scrapes', value: failed.toLocaleString(), icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', trend: '+2.4%' },
      ]);
    };

    fetchStats();
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back, Admin! Here's what's happening today.</p>
        </div>
        <Button size="sm" className="hidden sm:flex">
          <ArrowUpRight className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                stat.trend.startsWith('+') ? "text-secondary bg-secondary/10" : "text-danger bg-danger/10"
              )}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Job Posting Trends</h3>
            <select className="text-sm bg-gray-50 border-0 rounded-md px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="jobs" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorJobs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {i + 1}
                  </div>
                  {i < 4 && <div className="absolute top-8 left-4 w-0.5 h-6 bg-gray-100 -ml-[1px]"></div>}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {i % 2 === 0 ? "New scraper run complete" : "Job approved: Frontend Engineer"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-6 text-primary text-xs font-bold">
            View All Activity
          </Button>
        </Card>
      </div>
    </div>
  );
}

