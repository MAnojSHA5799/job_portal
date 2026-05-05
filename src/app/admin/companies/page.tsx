"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Plus, 
  Search, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Save,
  Loader2,
  Trash2,
  ExternalLink,
  Edit3,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  location: string | null;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  career_page_url?: string | null;
  description: string | null;
  active_jobs?: number;
}

const INDUSTRY_COLORS: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  'Technology': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: 'text-indigo-500' },
  'Fintech': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-500' },
  'Healthcare': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: 'text-rose-500' },
  'E-commerce': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: 'text-amber-500' },
  'Social Media': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: 'text-blue-500' },
  'Entertainment': { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', icon: 'text-violet-500' },
  'Default': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: 'text-gray-500' }
};

const getIndustryStyles = (industry: string | null) => {
  return INDUSTRY_COLORS[industry as keyof typeof INDUSTRY_COLORS] || INDUSTRY_COLORS['Default'];
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function CompaniesManagement() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (companiesError) throw companiesError;

      const { data: jobCounts, error: jobsError } = await supabase
        .from('jobs')
        .select('company_id');

      if (jobsError) throw jobsError;

      const countsMap: Record<string, number> = {};
      jobCounts?.forEach(job => {
        countsMap[job.company_id] = (countsMap[job.company_id] || 0) + 1;
      });

      const processedCompanies = companiesData.map(company => ({
        ...company,
        active_jobs: countsMap[company.id] || 0
      }));

      setCompanies(processedCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? All associated jobs may also be affected.')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchCompanies();
    } catch (error: any) {
      alert('Error deleting company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 p-6 bg-gray-50/30 min-h-screen">
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter">
            Admin Dashboard
          </Badge>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Company Management</h1>
          <p className="text-gray-500 font-medium max-w-xl">Configure company profiles, brand assets, and track job distribution across your ecosystem.</p>
        </div>
        <Button onClick={() => router.push('/admin/companies/new')} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 transition-all font-bold rounded-2xl">
          <Plus className="mr-2 h-5 w-5" /> Add New Company
        </Button>
      </div>


      {/* Enhanced Tool Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4 px-2">
        <div className="relative max-w-md w-full group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by company name, industry, or location..." 
              className="pl-12 h-12 bg-white border-none shadow-xl shadow-gray-200/40 rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-semibold" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-6">
            <div className="px-5 py-2.5 bg-white rounded-2xl shadow-lg shadow-gray-200/40 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-gray-500 uppercase tracking-[0.1em] whitespace-nowrap">
                Total Companies: <span className="text-indigo-600 ml-1">{companies.length}</span>
              </span>
            </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {loading && companies.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Architecting Dashboard...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredCompanies.map((company) => {
              const styles = getIndustryStyles(company.industry);
              return (
              <motion.div
                key={company.id}
                layout
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group h-full"
              >
                <Card className="p-6 border-none shadow-xl shadow-gray-200/50 rounded-[2rem] bg-white h-full flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50/50 transition-colors duration-500" />
                  
                  <div className="relative z-10 overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg transition-all duration-500 group-hover:rotate-6",
                            styles.bg
                          )}>
                              {company.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className={cn("text-3xl font-black", styles.text)}>
                                  {company.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                          </div>
                          <div className="flex gap-1.5 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => router.push(`/admin/companies/${company.id}`)}
                             >
                                <Eye className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => router.push(`/admin/companies/${company.id}/edit`)}
                             >
                                <Edit3 className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                onClick={() => handleDelete(company.id)}
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                      </div>
                      
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {company.name}
                           </h3>
                           <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-50 shrink-0" />
                        </div>
                        <Badge className={cn("px-2 py-0.5 uppercase text-[8px] font-black tracking-widest rounded-full border shadow-sm", styles.bg, styles.text, styles.border)}>
                          {company.industry || 'Technology'}
                        </Badge>
                      </div>

                      <div className="space-y-2.5 mb-3">
                          <div className="flex items-center text-[10px] font-bold text-gray-400 gap-2.5">
                              <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-indigo-500 transition-all">
                                <MapPin className="h-3 w-3" />
                              </div>
                              <span className="truncate">{company.location || 'Distributed / Remote'}</span>
                          </div>
                          <div className="flex items-center text-[10px] font-bold text-gray-400 gap-2.5">
                              <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-indigo-500 transition-all">
                                <Briefcase className="h-3 w-3" />
                              </div>
                              <span className="text-gray-900 font-black">{company.active_jobs}</span> Active Positions
                          </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2 font-medium">
                          {company.description || "Edit profile to add a synopsis of mission."}
                        </p>
                      </div>
                  </div>

                   <div className="flex gap-3 mt-6 relative z-10">
                       <Button 
                         variant="outline" 
                         className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-500 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all shadow-sm"
                         onClick={() => router.push(`/admin/companies/${company.id}/edit`)}
                       >
                         Edit Profile
                       </Button>
                       <Button 
                         variant="outline" 
                         className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-500 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all shadow-sm"
                         onClick={() => router.push(`/admin/companies/${company.id}`)}
                       >
                         View Jobs
                       </Button>
                  </div>
                </Card>
              </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Premium Pagination */}
      <div className="flex items-center justify-between pt-12 border-t border-gray-100">
         <Button variant="ghost" size="sm" className="h-10 px-6 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white hover:shadow-sm">
            <ChevronLeft className="mr-3 h-4 w-4" /> Previous
         </Button>
         <div className="flex gap-3">
            {[1].map(p => (
                <button key={p} className="w-10 h-10 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 flex items-center justify-center">
                    {p}
                </button>
            ))}
         </div>
         <Button variant="ghost" size="sm" className="h-10 px-6 text-indigo-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white hover:shadow-sm">
             Next <ChevronRight className="ml-3 h-4 w-4" />
         </Button>
      </div>
    </div>
  );
}
