"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { Zap, Loader2, FileText, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const trackApplication = async () => {
    if (!user) return false;

    setTracking(true);
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
      return true;
    } catch (error) {
      console.error('Error tracking application:', error);
      return true;
    } finally {
      setTracking(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      alert("Please login first to apply for this job.");
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleDirectApply = async () => {
    await trackApplication();
    window.open(applyLink, '_blank');
    setIsModalOpen(false);
  };

  const handleATSApply = async () => {
    await trackApplication();
    router.push('/ats-score');
    setIsModalOpen(false);
  };

  const modalContent = (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                    Ready to Apply?
                  </h3>
                  <p className="text-gray-500 font-medium mt-1 text-sm">
                    Choose how you want to proceed
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleATSApply}
                  disabled={tracking}
                  className="w-full group relative flex items-center gap-4 p-5 rounded-2xl bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">Check ATS Score</span>
                      <Zap className="w-3 h-3 text-indigo-600 fill-indigo-600 animate-pulse" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-snug mt-0.5">
                      Optimize your resume for this role using AI before applying.
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleDirectApply}
                  disabled={tracking}
                  className="w-full group relative flex items-center gap-4 p-5 rounded-2xl bg-gray-50 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900">Direct link apply</span>
                    <p className="text-xs text-gray-500 font-medium leading-snug mt-0.5">
                      Apply directly on the company website.
                    </p>
                  </div>
                </button>
              </div>

              {tracking && (
                <div className="mt-6 flex items-center justify-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Zap className="w-4 h-4 fill-indigo-600" />
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Quick Track Enabled
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button 
        onClick={handleApplyClick}
        disabled={loading}
        className={cn(
          "font-black flex items-center justify-center gap-2 group transition-all", 
          className || "w-full h-12 text-base rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-200"
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>APPLY NOW <Zap className="w-4 h-4 fill-white" /></>
        )}
      </Button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
