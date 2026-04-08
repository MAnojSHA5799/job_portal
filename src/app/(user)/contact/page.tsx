"use client";

import React from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Search, 
  Briefcase, 
  Star, 
  Users, 
  ArrowRight,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <section className="bg-gray-50 border-b border-gray-100 py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-8">
                    <MessageSquare className="w-3 h-3 fill-primary" /> Reach Out
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-8">
                    Let's <span className="text-primary italic">connect</span>.
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                    Have questions about the platform or need support with your hiring needs? We're here to help.
                </p>
            </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 z-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <aside className="lg:col-span-1 space-y-8">
                <Card className="p-10 border-0 shadow-2xl shadow-gray-200 bg-white space-y-12">
                    {[
                        { icon: Mail, label: 'Email Support', value: 'hello@jobportal.com' },
                        { icon: Phone, label: 'Phone Support', value: '+1 (555) 000-0000' },
                        { icon: MapPin, label: 'Headquarters', value: '123 Tech Lane, San Francisco, CA' },
                    ].map((item, i) => (
                        <div key={i} className="space-y-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{item.label}</h4>
                                <p className="text-lg font-black text-gray-900 leading-tight">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </Card>
            </aside>

            {/* Contact Form */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="p-10 md:p-16 border-0 shadow-sm bg-gray-50/50">
                    <h3 className="text-2xl font-black text-gray-900 mb-10 tracking-tight leading-none">Drop us a message</h3>
                    
                    <form className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                                <Input placeholder="John Doe" className="bg-white" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                                <Input type="email" placeholder="john@example.com" className="bg-white" />
                            </div>
                        </div>

                        <div className="space-y-3">
                             <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Subject</label>
                             <select className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all outline-none">
                                 <option>General Inquiry</option>
                                 <option>Hiring Support</option>
                                 <option>Technical Issue</option>
                                 <option>Billing Question</option>
                             </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Message</label>
                            <textarea 
                                className="flex min-h-[160px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all outline-none" 
                                placeholder="How can we help you today?"
                            ></textarea>
                        </div>

                        <Button size="lg" className="h-14 px-12 font-black text-lg rounded-2xl shadow-2xl shadow-primary/30 w-full md:w-auto transition-all transform hover:scale-[1.02]">
                            Send Message <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
