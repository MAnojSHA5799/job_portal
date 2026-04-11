"use client";

import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  name: string;
  location: string | null;
  industry: string | null;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  active_jobs?: number;
}

export default function CompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Partial<Company>>({
    name: '',
    industry: 'Technology',
    location: '',
    website: '',
    description: ''
  });

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

  const handleSave = async () => {
    try {
      setLoading(true);
      if (currentCompany.id) {
        const { error } = await supabase
          .from('companies')
          .update(currentCompany)
          .eq('id', currentCompany.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([currentCompany]);
        if (error) throw error;
      }
      
      setIsEditing(false);
      setCurrentCompany({
        name: '',
        industry: 'Technology',
        location: '',
        website: '',
        description: ''
      });
      fetchCompanies();
    } catch (error: any) {
      alert('Error saving company: ' + error.message);
    } finally {
      setLoading(false);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

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

      setCurrentCompany({ ...currentCompany, logo_url: data.publicUrl });
    } catch (error: any) {
      alert('Error uploading logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Management</h1>
          <p className="text-gray-500">Manage company profiles, logos, and job mappings.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Add New Company
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="p-8 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {currentCompany.id ? 'Edit Company' : 'Register New Company'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Company Name</label>
                <Input 
                  placeholder="e.g. Google" 
                  value={currentCompany.name}
                  onChange={e => setCurrentCompany({...currentCompany, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Industry</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={currentCompany.industry || ''}
                  onChange={e => setCurrentCompany({...currentCompany, industry: e.target.value})}
                >
                  <option value="Technology">Technology</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Headquarters</label>
                <Input 
                  placeholder="e.g. Mountain View, CA" 
                  value={currentCompany.location || ''}
                  onChange={e => setCurrentCompany({...currentCompany, location: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Website URL</label>
                <Input 
                  placeholder="https://google.com" 
                  value={currentCompany.website || ''}
                  onChange={e => setCurrentCompany({...currentCompany, website: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Company Logo</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="URL or Upload ->" 
                    value={currentCompany.logo_url || ''}
                    readOnly
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileUpload}
                      accept="image/*"
                      disabled={uploading}
                    />
                    <Button variant="outline" size="icon" disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Summary</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Brief company description..."
                  value={currentCompany.description || ''}
                  onChange={e => setCurrentCompany({...currentCompany, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-primary/10">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>
              <Save className="mr-2 h-4 w-4" /> {currentCompany.id ? 'Update Company' : 'Register Company'}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-gray-50/50 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search companies..." 
              className="pl-10 h-10 bg-white" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total: {companies.length}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && companies.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-gray-500 font-bold">Fetching company profiles...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredCompanies.map((company) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="p-6 hover:shadow-2xl transition-all group overflow-hidden border border-gray-100 rounded-[32px] bg-white h-full flex flex-col justify-between">
                  <div>
                      <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 rounded-[20px] bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:bg-primary transition-all shadow-sm">
                              {company.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl font-black text-gray-900 group-hover:text-white transition-colors">
                                  {company.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                          </div>
                          <div className="flex gap-1">
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-gray-400 hover:text-primary rounded-xl"
                                onClick={() => {
                                  setCurrentCompany(company);
                                  setIsEditing(true);
                                }}
                             >
                                <ExternalLink className="h-4 w-4" /> {/* Swap out MoreVertical for something useful */}
                             </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-gray-400 hover:text-danger rounded-xl"
                                onClick={() => handleDelete(company.id)}
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                      </div>
                      
                      <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center group-hover:text-primary transition-colors">
                          {company.name} <CheckCircle2 className="ml-2 h-4 w-4 text-secondary fill-secondary/10" />
                      </h3>
                      <Badge variant="info" className="mb-6 uppercase text-[10px] font-black tracking-widest">{company.industry || 'Technology'}</Badge>

                      <div className="space-y-4 mb-8">
                          <div className="flex items-center text-sm font-bold text-gray-500 gap-3 border-b border-gray-50 pb-3">
                              <MapPin className="h-4 w-4 text-gray-400" /> {company.location || 'Remote / Multiple'}
                          </div>
                          <div className="flex items-center text-sm font-bold text-gray-500 gap-3">
                              <Briefcase className="h-4 w-4 text-gray-400" /> {company.active_jobs} Active Positions
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-11 rounded-xl font-bold border-gray-200 hover:border-primary hover:text-primary hover:bg-white shadow-sm"
                        onClick={() => {
                          setCurrentCompany(company);
                          setIsEditing(true);
                        }}
                      >
                        Edit Profile
                      </Button>
                      <a href={company.website || '#'} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="h-11 w-11 p-0 rounded-xl text-gray-400 hover:text-primary hover:border-primary hover:bg-white shadow-sm">
                          <Globe className="h-5 w-5" />
                        </Button>
                      </a>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
         <Button variant="ghost" size="sm" className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
         </Button>
         <div className="flex gap-1">
            {[1].map(p => (
                <button key={p} className="w-8 h-8 rounded text-xs font-bold bg-primary text-white shadow-lg shadow-primary/20">
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
