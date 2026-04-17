"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { JobForm } from '@/components/admin/JobForm';
import { Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();
        
        if (jobError) throw jobError;
        setJob(jobData);

        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name')
          .order('name');
        
        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Could not fetch job data');
        router.push('/admin/jobs');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleSave = async (jobData: any) => {
    setSaving(true);
    try {
      // Cleanup job data (remove joined companies object or ID if it conflicts)
      const { id: jobId, created_at, ...updateData } = jobData;

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id);
      
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
        initialData={job}
        companies={companies} 
        onSave={handleSave} 
        onCancel={() => router.push('/admin/jobs')}
        loading={saving}
        title="Edit Job Posting"
        subtitle="Modify the details of this job posting below."
      />
    </div>
  );
}
