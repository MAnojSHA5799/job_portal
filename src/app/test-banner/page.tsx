"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, PlayCircle, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

// This is a standalone Demo Component so you can see the UI immediately
// without waiting for database setup.
export default function TestBannerPage() {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header Info */}
      <div className="bg-gray-900 text-white p-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
               <span className="bg-primary px-2 py-0.5 rounded text-white italic">PRO</span> BANNER SYSTEM PREVIEW
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Testing Admin Update & Display Logic</p>
          </div>
          <div className="flex gap-2">
             <Button 
                variant={activeTab === 'video' ? 'primary' : 'ghost'} 
                size="sm"
                className="text-white"
                onClick={() => setActiveTab('video')}
             >
                <PlayCircle className="w-4 h-4 mr-2" /> Video View
             </Button>
             <Button 
                variant={activeTab === 'image' ? 'primary' : 'ghost'}
                size="sm"
                className="text-white"
                onClick={() => setActiveTab('image')}
             >
                <ImageIcon className="w-4 h-4 mr-2" /> Image View
             </Button>
          </div>
        </div>
      </div>

      {/* THE BANNER UI PREVIEW */}
      <div className="relative w-full h-[550px] md:h-[650px] overflow-hidden bg-gray-950 group">
          {/* Mock Background Media */}
          <div className="absolute inset-0 z-0">
            {activeTab === 'image' ? (
               <img 
                 src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2070" 
                 alt="Preview" 
                 className="w-full h-full object-cover animate-in fade-in zoom-in-110 duration-1000"
               />
            ) : (
               <video 
                 src="https://assets.mixkit.co/videos/preview/mixkit-working-late-at-a-startup-office-42790-large.mp4" 
                 className="w-full h-full object-cover opacity-80"
                 autoPlay 
                 muted 
                 loop 
                 playsInline
               />
            )}
            {/* Premium Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent z-10" />
            
            {/* Animated Mesh Grid (Aesthetic) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10" 
                 style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />
          </div>

          {/* Content */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
            <div className="max-w-4xl space-y-8 animate-in slide-in-from-left duration-1000">
               <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <Loader2 className="w-3 h-3 animate-spin" /> Live Preview Mode
                  </span>
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                     UNLEASH YOUR <br/>
                     <span className="text-primary italic">POTENTIAL.</span>
                  </h1>
               </div>
               
               <p className="text-lg md:text-2xl text-white/70 font-medium max-w-2xl leading-relaxed drop-shadow-md">
                  From high-speed career growth to world-class workspace solutions. 
                  Admin can update this title, subtitle, and media anytime.
               </p>
               
               <div className="flex flex-wrap gap-4 pt-4">
                  <Button size="lg" className="rounded-full px-10 shadow-2xl shadow-primary/40 text-lg">Browse All Jobs</Button>
                  <Button variant="outline" size="lg" className="rounded-full px-10 border-white/20 text-white hover:bg-white hover:text-black text-lg backdrop-blur-md">Learn More</Button>
               </div>
            </div>
          </div>

          {/* Aesthetic Side Label */}
          <div className="absolute bottom-12 right-12 z-20 hidden md:block select-none opacity-40">
              <div className="flex items-center gap-6 rotate-90 origin-bottom-right">
                  <div className="h-[1px] w-32 bg-white" />
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] whitespace-nowrap">
                     PREMIUM INTERFACE • 2026 EDITION
                  </p>
              </div>
          </div>
      </div>

      {/* Feature Checklist */}
      <div className="max-w-7xl mx-auto px-6 py-24">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 p-8 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Admin Controlled</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Admin dashboard allows adding banners for specific paths like <b>/jobs</b> or <b>/ats-score</b>.</p>
            </div>
            <div className="space-y-4 p-8 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Video & Image</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Support for cinematic MP4 videos or high-res images with instant preview in dashboard.</p>
            </div>
            <div className="space-y-4 p-8 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Responsive Design</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Perfectly optimized for mobile, tablet, and desktop with smooth parallax-style animations.</p>
            </div>
         </div>

         <div className="mt-20 p-10 rounded-[3rem] bg-danger/5 border border-danger/10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Step Required</h2>
            <p className="text-gray-600 mb-8">Run the SQL script to enable the database backend for these banners.</p>
            <code className="bg-white p-4 rounded-xl block text-xs overflow-x-auto text-left border border-gray-200 shadow-sm max-w-xl mx-auto">
               CREATE TABLE banners (...) -- Check supabase_banners_schema.sql
            </code>
         </div>
      </div>
    </div>
  );
}
