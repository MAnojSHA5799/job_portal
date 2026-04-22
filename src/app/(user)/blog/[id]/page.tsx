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

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollProgress((window.scrollY / scrollHeight) * 100);
      }
    };

    window.addEventListener("scroll", updateScrollProgress);
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600/20" />
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
    <div className="bg-white min-h-screen pb-24 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans">
        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-gray-100">
            <motion.div 
                className="h-full bg-indigo-600"
                style={{ width: `${scrollProgress}%` }}
            />
        </div>

        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[1000px] h-[600px] bg-indigo-50/50 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[500px] bg-purple-50/30 blur-[100px] rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative z-10">
            <Link href="/blog" className="inline-flex items-center text-gray-400 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-widest mb-16 group">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-indigo-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Back to Articles
            </Link>

            <article>
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3" />
                        {blog.category}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-[1.1] max-w-4xl mx-auto italic">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-gray-400 pt-4">
                        <div className="flex items-center gap-3 text-gray-900">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="font-black tracking-tight">{blog.author}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            {new Date(blog.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Clock className="w-4 h-4" />
                            8 min read
                        </div>
                    </div>
                </motion.header>

                {blog.image_url && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.8 }}
                        className="w-full aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-100/50 border border-gray-100 bg-gray-50 mb-20"
                    >
                        <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />
                    </motion.div>
                )}

                <div className="max-w-[720px] mx-auto pt-4 article-content">
                    <style jsx global>{`
                        .article-content {
                            color: #1e293b;
                            line-height: 1.8;
                            font-size: 1.125rem;
                        }
                        .article-content p {
                            margin-bottom: 2rem;
                            letter-spacing: -0.011em;
                        }
                        .article-content h1, .article-content h2, .article-content h3, .article-content h4 {
                            color: #0f172a;
                            font-weight: 900;
                            line-height: 1.2;
                            letter-spacing: -0.04em;
                            margin-top: 3.5rem;
                            margin-bottom: 1.5rem;
                        }
                        .article-content h1 { font-size: 3rem; }
                        .article-content h2 { font-size: 2.25rem; }
                        .article-content h3 { font-size: 1.75rem; }
                        
                        .article-content ul, .article-content ol {
                            margin-bottom: 2rem;
                            padding-left: 1.5rem;
                        }
                        .article-content li {
                            margin-bottom: 0.75rem;
                            position: relative;
                        }
                        .article-content ul li::before {
                            content: "";
                            position: absolute;
                            left: -1.5rem;
                            top: 0.75rem;
                            width: 0.5rem;
                            height: 0.5rem;
                            background-color: #4f46e5;
                            border-radius: 50%;
                        }
                        .article-content blockquote {
                            border-left: 4px solid #4f46e5;
                            padding-left: 2rem;
                            font-style: italic;
                            font-size: 1.5rem;
                            color: #4f46e5;
                            margin: 3rem 0;
                            font-weight: 600;
                            letter-spacing: -0.02em;
                        }
                        .article-content img {
                            border-radius: 24px;
                            margin: 3.5rem 0;
                            box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15);
                            width: 100%;
                        }
                        .article-content table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                            margin: 3rem 0;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            overflow: hidden;
                        }
                        .article-content th {
                            background-color: #f8fafc;
                            color: #0f172a;
                            font-weight: 900;
                            text-align: left;
                            padding: 1rem 1.5rem;
                            font-size: 0.875rem;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .article-content td {
                            padding: 1rem 1.5rem;
                            border-bottom: 1px solid #f1f5f9;
                            font-size: 1rem;
                            color: #475569;
                        }
                        .article-content tr:last-child td {
                            border-bottom: none;
                        }
                        .article-content tr:nth-child(even) td {
                            background-color: #fcfcfd;
                        }
                        .article-content a {
                            color: #4f46e5;
                            text-decoration: underline;
                            text-decoration-thickness: 2px;
                            text-underline-offset: 4px;
                            font-weight: 700;
                        }
                        .article-content a:hover {
                            color: #4338ca;
                        }
                        .article-content strong {
                            font-weight: 900;
                            color: #0f172a;
                        }
                    `}</style>
                    <div 
                        className="selection:bg-indigo-100"
                        dangerouslySetInnerHTML={{ __html: blog.content }} 
                    />
                </div>
            </article>

            {/* Newsletter CTA at bottom */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-40 p-12 md:p-20 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[60px] text-center relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />
                
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20">
                        <Sparkles className="w-10 h-10 text-indigo-300" />
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Stay updated with career advice</h3>
                    <p className="text-indigo-200/80 font-bold text-lg mb-12 max-w-lg mx-auto">Get the best interview tips and tech news delivered straight to your inbox weekly.</p>
                    <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                        <input 
                            type="email" 
                            placeholder="your@email.com" 
                            className="flex-1 h-14 rounded-2xl bg-white/10 border border-white/20 px-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
                        />
                        <Button className="h-14 px-10 bg-white hover:bg-indigo-50 text-indigo-900 font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                            Subscribe
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
  );
}
