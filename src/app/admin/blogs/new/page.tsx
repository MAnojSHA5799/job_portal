"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogForm } from '@/components/admin/BlogForm';
import { Button } from '@/components/ui';
import { ArrowLeft, Sparkles, PlusCircle } from 'lucide-react';

export default function NewBlogPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (blogData: any) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .insert([blogData])
        .select()
        .single();
      
      if (error) throw error;
      
      // If it's a draft or a publish, we redirect to edit page so they can continue working
      // or at least stay in the same context.
      if (data?.id) {
        router.push(`/admin/blogs/${data.id}/edit`);
        router.refresh();
      } else {
        router.push('/admin/blogs');
      }
    } catch (error: any) {
      alert('Error saving blog: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
           <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/blogs')}
                className="group -ml-3 text-gray-500 hover:text-primary hover:bg-transparent font-bold flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Archive
              </Button>
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   Compose Article <PlusCircle className="h-6 w-6 text-primary fill-primary/10" />
                 </h1>
                 <p className="text-gray-500 font-medium">Share your expertise with the Gethyrd community.</p>
              </div>
           </div>
           <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Live Draft Mode</span>
           </div>
        </div>

        <BlogForm 
          onSave={handleSave} 
          onCancel={() => router.push('/admin/blogs')}
          loading={saving}
        />
      </div>
    </div>
  );
}
