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
  Eye,
  Users
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
  url_slug: string | null;
  active_jobs?: number;
  team_size?: string | null;
}

const PALETTE = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: 'text-indigo-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-500' },
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: 'text-blue-500' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: 'text-purple-500' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: 'text-amber-500' },
  { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: 'text-rose-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', icon: 'text-cyan-500' },
  { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', icon: 'text-violet-500' },
  { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', icon: 'text-teal-500' },
  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: 'text-orange-500' },
];

const getIndustryStyles = (industry: string | null) => {
  if (!industry) return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: 'text-gray-500' };
  let hash = 0;
  for (let i = 0; i < industry.length; i++) {
    hash = (hash << 5) - hash + industry.charCodeAt(i);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18
    }
  }
};

export default function CompaniesManagement() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industriesList, setIndustriesList] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (companiesError) throw companiesError;

      // Only count active (approved & non-deleted) jobs!
      const { data: jobCounts, error: jobsError } = await supabase
        .from('jobs')
        .select('company_id')
        .eq('is_approved', true)
        .eq('is_deleted', false);

      if (jobsError) throw jobsError;

      const countsMap: Record<string, number> = {};
      jobCounts?.forEach(job => {
        countsMap[job.company_id] = (countsMap[job.company_id] || 0) + 1;
      });

      const processedCompanies = (companiesData || []).map(company => ({
        ...company,
        active_jobs: countsMap[company.id] || 0
      }));

      setCompanies(processedCompanies);

      // Fetch industries list for the filter dropdown
      const { data: indData } = await supabase
        .from('industries')
        .select('name')
        .order('name', { ascending: true });

      if (indData) {
        setIndustriesList(indData.map(i => i.name));
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleFileUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadingId(id);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      await handleUpdateLogo(id, data.publicUrl);
    } catch (error: any) {
      alert('Error uploading logo: ' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

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

  const handleUpdateLogo = async (id: string, logoUrl: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ logo_url: logoUrl })
        .eq('id', id);
      
      if (error) throw error;
      
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, logo_url: logoUrl } : c));
    } catch (error: any) {
      alert('Error updating logo: ' + error.message);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleIndustryChange = (val: string) => {
    setSelectedIndustry(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('all');
    setCurrentPage(1);
  };

  const filteredCompanies = companies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      c.name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q));

    const matchesIndustry = selectedIndustry === 'all' || 
      (c.industry && c.industry.toLowerCase() === selectedIndustry.toLowerCase());

    return matchesSearch && matchesIndustry;
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaginationItems = (): (number | string)[] => {
    if (totalPages <= 1) return totalPages === 1 ? [1] : [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...-start', currentPage - 1, currentPage, currentPage + 1, '...-end', totalPages];
  };

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

      {/* Enhanced Tool Row with Search & Industry Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 px-2">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:max-w-2xl">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by company name, industry, or location..." 
              className="pl-12 pr-10 h-12 bg-white border-none shadow-xl shadow-gray-200/40 rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-semibold w-full" 
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Industry Filter Dropdown */}
          <div className="w-full sm:w-auto min-w-[200px]">
            <select
              value={selectedIndustry}
              onChange={e => handleIndustryChange(e.target.value)}
              className="w-full h-12 bg-white px-4 rounded-2xl shadow-xl shadow-gray-200/40 border-0 text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-4 focus:ring-indigo-100 transition-all"
            >
              <option value="all">All Industries</option>
              {industriesList.map((ind, idx) => (
                <option key={idx} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(searchQuery || selectedIndustry !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-4 rounded-xl border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Reset Filters
            </Button>
          )}
          <div className="px-5 py-2.5 bg-white rounded-2xl shadow-lg shadow-gray-200/40 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-gray-500 uppercase tracking-[0.1em] whitespace-nowrap">
              Companies: <span className="text-indigo-600 ml-1">{filteredCompanies.length !== companies.length ? `${filteredCompanies.length} of ${companies.length}` : companies.length}</span>
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
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[2rem] shadow-sm flex flex-col items-center justify-center space-y-3 text-center">
            <Briefcase className="w-12 h-12 text-gray-300" />
            <h3 className="text-lg font-black text-gray-800">No companies found</h3>
            <p className="text-xs text-gray-400 max-w-sm">No companies match your search or industry filter. Try clearing the filter.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-4 rounded-xl border-gray-200 text-xs font-bold mt-2"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {paginatedCompanies.map((company) => {
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
                            "w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-xl transition-all duration-500 group-hover:scale-110 bg-white p-1",
                            styles.bg
                          )}>
                              {company.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
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
                                title="View Company Details"
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => router.push(`/admin/companies/${company.id}`)}
                             >
                                <Eye className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                title="View Company Jobs"
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => router.push(`/admin/jobs?company=${company.id}`)}
                             >
                                <Briefcase className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Edit Company"
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                onClick={() => router.push(`/admin/companies/${company.id}/edit`)}
                             >
                                <Edit3 className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Delete Company"
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
                        <Badge className={cn("px-2.5 py-0.5 uppercase text-[9px] font-black tracking-widest rounded-full border shadow-sm", styles.bg, styles.text, styles.border)}>
                          {company.industry || 'General'}
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
                              <button 
                                onClick={() => router.push(`/admin/jobs?company=${company.id}`)}
                                className="text-gray-900 font-black hover:text-indigo-600 transition-colors"
                              >
                                {company.active_jobs} Active Position{company.active_jobs === 1 ? '' : 's'}
                              </button>
                          </div>
                          {company.team_size && (
                            <div className="flex items-center text-[10px] font-bold text-gray-400 gap-2.5">
                                <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-indigo-500 transition-all">
                                  <Users className="h-3 w-3" />
                                </div>
                                <span>{company.team_size} Employees</span>
                            </div>
                          )}
                      </div>

                      <div className="pt-4 border-t border-gray-50 space-y-3">
                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Logo URL</label>
                          <div className="flex items-center gap-2">
                            <Input 
                              defaultValue={company.logo_url || ''} 
                              onBlur={(e) => handleUpdateLogo(company.id, e.target.value)}
                              className="h-8 text-[10px] font-bold border-gray-100 bg-gray-50/50 rounded-lg focus:bg-white transition-all flex-1"
                              placeholder="https://..."
                            />
                            <div className="relative shrink-0">
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer z-20 w-8" 
                                onChange={(e) => handleFileUpload(company.id, e)}
                                accept="image/*"
                                disabled={uploadingId === company.id}
                              />
                              <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-gray-100 bg-white" disabled={uploadingId === company.id}>
                                {uploadingId === company.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 text-gray-500" />}
                              </Button>
                            </div>
                          </div>
                        </div>
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
                         className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 transition-all shadow-sm"
                         onClick={() => window.open(`/company/${company.url_slug || company.id}`, '_blank')}
                       >
                         <ExternalLink className="h-3 w-3 mr-2" /> Live Preview
                       </Button>
                  </div>
                </Card>
              </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Real Working Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-gray-100">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
             Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
           </p>

           <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="h-10 px-4 rounded-xl border-gray-200 bg-white font-bold text-xs"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              <div className="flex items-center gap-1">
                {getPaginationItems().map((item, idx) => {
                  if (typeof item === 'string') {
                    return (
                      <span key={`el-${idx}`} className="h-10 w-8 flex items-center justify-center text-xs font-black text-gray-400 select-none">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        "h-10 w-10 rounded-xl text-xs font-black transition-all",
                        currentPage === item
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || loading}
                className="h-10 px-4 rounded-xl border-gray-200 bg-white font-bold text-xs"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
