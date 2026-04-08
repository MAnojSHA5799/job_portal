"use client";

import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Copy, 
  Trash2, 
  Merge, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const duplicateSets = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    company: 'TechCorp',
    duplicates: [
      { id: 101, source: 'Indeed', date: '2h ago', score: 98 },
      { id: 102, source: 'LinkedIn', date: '5h ago', score: 96 }
    ]
  },
  {
    id: 2,
    title: 'Product Designer',
    company: 'Creative Labs',
    duplicates: [
      { id: 201, source: 'Indeed', date: '1d ago', score: 92 },
      { id: 202, source: 'Glassdoor', date: '2d ago', score: 89 }
    ]
  }
];

export default function DuplicateJobs() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Duplicate Jobs</h1>
          <p className="text-gray-500">Review and merge job postings that appear on multiple sources.</p>
        </div>
        <Badge variant="warning" className="px-4 py-2 text-sm font-bold animate-pulse">
            <AlertTriangle className="h-4 w-4 mr-2" /> 12 Potential Duplicates
        </Badge>
      </div>

      <div className="space-y-6">
        {duplicateSets.map((set) => (
          <motion.div
            key={set.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 border-0 shadow-sm bg-white overflow-hidden relative">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Copy className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900">{set.title}</h3>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{set.company}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {set.duplicates.map((dup) => (
                      <div key={dup.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="info" className="text-[10px] font-black">{dup.source}</Badge>
                            <span className="text-xs font-bold text-gray-500">Scraped {dup.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-secondary">{dup.score}% MATCH</span>
                             <ExternalLink className="h-3 w-3 text-gray-300 cursor-pointer hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:border-l lg:border-gray-100 lg:pl-10">
                    <Button variant="outline" className="flex-1 lg:flex-none">
                        <Trash2 className="h-4 w-4 mr-2 text-danger" /> Ignore
                    </Button>
                    <Button className="flex-1 lg:flex-none shadow-lg shadow-primary/20">
                        <Merge className="h-4 w-4 mr-2" /> Merge & Approve
                    </Button>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
              <h3 className="text-xl font-black mb-2 tracking-tight">Bulk Cleanup Tool</h3>
              <p className="text-gray-400 text-sm font-medium">Clear all duplicate instances that haven't been reviewed for 14+ days.</p>
          </div>
          <Button variant="ghost" className="relative z-10 text-white border-2 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest px-10 rounded-2xl">
              Launch Bulk Action <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>
    </div>
  );
}
