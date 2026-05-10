"use client";

import React from 'react';
import { Scale, FileText, AlertCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const sections = [
    { id: 'acceptance', icon: FileText, title: 'Acceptance of Terms' },
    { id: 'license', icon: AlertCircle, title: 'Use License & Aggregation' },
    { id: 'disclaimer', icon: ShieldCheck, title: 'Disclaimer & Accuracy' },
    { id: 'limitations', icon: Scale, title: 'Limitations' },
  ];

  return (
    <div className="bg-white">
      {/* Intro Section */}
      {/* <section className="py-20 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest mb-6"
          >
            <Scale className="w-4 h-4" />
            Legal Agreement
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight"
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 font-bold tracking-wide text-lg uppercase"
          >
            Last Updated: {lastUpdated}
          </motion.p>
        </div>
      </section> */}

      {/* Main Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Sidebar Navigation */}
            <div className="lg:w-1/4 flex-shrink-0 hidden lg:block">
              <div className="sticky top-32 space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-4">Contents</h3>
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a 
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {section.title}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Document Content */}
            <div className="lg:w-3/4 space-y-24">
              
              <motion.section id="acceptance" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">1. Acceptance of Terms</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg">
                  By accessing or using JobPortal, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
              </motion.section>

              <motion.section id="license" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">2. Use License & Aggregation</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-8">
                  Our platform provides a service that aggregates job listings from across the web. Regarding the content found on JobPortal:
                </p>
                <div className="space-y-4">
                  <div className="flex gap-6 p-6 rounded-[24px] border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 flex-shrink-0" />
                    <p className="text-slate-600 leading-relaxed text-sm font-medium">Job listings are provided for personal, non-commercial transitory viewing only.</p>
                  </div>
                  <div className="flex gap-6 p-6 rounded-[24px] border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 flex-shrink-0" />
                    <p className="text-slate-600 leading-relaxed text-sm font-medium">We do not claim ownership of the original job descriptions scraped from third-party websites.</p>
                  </div>
                  <div className="flex gap-6 p-6 rounded-[24px] border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 flex-shrink-0" />
                    <p className="text-slate-600 leading-relaxed text-sm font-medium">You may not use automated systems or software to extract data from JobPortal for commercial purposes ("screen scraping") without our express written consent.</p>
                  </div>
                  <div className="flex gap-6 p-6 rounded-[24px] border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 flex-shrink-0" />
                    <p className="text-slate-600 leading-relaxed text-sm font-medium">Modification or copying of our proprietary aggregation algorithms or UI/UX components is strictly prohibited.</p>
                  </div>
                </div>
              </motion.section>

              <motion.section id="disclaimer" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">3. Disclaimer & Accuracy</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-8">
                  While we strive for 100% accuracy, JobPortal aggregates content from dynamic external sources.
                </p>
                <div className="p-10 bg-amber-50 rounded-[40px] text-amber-900 relative overflow-hidden shadow-sm">
                  <div className="relative z-10 space-y-6">
                    <h4 className="text-2xl font-black flex items-center gap-3">
                      <HelpCircle className="w-8 h-8 text-amber-500" />
                      Information Accuracy
                    </h4>
                    <p className="text-amber-800/80 leading-relaxed text-lg">
                      The job listings on JobPortal are provided "as is". We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose. We do not warrant that the job descriptions, salary data, or company information are error-free or current.
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.section id="limitations" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shadow-sm">
                    <Scale className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">4. Limitations</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-12">
                  In no event shall JobPortal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform, even if we have been notified of the possibility of such damage.
                </p>
                
                <div className="p-12 rounded-[40px] bg-slate-950 text-center space-y-6 relative overflow-hidden shadow-2xl shadow-slate-900/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="space-y-3 relative z-10">
                    <h3 className="text-3xl font-black text-white tracking-tight">Governing Law</h3>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
                      These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                    </p>
                  </div>
                </div>
              </motion.section>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
