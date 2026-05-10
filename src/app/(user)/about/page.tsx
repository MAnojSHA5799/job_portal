"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, ShieldCheck, Target, Zap, Globe, Users, BarChart } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

const Counter = ({ value, suffix = "", duration = 2 }: { value: number, suffix?: string, duration?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [count, value, duration]);

  useEffect(() => {
    return rounded.on("change", (latest) => setDisplayValue(latest));
  }, [rounded]);

  return <span>{displayValue}{suffix}</span>;
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Stats Section - Redesigned for Impact */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.03),transparent)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Our Impact in Numbers</h2>
            <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">The scale of our career ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Active Listings', value: 500, suffix: 'k+', icon: <BarChart className="w-5 h-5" />, color: 'blue' },
              { label: 'Company Sources', value: 12, suffix: 'k+', icon: <Globe className="w-5 h-5" />, color: 'indigo' },
              { label: 'Real-time Updates', value: 24, suffix: '/7', icon: <Zap className="w-5 h-5" />, color: 'amber' },
              { label: 'Accuracy Rate', value: 98, suffix: '%', icon: <ShieldCheck className="w-5 h-5" />, color: 'emerald' },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500 shadow-sm",
                  stat.color === 'blue' && "bg-blue-100 text-blue-600",
                  stat.color === 'indigo' && "bg-indigo-100 text-indigo-600",
                  stat.color === 'amber' && "bg-amber-100 text-amber-600",
                  stat.color === 'emerald' && "bg-emerald-100 text-emerald-600",
                )}>
                  {stat.icon}
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission - Split Layout with Premium Cards */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-black uppercase tracking-widest">
                  Our Mission
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  Democratizing the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 font-black">Future of Work.</span>
                </h2>
                <p className="text-slate-400 leading-relaxed text-lg max-w-xl">
                  The current job market is broken. Opportunities are scattered across thousands of hidden career pages. We built the world's most advanced scraper to find them all.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex gap-6 group hover:bg-white/[0.08] transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Direct-to-Source Integrity</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">We bypass middle-man job boards to connect you directly with official company hiring portals.</p>
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex gap-6 group hover:bg-white/[0.08] transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Low-Latency Intelligence</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Our scraper updates every hour, ensuring you're among the first 1% to apply for new roles.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-[60px] overflow-hidden border-8 border-white/5 shadow-2xl relative group">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" 
                  alt="Modern Office" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              </div>
              
              <div className="absolute -bottom-6 -right-6 md:-right-12 bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 max-w-[280px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Community Approved</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  "The most accurate data I've found on any platform in India."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack - Modern Grid */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Our Technology DNA</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">We don't just find jobs; we analyze and verify them at scale.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: 'Massive Crawling', 
                desc: 'Our bots visit 10,000+ career websites every hour using distributed cloud infrastructure.',
                icon: <Globe className="w-8 h-8 text-primary" />,
                bg: 'bg-primary/5'
              },
              { 
                title: 'Neural Data Extraction', 
                desc: 'We use Large Language Models (LLMs) to structure chaotic job descriptions into clean, filterable data.',
                icon: <Zap className="w-8 h-8 text-indigo-500" />,
                bg: 'bg-indigo-50'
              },
              { 
                title: 'Integrity Shield', 
                desc: 'Our AI detects duplicates, scams, and expired roles before they ever reach your dashboard.',
                icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
                bg: 'bg-emerald-50'
              }
            ].map((item, i) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-8"
              >
                <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center", item.bg)}>
                  {item.icon}
                </div>
                <div className="space-y-4">
                  <h4 className="text-xl font-black text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Ultra Premium */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary rounded-[40px] p-8 md:p-16 relative overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-950/20 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Stop Searching. <br />
                Start Applying.
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/jobs"
                  className="px-10 py-4 bg-white text-primary font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20 uppercase tracking-[0.2em] text-sm inline-block"
                >
                  Explore Jobs
                </Link>
                <Link 
                  href="/contact"
                  className="px-10 py-4 bg-primary-foreground/10 text-white border border-white/20 font-black rounded-2xl transition-all hover:bg-white/10 uppercase tracking-[0.2em] text-sm inline-block"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
