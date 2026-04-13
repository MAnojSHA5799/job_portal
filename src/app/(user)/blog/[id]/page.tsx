"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Badge } from '@/components/ui';
import { ArrowLeft, Clock, User, Sparkles, Loader2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export default function BlogPost() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setBlog(data);
    } catch (error) {
      console.error('Error fetching blog:', error);
      router.push('/blog'); // Redirect to listing if not found
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
        <h2 className="text-3xl font-black text-gray-900">Article not found</h2>
        <Link href="/blog">
          <Button variant="outline" className="font-bold rounded-xl px-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
            <Link href="/blog" className="inline-flex items-center text-gray-400 hover:text-primary transition-colors font-bold text-sm mb-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Articles
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="space-y-6 text-center">
                    <Badge variant="info" className="px-4 py-1.5 text-xs font-black uppercase tracking-widest">{blog.category}</Badge>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-tight max-w-3xl mx-auto">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-gray-500 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                            {blog.author}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(blog.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>

                {blog.image_url && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="w-full aspect-video rounded-[32px] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 bg-gray-50"
                    >
                        <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />
                    </motion.div>
                )}

                <div className="max-w-3xl mx-auto prose prose-lg prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline pt-12 text-gray-600">
                     <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                </div>
            </motion.div>

            {/* Newsletter CTA at bottom */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-32 p-12 bg-gray-50 rounded-[40px] text-center border border-gray-100"
            >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Stay updated with our career advice</h3>
                <p className="text-gray-500 font-medium mb-8 max-w-lg mx-auto">Get the best career advice, interview tips, and tech news delivered straight to your inbox.</p>
                <div className="max-w-md mx-auto flex gap-2">
                    <input type="email" placeholder="Enter your email" className="flex-1 h-12 rounded-xl border border-gray-200 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    <Button className="h-12 px-8 font-black rounded-xl">Subscribe</Button>
                </div>
            </motion.div>
        </div>
    </div>
  );
}
