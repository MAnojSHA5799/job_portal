"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogForm } from '@/components/admin/BlogForm';
import { Button } from '@/components/ui';
import { ArrowLeft, Sparkles, Loader2, Newspaper } from 'lucide-react';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setBlog(data);
      } catch (error) {
        console.error('Error fetching blog:', error);
        router.push('/admin/blogs');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBlog();
  }, [id, router]);

  const handleSave = async (blogData: any) => {
    setSaving(true);
    try {
      const { id: _, created_at, ...updateData } = blogData;
      const { error } = await supabase
        .from('blogs')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // If it's a draft (not published), stay on the page so they can continue editing
      if (!blogData.is_published) {
        alert('Draft saved successfully!');
        router.refresh();
      } else {
        router.push('/admin/blogs');
        router.refresh();
      }
    } catch (error: any) {
      alert('Error saving blog: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#F8FAFC] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Article...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      
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
                   Edit Article <Newspaper className="h-6 w-6 text-primary" />
                 </h1>
                 <p className="text-gray-500 font-medium">Refine your content and maintain high editorial standards.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 pr-6">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                 ID
              </div>
              <div className="max-w-[120px]">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Post ID</p>
                 <p className="text-[11px] font-bold text-gray-900 truncate">{id}</p>
              </div>
           </div>
        </div>

        <BlogForm 
          initialData={blog}
          onSave={handleSave} 
          onCancel={() => router.push('/admin/blogs')}
          loading={saving}
        />
      </div>
    </div>
  );
}
