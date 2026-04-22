"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CompanyForm } from '@/components/admin/CompanyForm';
import { Loader2, ArrowLeft, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NewCompanyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (companyData: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .insert([companyData]);
      
      if (error) throw error;
      
      router.push('/admin/companies');
      router.refresh();
    } catch (error: any) {
      alert('Error creating company: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
                   New Partner <Sparkles className="h-6 w-6 text-indigo-500 fill-indigo-500" />
                 </h1>
                 <p className="text-gray-500 font-medium">Register a new company and configure their brand presence.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 pr-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Building2 className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                 <p className="text-xs font-bold text-gray-900">New Registration</p>
              </div>
           </div>
        </div>

        <CompanyForm 
          onSave={handleSave} 
          onCancel={() => router.push('/admin/companies')}
          loading={saving}
          title="Registration Details"
          subtitle="All fields marked with * are mandatory for publishing."
        />
      </div>
    </div>
  );
}
