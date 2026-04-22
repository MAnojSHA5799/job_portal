"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Badge, Button, Input, Textarea } from '@/components/ui';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Save,
  X,
  Loader2,
  Upload,
  Calendar,
  User,
  Eye,
  Newspaper,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateSeoScore, SeoReport } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { uploadMedia } from '../banners/actions';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  is_published: boolean;
  focus_keyword?: string;
  created_at: string;
}

export default function BlogsManagement() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blogs:', error);
    } else {
      setBlogs(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);
    
    if (error) alert(error.message);
    fetchBlogs();
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Blog Archive</h1>
          <p className="text-gray-500 font-medium">Manage your publications and editorial pipeline.</p>
        </div>
        <Link href="/admin/blogs/new">
          <Button className="h-12 px-6 shadow-xl shadow-primary/20 font-black rounded-2xl">
            <Plus className="mr-2 h-5 w-5" /> CREATE NEW POST
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 font-bold" />
          <Input 
            placeholder="Search by title, author, or category..." 
            className="pl-11 h-12 bg-gray-50 border-0 focus:bg-white focus:ring-primary/20 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest px-4">
          <Info className="h-4 w-4 text-primary" />
          {filteredBlogs.length} Total Articles
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && blogs.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
            <p className="text-sm font-black text-gray-300 uppercase tracking-widest animate-pulse">Cataloging insights...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <Newspaper className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 font-medium max-w-xs mx-auto mb-8">Your editorial queue is currently empty. Start by creating a new post.</p>
            <Link href="/admin/blogs/new">
              <Button variant="outline" className="rounded-xl font-bold">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Post
              </Button>
            </Link>
          </div>
        ) : filteredBlogs.map((blog) => (
          <Card key={blog.id} className="overflow-hidden group border-0 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col bg-white rounded-[32px]">
            <div className="relative h-56 bg-gray-100 overflow-hidden">
              {blog.image_url ? (
                <img 
                  src={blog.image_url} 
                  alt={blog.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-200 uppercase select-none tracking-tighter bg-gradient-to-br from-gray-50 to-gray-100">
                   {blog.category ? blog.category[0] : 'B'}
                </div>
              )}
              <div className="absolute top-6 left-6">
                <Badge variant={blog.is_published ? 'success' : 'default'} className="backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0">
                  {blog.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Link 
                    href={`/admin/blogs/seo/${blog.id}`}
                    className="h-10 w-10 bg-white shadow-xl rounded-xl flex items-center justify-center border-0 hover:bg-gray-50 transition-all overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const score = calculateSeoScore(blog).score;
                      return (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center text-[10px] font-black border-2 rounded-xl",
                          score > 70 ? "border-emerald-500 text-emerald-500" : score > 40 ? "border-orange-500 text-orange-500" : "border-rose-500 text-rose-500"
                        )}>
                          {score}
                        </div>
                      );
                    })()}
                  </Link>
                  <Link href={`/admin/blogs/${blog.id}/edit`}>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-10 w-10 bg-white shadow-xl border-0 rounded-xl"
                    >
                      <Edit2 className="h-4 w-4 text-primary" />
                    </Button>
                  </Link>
                  <Button 
                    size="icon" 
                    variant="danger" 
                    className="h-10 w-10 bg-rose-500 shadow-xl border-0 rounded-xl hover:bg-rose-600"
                    onClick={() => handleDelete(blog.id)}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{blog.category || 'Uncategorized'}</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {blog.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-8 flex-1 font-medium leading-relaxed">
                {blog.excerpt}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{blog.author}</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
