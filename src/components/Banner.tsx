"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
      // Try to find an exact match for the current path
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('page_path', pathname)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setBanner(data);
      } else {
        setBanner(null);
      }
      setLoading(false);
    };

    fetchBanner();
  }, [pathname]);

  if (loading) return null; // Or a subtle skeleton
  if (!banner) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-900 group">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {banner.media_type === 'image' ? (
          <img 
            src={banner.media_url} 
            alt={banner.title} 
            className="w-full h-full object-cover animate-in fade-in zoom-in-110 duration-1000"
          />
        ) : (
          <video 
            src={banner.media_url} 
            className="w-full h-full object-cover"
            autoPlay 
            muted 
            loop 
            playsInline
          />
        )}
        {/* Gradients Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-transparent z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6 animate-in slide-in-from-left duration-700">
           {banner.title && (
             <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
                {banner.title}
             </h1>
           )}
           {banner.subtitle && (
             <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl leading-relaxed drop-shadow-md">
                {banner.subtitle}
             </p>
           )}
           
           <div className="h-1 w-20 bg-primary rounded-full shadow-lg shadow-primary/50" />
        </div>
      </div>

      {/* Aesthetic Micro-animation Elements */}
      <div className="absolute bottom-0 right-0 p-8 z-20 space-y-2 opacity-30 group-hover:opacity-100 transition-opacity">
          <div className="h-[1px] w-40 bg-white/20 ml-auto" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] text-right">
              Explore Opportunities • Gethyrd Career Portal
          </p>
      </div>
    </div>
  );
};