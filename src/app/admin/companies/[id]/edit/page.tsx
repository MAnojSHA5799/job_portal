"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CompanyForm } from '@/components/admin/CompanyForm';
import { Loader2, ArrowLeft, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();
        
        if (companyError) throw companyError;
        setCompany(companyData);

      } catch (error) {
        console.error('Error fetching company:', error);
        alert('Could not fetch company data');
        router.push('/admin/companies');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleSave = async (companyData: any) => {
    setSaving(true);
    try {
      const { id: _, created_at, ...updateData } = companyData;

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      router.push('/admin/companies');
      router.refresh();
    } catch (error: any) {
      alert('Error saving company: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F8FAFC] gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
        </div>
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
           <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/companies')}
                className="group -ml-3 text-gray-500 hover:text-indigo-600 hover:bg-transparent font-bold flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Button>
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   Edit Profile <Sparkles className="h-6 w-6 text-indigo-500 fill-indigo-500" />
                 </h1>
                 <p className="text-gray-500 font-medium">Refine company brand and maximize search visibility.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 pr-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Building2 className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company ID</p>
                 <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{id}</p>
              </div>
           </div>
        </div>

        <CompanyForm 
          initialData={company}
          onSave={handleSave} 
          onCancel={() => router.push('/admin/companies')}
          loading={saving}
          title="Core Brand Details"
          subtitle="All fields marked with * are mandatory for public profile."
        />
      </div>
    </div>
  );
}
