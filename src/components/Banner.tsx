"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface BannerData {
  id: string;
  page_path: string;
  title: string;
  subtitle: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_active: boolean;
}

export const Banner = () => {
  const pathname = usePathname();
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('page_path', pathname)
        .eq('is_active', true)
        .maybeSingle();

      setBanner(data || null);
      setLoading(false);
    };

    fetchBanner();
  }, [pathname]);

  if (loading || !banner) return null;

  return (
    <div className="relative w-full h-[450px] md:h-[550px] overflow-hidden bg-slate-950 group">
      {/* Background Media with Parallax Effect */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        {banner.media_type === 'image' ? (
          <img 
            src={banner.media_url} 
            alt={banner.title} 
            className="w-full h-full object-cover brightness-100 transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
          />
        ) : (
          <video 
            src={banner.media_url} 
            className="w-full h-full object-cover brightness-50"
            autoPlay 
            muted 
            loop 
            playsInline
          />
        )}
        
        {/* Advanced Layered Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent z-10" />
        
        {/* Animated Background Pulse */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse z-10" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse z-10 delay-1000" />
      </motion.div>

      {/* Main Content Area */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-4xl space-y-8">
          
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Career Opportunities
          </motion.div>

          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight"
            >
              {banner.title.split(' ').map((word, i) => (
                <span key={i} className={cn(
                  "inline-block mr-[0.2em]",
                  i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary bg-[length:200%_auto] animate-gradient" : ""
                )}>
                  {word}
                </span>
              ))}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-base md:text-lg text-slate-300 font-medium max-w-2xl leading-relaxed"
            >
              {banner.subtitle}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <Link href="/jobs">
              <button className="group px-8 h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/25">
                Explore Jobs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 h-14 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold rounded-2xl transition-all">
                Post a Job
              </button>
            </Link>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pt-12 border-t border-white/10"
          >
            <div className="space-y-1">
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                95%
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Growth Rate</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-400" />
                  12k+
                </p>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Live</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Talent</p>
            </div>
            <div className="space-y-1 hidden md:block">
              <p className="text-2xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                100%
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verified Jobs</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom Wave/Edge */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />
      
      {/* Aesthetic Side Label */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 origin-right pr-12 hidden lg:block z-20">
        <p className="text-[11px] font-black text-white/20 uppercase tracking-[1em]">
          Premium Careers • HiringStores
        </p>
      </div>
    </div>
  );
};