"use client";

import React from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Shield, 
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
  MessageSquare,
  Lock,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <section className="bg-gray-900 py-24 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 mb-8">
                    <FileText className="w-3 h-3" /> Legal Center
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
                    Terms of <span className="text-primary italic">Service</span>.
                </h1>
                <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                    Last updated: October 20, 2026. Please read these terms carefully before using our platform.
                </p>
            </motion.div>
        </div>
        {/* Background glow */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="prose prose-lg prose-slate max-w-none space-y-16">
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">1. Acceptance of Terms</h2>
                <p className="text-gray-600 font-medium leading-relaxed">
                    By accessing or using the JobPortal platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">2. User Responsibilities</h2>
                <p className="text-gray-600 font-medium leading-relaxed">
                    Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
                <ul className="space-y-4 list-none p-0">
                    <li className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-all font-black text-[10px]">01</div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">You must be at least 18 years old to use this platform.</p>
                    </li>
                    <li className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-all font-black text-[10px]">02</div>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">You agree not to post false or misleading job descriptions or resumes.</p>
                    </li>
                </ul>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">3. Privacy Policy</h2>
                <p className="text-gray-600 font-medium leading-relaxed">
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the platform, you consent to our collection and use of data as described in the Privacy Policy.
                </p>
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-between gap-6 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">Read Privacy Policy</h4>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">How we protect your data</p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">4. Modifications to Terms</h2>
                <p className="text-gray-600 font-medium leading-relaxed">
                    We reserve the right to modify these terms at any time. We will provide notice of any significant changes by posting the new terms on the platform. Your continued use of the platform after such changes constitutes your acceptance of the new terms.
                </p>
            </section>
        </div>

        <div className="mt-24 p-10 bg-gray-50 rounded-2xl text-center">
            <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">Need further clarification?</h3>
            <p className="text-gray-500 font-medium mb-8">If you have any questions regarding these terms, please contact our legal team.</p>
            <Button size="lg" className="px-12 font-black rounded-xl h-14 shadow-lg shadow-primary/20">Contact Legal Team</Button>
        </div>
      </div>
    </div>
  );
}
