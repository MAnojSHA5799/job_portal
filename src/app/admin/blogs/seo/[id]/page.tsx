"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BarChart, 
  Search, 
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Tag,
  Monitor,
  Smartphone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateSeoScore } from '@/lib/seo';
import { Button, Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BlogSeoReport() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
  }, [params.id]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) throw error;
      setBlog(data);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">Generating Audit...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Blog Not Found</h2>
            <p className="text-gray-500 mb-8">The strategy report you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/blogs')} variant="primary" className="px-10">
                Back to Dashboard
            </Button>
        </div>
      </div>
    );
  }

  const report = calculateSeoScore(blog);

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="info" className="uppercase text-[10px] font-black tracking-widest px-3">SEO Audit</Badge>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <Clock className="w-3 h-3" /> {new Date(blog.created_at).toLocaleDateString()}
                </div>
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{blog.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                onClick={() => router.push('/admin/blogs')}
                className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest"
             >
                Dashboard
             </Button>
             <Button 
                onClick={() => router.push('/admin/blogs')} 
                className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
             >
                Improve SEO
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Metrics */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="p-10 text-center relative overflow-hidden flex flex-col items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 relative z-10">Optimization Score</h3>
              <div className="relative w-48 h-48 flex items-center justify-center mb-8 z-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-gray-50"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: 553 }}
                    animate={{ strokeDashoffset: 553 - (553 * report.score) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={553}
                    strokeLinecap="round"
                    className={cn(
                      "transition-all",
                      report.score > 70 ? "text-success" : report.score > 40 ? "text-warning" : "text-danger"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-gray-900 leading-none">{report.score}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Score</span>
                </div>
              </div>
              <Badge 
                variant={report.score > 70 ? 'success' : report.score > 40 ? 'warning' : 'danger'} 
                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest relative z-10"
              >
                {report.score > 70 ? 'Optimal' : report.score > 40 ? 'Fair' : 'Critical'}
              </Badge>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            </Card>

            <Card className="p-8 space-y-6 bg-gray-900 border-0 text-white shadow-2xl shadow-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Focus Target</p>
                        <p className="text-lg font-black text-white italic">"{blog.focus_keyword || 'Not Set'}"</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Reading Time</p>
                        <p className="text-xl font-black text-center">{Math.ceil((blog.content?.split(' ').length || 0) / 200)}m</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Word Count</p>
                        <p className="text-xl font-black text-center">{blog.content?.split(' ').length || 0}</p>
                    </div>
                </div>
            </Card>
          </div>

          {/* Right Column: Audit Details */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-primary" /> Audit Breakdown
                </h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Incomplete</span>
                    </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.checks.map((check, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className={cn(
                        "flex gap-5 p-6 rounded-3xl border transition-all hover:shadow-md",
                        check.passed ? "bg-secondary/5 border-secondary/10" : "bg-white border-gray-100"
                    )}
                  >
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        check.passed ? "bg-white text-secondary shadow-sm" : "bg-gray-50 text-gray-300"
                    )}>
                      {check.passed ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <AlertCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className={cn("text-xs font-black uppercase tracking-wider mb-2", check.passed ? "text-gray-900" : "text-gray-400")}>
                        {check.label}
                      </p>
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed overflow-hidden text-ellipsis line-clamp-2">
                        {check.suggestion}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Google SERP Simulator */}
            <Card className="p-10 bg-white">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" /> Search Preview
                </h3>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-primary bg-white shadow-sm"><Monitor className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-gray-400"><Smartphone className="w-4 h-4" /></Button>
                </div>
              </div>
              
              <div className="max-w-2xl p-8 bg-white border border-gray-100 rounded-3xl shadow-2xl shadow-gray-100/50">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">J</div>
                  <span className="font-medium">yourjobportal.com</span>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-400">blog</span>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-400">{blog.category?.toLowerCase() || 'post'}</span>
                </div>
                <h4 className="text-[22px] text-[#1a0dab] font-medium leading-[1.3] mb-2 hover:underline cursor-pointer tracking-tight">
                  {blog.title}
                </h4>
                <p className="text-[14px] text-[#4d5156] leading-[1.6] line-clamp-2 font-medium">
                  {blog.excerpt || '🚨 No meta description provided. Without an excerpt, search engines will pick random text from your content which can hurt click-through rates.'}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
