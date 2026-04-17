"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { JobForm } from '@/components/admin/JobForm';
import { Loader2 } from 'lucide-react';

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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <JobForm 
        companies={companies} 
        onSave={handleSave} 
        onCancel={() => router.push('/admin/jobs')}
        loading={saving}
        title="Post New Job"
        subtitle="Fill in the details below to add a job to the queue."
      />
    </div>
  );
}
