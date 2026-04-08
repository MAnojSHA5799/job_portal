"use client";

import React from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Plus, 
  Search, 
  MapPin, 
  Globe, 
  MoreVertical, 
  Building2, 
  CheckCircle2, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react';

const mockCompanies = [
  { id: 1, name: 'Google', location: 'Mountain View, CA', industry: 'Technology', activeJobs: 124, logo: 'G' },
  { id: 2, name: 'Meta', location: 'Menlo Park, CA', industry: 'Social Media', activeJobs: 86, logo: 'M' },
  { id: 3, name: 'Stripe', location: 'San Francisco, CA', industry: 'Fintech', activeJobs: 42, logo: 'S' },
  { id: 4, name: 'Shopify', location: 'Ottawa, Canada', industry: 'E-commerce', activeJobs: 33, logo: 'Sh' },
  { id: 5, name: 'Netflix', location: 'Los Gatos, CA', industry: 'Entertainment', activeJobs: 19, logo: 'N' },
];

export default function CompaniesManagement() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Management</h1>
          <p className="text-gray-500">Manage company profiles, logos, and job mappings.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add New Company
        </Button>
      </div>

      <Card className="p-4 bg-gray-50/50 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search companies..." className="pl-10 h-10 bg-white" />
        </div>
        <div className="flex items-center gap-4">
            <select className="text-sm border-0 bg-transparent font-bold text-gray-500 outline-none">
                <option>All Industries</option>
                <option>Technology</option>
                <option>Fintech</option>
            </select>
            <div className="w-[1px] h-6 bg-gray-200"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total: 842</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCompanies.map((company) => (
          <Card key={company.id} className="p-6 hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden border-0 shadow-sm bg-white">
            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl font-black text-gray-900 border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    {company.logo}
                </div>
                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><MoreVertical className="h-5 w-5" /></button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                {company.name} <CheckCircle2 className="ml-2 h-4 w-4 text-secondary fill-secondary/10" />
            </h3>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{company.industry}</p>

            <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm font-medium text-gray-500 gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" /> {company.location}
                </div>
                <div className="flex items-center text-sm font-medium text-gray-500 gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" /> {company.activeJobs} Active Positions
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 font-bold text-xs">Edit Profile</Button>
                <Button variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-primary"><Globe className="h-5 w-5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
         <Button variant="ghost" size="sm" className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
         </Button>
         <div className="flex gap-1">
            {[1, 2, 3].map(p => (
                <button key={p} className={`w-8 h-8 rounded text-xs font-bold ${p === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}>
                    {p}
                </button>
            ))}
         </div>
         <Button variant="ghost" size="sm" className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
             Next <ChevronRight className="ml-2 h-4 w-4" />
         </Button>
      </div>
    </div>
  );
}
