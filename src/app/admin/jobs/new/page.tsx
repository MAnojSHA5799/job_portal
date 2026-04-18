"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { JobForm } from '@/components/admin/JobForm';
import { Loader2, ArrowLeft, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

interface Company {
  id: string;
  name: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .order('name');
        if (error) throw error;
        setCompanies(data || []);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleSave = async (jobData: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);
      
      if (error) throw error;
      
      router.push('/admin/jobs');
      router.refresh();
    } catch (error: any) {
      alert('Error saving job: ' + error.message);
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
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing editor...</p>
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
                onClick={() => router.push('/admin/jobs')}
                className="group -ml-3 text-gray-500 hover:text-indigo-600 hover:bg-transparent font-bold flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Queue
              </Button>
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   Create Post <PlusCircle className="h-6 w-6 text-indigo-500 fill-indigo-500" />
                 </h1>
                 <p className="text-gray-500 font-medium">Add a new high-performing job posting to the Gethyrd portal.</p>
              </div>
           </div>
           <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">New Listing Mode</span>
           </div>
        </div>

        <JobForm 
          companies={companies} 
          onSave={handleSave} 
          onCancel={() => router.push('/admin/jobs')}
          loading={saving}
          title="Core Job Details"
          subtitle="All fields marked with * are mandatory for publishing."
        />
      </div>
    </div>
  );
}
