"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
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
      
      // 1. Try specific path first
      let { data } = await supabase
        .from('banners')
        .select('*')
        .eq('page_path', pathname)
        .eq('is_active', true)
        .maybeSingle();

      // 2. If not found and we are on a sub-page (like /company/slug), try the parent path
      if (!data && pathname.startsWith('/company/')) {
        const { data: parentData } = await supabase
          .from('banners')
          .select('*')
          .eq('page_path', '/company')
          .eq('is_active', true)
          .maybeSingle();
        data = parentData;
      }

      setBanner(data || null);
      setLoading(false);
    };

    fetchBanner();
  }, [pathname]);

  if (loading || !banner) return null;

  return (
    <div className="relative w-full  h-[320px] md:h-[420px] overflow-hidden bg-slate-950 group">
      {/* Background Media with Parallax Effect */}
      <div 
        className="absolute inset-0 z-0"
      >
        {banner.media_type === 'image' ? (
          <img 
            src={banner.media_url} 
            alt={banner.title} 
            className="w-full h-full object-cover brightness-100"
          />
        ) : (
          <video 
            src={banner.media_url} 
            className="w-full h-full object-cover brightness-100"
            autoPlay 
            muted 
            loop 
            playsInline
          />
        )}
        
        {/* Advanced Layered Gradients - REMOVED */}
        
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] z-10" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] z-10" />
      </div>

      <div className="relative z-20 h-full w-full px-4 md:px-12 flex items-end justify-start pb-10">
        <div className="max-w-4xl space-y-4 flex flex-col items-start text-left">
          
          {/* Trust Badge */}
         

          <div className="space-y-4">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight"
            >
              {banner.title.split(' ').map((word, i) => (
                <span key={i} className={cn(
                  "inline-block mr-[0.2em]",
                  i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary bg-[length:200%_auto]" : ""
                )}>
                  {word}
                </span>
              ))}
            </h1>
            
            <p 
              className="text-sm md:text-base text-slate-300 font-medium max-w-xl leading-relaxed"
            >
              {banner.subtitle}
            </p>
          </div>

          <div 
            className="flex flex-wrap gap-4 pt-4"
          >
            {/* <Link href="/jobs">
              <button className="group px-8 h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/25">
                Explore Jobs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 h-14 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold rounded-2xl">
                Post a Job
              </button>
            </Link> */}
          </div>

        
        </div>
      </div>

      {/* Decorative Bottom Wave/Edge - REMOVED */}
      
      {/* Aesthetic Side Label */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 origin-right pr-12 hidden lg:block z-20">
        <p className="text-[11px] font-black text-white/20 uppercase tracking-[1em]">
          Premium Careers • HiringStores
        </p>
      </div>
    </div>
  );
};