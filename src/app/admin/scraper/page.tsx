"use client";

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Play, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Globe, 
  ExternalLink,
  Activity,
  BarChart3
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const stats = [
  { label: 'Last Run', value: '25 mins ago', icon: Clock, color: 'text-primary' },
  { label: 'Success Rate', value: '98.2%', icon: CheckCircle2, color: 'text-secondary' },
  { label: 'Total Scraped', value: '1,492', icon: Globe, color: 'text-accent' },
  { label: 'Failed URLs', value: '14', icon: AlertCircle, color: 'text-danger' },
];

const data = [
  { time: '00:00', rate: 95 },
  { time: '04:00', rate: 92 },
  { time: '08:00', rate: 98 },
  { time: '12:00', rate: 97 },
  { time: '16:00', rate: 99 },
  { time: '20:00', rate: 96 },
];

export default function ScraperStatus() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scraper Status</h1>
          <p className="text-gray-500">Monitor automated job discovery across 25+ sources.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20">
          <Play className="mr-2 h-4 w-4 fill-white" /> Re-run All Scrapers
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gray-50">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">{stat.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Success Rate Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Scrape Success Rate (24h)
             </h3>
             <Badge variant="success">Active</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[80, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="rate" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Failed URLs List */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger" /> Failed Target URLs
          </h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="group border border-gray-100 rounded-xl p-4 hover:border-danger/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-danger uppercase tracking-widest">Timeout Error</span>
                      <button className="text-gray-400 hover:text-primary"><RotateCcw className="h-3 w-3" /></button>
                  </div>
                  <p className="text-sm font-medium text-gray-600 truncate mb-1">careers.techcorp.com/jobs/dev</p>
                  <p className="text-[10px] text-gray-400 font-bold">RETRY ATTEMPT: 3 OF 5</p>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-gray-400 hover:text-danger uppercase tracking-widest">
            Clear Error Logs
          </Button>
        </Card>
      </div>
    </div>
  );
}
