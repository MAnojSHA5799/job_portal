"use client";

import React from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  DollarSign, 
  Search, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  BarChart, 
  PieChart, 
  Briefcase, 
  Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';

const salaryData = [
  { role: 'Frontend', avg: 145000, color: '#4F46E5' },
  { role: 'Backend', avg: 155000, color: '#4F46E5' },
  { role: 'Fullstack', avg: 150000, color: '#4F46E5' },
  { role: 'Product', avg: 135000, color: '#4F46E5' },
  { role: 'Design', avg: 125000, color: '#4F46E5' },
  { role: 'Data Sci', avg: 165000, color: '#4F46E5' },
];

const locations = [
  { city: 'San Francisco', avg: '$165k', growth: '+5.2%', trending: 'up' },
  { city: 'New York', avg: '$158k', growth: '+4.1%', trending: 'up' },
  { city: 'Austin', avg: '$135k', growth: '+8.4%', trending: 'up' },
  { city: 'Seattle', avg: '$152k', growth: '+2.1%', trending: 'up' },
  { city: 'Remote', avg: '$140k', growth: '+12.5%', trending: 'up' },
];

export default function SalaryIntelligence() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <section className="bg-gray-900 py-24 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-none">
                Salary <span className="text-primary italic">Intelligence</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-2xl leading-relaxed mb-12">
                Real-time market insights across roles, cities, and experience levels. Negotiate with confidence.
            </p>

            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row gap-2 max-w-4xl shadow-2xl">
                <div className="relative flex-1">
                    <Briefcase className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input placeholder="Job Title (e.g. Frontend)" className="bg-transparent border-0 shadow-none pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-0" />
                </div>
                <div className="hidden md:block w-[1px] h-8 bg-white/10 mx-2 self-center"></div>
                <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <Input placeholder="Location (e.g. Remote)" className="bg-transparent border-0 shadow-none pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-0" />
                </div>
                <Button size="lg" className="h-12 px-10 font-bold rounded-xl shadow-lg shadow-primary/20">Analyze Market</Button>
            </div>
        </div>
        {/* Background glow */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Roles Chart */}
            <Card className="lg:col-span-2 p-8 border-0 shadow-2xl shadow-gray-200 bg-white">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Average Salary by Role</h3>
                    <Badge variant="info">Global Stats</Badge>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={salaryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(val) => `$${val/1000}k`} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(val) => [`$${(val as number).toLocaleString()}`, 'Avg. Salary']}
                            />
                            <Bar dataKey="avg" radius={[8, 8, 0, 0]} barSize={40}>
                                {salaryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Trending Cities */}
            <Card className="p-8 border-0 shadow-lg shadow-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" /> Hot Locations
                </h3>
                <div className="space-y-6">
                    {locations.map((loc, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 group hover:border-primary/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-bold shadow-sm">
                                    {loc.city[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{loc.city}</p>
                                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{loc.growth} GROWTH</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-primary leading-none mb-1">{loc.avg}</p>
                                <p className="text-[10px] font-bold text-secondary flex items-center justify-end">
                                    <TrendingUp className="h-2 w-2 mr-1" /> TRENDING
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" className="w-full mt-8 text-primary font-black text-xs uppercase tracking-widest">
                    View Comprehensive Report <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
            </Card>
        </div>

        {/* Info Banner */}
        <section className="mt-24 bg-primary rounded-[40px] p-12 text-center relative overflow-hidden group">
            <div className="relative z-10 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 animate-bounce">
                    <Info className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Need a Personalized Benchmarking?</h2>
                <p className="text-white/70 text-lg font-medium mb-10 leading-relaxed">
                    Upload your recent offer letter (redacted) and our AI will tell you if it matches the current market value for your specific skill set.
                </p>
                <Button className="bg-white text-primary hover:bg-white/90 px-12 h-14 font-black rounded-2xl shadow-2xl shadow-black/20 text-lg">
                    Check My Offer
                </Button>
            </div>
            {/* Decorative cubicle pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 group-hover:opacity-20 transition-opacity"></div>
        </section>
      </div>
    </div>
  );
}
