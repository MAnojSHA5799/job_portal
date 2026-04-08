"use client";

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Share2, 
  Bookmark, 
  CheckCircle, 
  ChevronRight, 
  Building2, 
  Zap, 
  Globe, 
  Star,
  Users,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Banner - Company Branded Area */}
      <div className="h-40 bg-gradient-to-r from-primary to-primary/80 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 space-y-8">
            <Card className="p-8 md:p-12 border-0 shadow-2xl shadow-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[24px] bg-white border border-gray-100 shadow-xl shadow-gray-100 flex items-center justify-center text-3xl font-black text-primary p-2">
                            G
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Senior Frontend Engineer</h1>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Google</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Mountain View, CA</span>
                                <span className="flex items-center gap-1.5 text-primary"><Star className="w-4 h-4 fill-primary" /> $160k - $220k</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl"><Bookmark className="w-5 h-5 text-gray-400" /></Button>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl"><Share2 className="w-5 h-5 text-gray-400" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 border-b border-gray-100 pb-8 mb-8 overflow-x-auto whitespace-nowrap">
                    <Badge variant="success" className="px-4 py-1.5 font-black text-[10px]">FULL-TIME</Badge>
                    <Badge variant="info" className="px-4 py-1.5 font-black text-[10px]">HYBRID</Badge>
                    <Badge variant="warning" className="px-4 py-1.5 font-black text-[10px]">URGENT</Badge>
                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Posted 2 days ago</span>
                </div>

                {/* Job Description (AI Optimized) */}
                <div className="prose prose-slate max-w-none space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                        <Zap className="w-3 h-3 fill-primary" /> AI Optimized Description
                    </div>
                    
                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">Overview</h3>
                        <p className="text-gray-600 leading-relaxed font-medium">
                            Join Google's Core Infrastructure team as a Senior Frontend Engineer. You will be responsible for building highly scalable, accessible, and performant user interfaces that power millions of external and internal applications. We are looking for an expert in React, TypeScript, and modern web architectures.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">What You'll Do</h3>
                        <ul className="space-y-4 list-none p-0">
                            {[
                                "Develop and maintain robust web components using React and TypeScript.",
                                "Collaborate with UX designers to translate complex requirements into elegant code.",
                                "Optimize application performance for maximum speed and scalability.",
                                "Mentor junior engineers and advocate for frontend best practices.",
                                "Build tools and abstractions that improve the productivity of other engineers."
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-gray-600 font-medium leading-relaxed">
                                    <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" /> {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">Experience Requirements</h3>
                        <ul className="space-y-4 list-none p-0">
                            {[
                                "5+ years of professional experience in frontend development.",
                                "Expert level proficiency in React, TypeScript, and CSS-in-JS.",
                                "Strong understanding of web performance, accessibility, and SEO.",
                                "Experience with modern CI/CD pipelines and testing frameworks.",
                                "Bachelor's or Master's degree in Computer Science or related field."
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-gray-600 font-medium leading-relaxed">
                                    <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" /> {item}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </Card>

            {/* FAQ Accordion */}
            <Card className="p-8 border-0 shadow-xl shadow-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Frequently Asked Questions</h3>
                <div className="space-y-4">
                    {[
                        { q: "Is relocation assistance provided?", a: "Yes, Google provides comprehensive relocation packages for qualified candidates." },
                        { q: "What is the interview process?", a: "Typically 1 screening call followed by 4-5 technical rounds focusing on coding, system design, and culture." },
                        { q: "Can I work remotely?", a: "This is a hybrid role requiring 3 days a week in the Mountain View headquarters." }
                    ].map((faq, i) => (
                        <div key={i} className="group border border-gray-100 rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer">
                            <div className="flex items-center justify-between font-bold text-gray-900 mb-2">
                                {faq.q} <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </Card>
          </div>

          {/* Sidebar Column */}
          <aside className="w-full lg:w-[400px] space-y-8">
              {/* Sticky Apply Card */}
              <Card className="p-8 border-0 shadow-2xl shadow-primary/10 bg-gray-900 text-white sticky top-28">
                  <h3 className="text-lg font-bold mb-2">Apply for this position</h3>
                  <p className="text-gray-400 text-sm mb-8 font-medium">Join 24 others who applied recently. Fast response expected.</p>
                  
                  <div className="space-y-4 mb-8">
                     <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                        <span className="text-gray-400">Salary Range</span>
                        <span className="text-primary">$160k - $220k</span>
                     </div>
                     <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                        <span className="text-gray-400">Job Type</span>
                        <span>Full-time</span>
                     </div>
                     <div className="flex items-center justify-between text-sm py-4 font-bold">
                        <span className="text-gray-400">Location</span>
                        <span>Mountain View, CA</span>
                     </div>
                  </div>

                  <Button className="w-full h-14 font-black flex items-center justify-center gap-2 group text-lg rounded-2xl">
                      APPLY NOW <Zap className="w-5 h-5 fill-white group-hover:animate-pulse" />
                  </Button>
                  <p className="text-center text-[10px] text-gray-500 mt-4 font-black uppercase tracking-widest">
                      SECURE APPLICATION VIA JOBPORTAL
                  </p>
              </Card>

              {/* Company Info Card */}
              <Card className="p-8 border-0 shadow-sm bg-white overflow-hidden relative">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-900 border border-gray-100">G</div>
                      <div>
                          <h4 className="font-bold text-gray-900">About Google</h4>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tech Giant</p>
                      </div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-6 leading-relaxed">
                      Google's mission is to organize the world's information and make it universally accessible and useful.
                  </p>
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                          <Users className="w-4 h-4 text-primary" /> 100,000+ Employees
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                          <Globe className="w-4 h-4 text-primary" /> google.com
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                          <MapPin className="w-4 h-4 text-primary" /> Mountain View, CA
                      </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-8 text-primary font-black text-xs uppercase tracking-widest">
                      View Company Profile <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
              </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
