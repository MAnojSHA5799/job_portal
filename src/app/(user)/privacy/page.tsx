"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Eye, FileText, Share2, Database, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const defaultContent = {
  introduction: "At JobPortal, we believe in transparency and the ethical use of data. This Privacy Policy describes how we collect, use, and process information on our platform. As a job aggregation service, our primary goal is to provide users with access to publicly available career opportunities while respecting the intellectual property of original publishers and the privacy of our users.",
  data_collection: {
    intro: "Our platform operates as a specialized search engine and aggregator for career opportunities. We collect job-related data through:",
    points: [
      { title: "Public Portals", desc: "Scraping official company websites to index active roles." },
      { title: "Partnerships", desc: "XML feeds and API integrations with verified employers." },
      { title: "Job Boards", desc: "Aggregating links from major professional networks." },
      { title: "AI Refinement", desc: "Parsing unstructured text to present clean metadata." }
    ],
    note: "Note: We always provide direct attribution and links to the original source. We do not store full copies of job descriptions beyond what is necessary for search indexing."
  },
  user_data: {
    intro: "When you create an account or use our platform, we may collect:",
    points: [
      { title: "Account Information", desc: "Full name, email address, and professional interests to provide personalized job alerts." },
      { title: "Usage Data", desc: "Your search queries, saved jobs, and interaction history to improve our AI recommendation engine." },
      { title: "Device Data", desc: "IP address, browser type, and operating system for security and analytics purposes." }
    ]
  },
  security: {
    intro: "We never sell your personal data to third parties. Your information is only shared with:",
    tags: ["Employers", "Service Providers", "Legal Authorities"],
    standards: "We implement industry-standard encryption (SSL/TLS) for all data in transit and use hashed storage for sensitive credentials. Our scraping infrastructure follows robots.txt guidelines to ensure ethical interactions with source websites."
  },
  rights: {
    intro: "You have the right to access, correct, or delete your personal data at any time. You can manage your notification preferences in your account settings or request a full data export by contacting our support team.",
    contact_email: "privacy@jobportal.in"
  }
};

export default function PrivacyPage() {
  const [content, setContent] = useState<typeof defaultContent>(defaultContent);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('content')
          .eq('page_slug', 'privacy')
          .single();

        if (!error && data?.content) {
          setContent({ ...defaultContent, ...data.content });
        }
      } catch (err) {
        console.error('Error fetching privacy content:', err);
      }
    };
    fetchContent();
  }, []);

  const sections = [
    { id: 'introduction', icon: Info, title: 'Introduction' },
    { id: 'data-collection', icon: Database, title: 'How We Collect Data' },
    { id: 'user-data', icon: Eye, title: 'Information We Collect' },
    { id: 'security', icon: Share2, title: 'Data Sharing & Security' },
    { id: 'rights', icon: FileText, title: 'Your Rights' },
  ];

  return (
    <div className="bg-white">
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
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {section.title}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Document Content */}
            <div className="lg:w-3/4 space-y-24">

              <motion.section id="introduction" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Introduction</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg">{content.introduction}</p>
              </motion.section>

              <motion.section id="data-collection" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                    <Database className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">How We Collect Data</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-8">{content.data_collection.intro}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.data_collection.points.map((pt, idx) => (
                    <div key={idx} className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                        <span className="text-indigo-600 font-black text-sm">{idx + 1}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mb-2">{pt.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{pt.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                  <Info className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">{content.data_collection.note}</p>
                </div>
              </motion.section>

              <motion.section id="user-data" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                    <Eye className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Information We Collect</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-8">{content.user_data.intro}</p>
                <div className="space-y-4">
                  {content.user_data.points.map((pt, idx) => (
                    <div key={idx} className="flex gap-6 p-6 rounded-[24px] border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{pt.title}</h4>
                        <p className="text-slate-500 leading-relaxed text-sm">{pt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section id="security" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-sm">
                    <Share2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Data Sharing &amp; Security</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-8">
                  We <strong className="text-slate-900 font-black">never</strong> sell your personal data to third parties. {content.security.intro.replace("We never sell your personal data to third parties. ", "")}
                </p>
                <div className="flex flex-wrap gap-4 mb-12">
                  {content.security.tags.map((tag, i) => (
                    <span key={i} className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-sm font-bold shadow-sm">{tag}</span>
                  ))}
                </div>
                <div className="p-10 bg-slate-950 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
                  <div className="relative z-10 space-y-6">
                    <h4 className="text-2xl font-black flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      Security Standards
                    </h4>
                    <p className="text-slate-400 leading-relaxed text-lg">{content.security.standards}</p>
                  </div>
                </div>
              </motion.section>

              <motion.section id="rights" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-4 text-slate-900 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Your Rights</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-12">{content.rights.intro}</p>
                <div className="p-12 rounded-[40px] bg-slate-50 border border-slate-100 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center mx-auto relative z-10">
                    <ShieldCheck className="w-10 h-10 text-slate-400" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Questions?</h3>
                    <p className="text-slate-500 text-lg">If you have any questions regarding this policy, please reach out.</p>
                  </div>
                  <a
                    href={`mailto:${content.rights.contact_email}`}
                    className="inline-block px-12 py-5 mt-4 bg-primary text-white rounded-2xl text-sm font-black hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 uppercase tracking-[0.2em] relative z-10"
                  >
                    {content.rights.contact_email}
                  </a>
                </div>
              </motion.section>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
