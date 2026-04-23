"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  applyLink: string;
  className?: string;
}

export function ApplyButton({ jobId, jobTitle, companyId, companyName, applyLink, className }: ApplyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const handleApplyClick = async () => {
    if (!user) {
      alert("Please login first to apply for this job.");
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        job_id: jobId || null,
        company_id: companyId || null,
        user_name: user.fullName || user.name || 'Unknown',
        user_email: user.email || 'Unknown',
        user_phone: user.phone || '',
        job_title: jobTitle || 'Unknown Job',
        company_name: companyName || 'Unknown Company',
        status: 'pending'
      };
      
      console.log('Submitting application payload:', payload);

      const { error } = await supabase
        .from('job_applications')
        .insert([payload]);

      if (error) {
        console.error('Supabase Insert Error Details:', error);
        throw error;
      }

      // Redirect to the application link immediately
      window.open(applyLink, '_blank');

    } catch (error) {
      console.error('Error applying:', error);
      alert('Application could not be tracked. Redirecting you to the portal anyway.');
      window.open(applyLink, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleApplyClick}
      disabled={loading}
      className={cn("font-black flex items-center justify-center gap-2 group transition-all", className || "w-full h-14 text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-200")}
    >
      {loading ? (
        <>PROCESSING <Loader2 className="w-5 h-5 animate-spin ml-2" /></>
      ) : (
        <>APPLY NOW <Zap className="w-5 h-5 fill-white" /></>
      )}
    </Button>
  );
}
