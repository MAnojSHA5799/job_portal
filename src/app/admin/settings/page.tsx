"use client";

import React from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Lock, 
  Bell, 
  Shield, 
  Database, 
  Zap, 
  Check, 
  Mail,
  User,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Portal Settings</h1>
          <p className="text-gray-500">Configure global job portal behaviors, security, and notifications.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20">
            <Check className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 space-y-2">
            {[
                { icon: Globe, label: 'General Configuration', active: true },
                { icon: Shield, label: 'Auth & Security', active: false },
                { icon: Bell, label: 'Notification Triggers', active: false },
                { icon: Zap, label: 'AI Fix Parameters', active: false },
                { icon: Database, label: 'Supabase Sync', active: false },
            ].map((item, i) => (
                <button 
                    key={i} 
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${item.active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <item.icon className="h-5 w-5" /> {item.label}
                </button>
            ))}
        </aside>

        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 border-0 shadow-sm bg-white">
                <h3 className="text-lg font-black text-gray-900 mb-8 tracking-tight">General Configuration</h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Portal Name</label>
                            <Input defaultValue="JobPortal SaaS" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Support Email</label>
                            <Input defaultValue="support@jobportal.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Job Expiration (Days)</label>
                        <div className="flex items-center gap-4">
                            <Input type="number" defaultValue="30" className="max-w-[100px]" />
                            <span className="text-sm font-bold text-gray-500">Auto-archive expired postings</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-gray-900 tracking-tight">Public Registration</p>
                            <p className="text-xs text-gray-400 font-medium">Allow new companies to sign up without approval.</p>
                        </div>
                        <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer transition-all">
                            <div className="absolute right-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-8 border-0 shadow-sm bg-white">
               <h3 className="text-xl font-black text-danger mb-8 tracking-tight">Danger Zone</h3>
               <div className="p-6 rounded-2xl bg-danger/5 border border-danger/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div>
                       <p className="text-sm font-black text-danger tracking-tight">Clear Scraper Cache</p>
                       <p className="text-xs text-danger/70 font-medium">This will force a full discovery on all 25+ sources.</p>
                   </div>
                   <Button variant="danger" size="sm" className="font-black px-8">Run Clear</Button>
               </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
