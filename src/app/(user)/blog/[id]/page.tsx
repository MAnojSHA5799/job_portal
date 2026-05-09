"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, User, Sparkles, Loader2, Calendar, ArrowRight, ChevronRight } from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Share2, Link as LinkIcon, CheckCircle2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  is_published: boolean;
  slug?: string;
  created_at: string;
  faqs?: { question: string; answer: string }[];
}

export default function BlogPost() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      // Precise UUID check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(id);
      
      let data, error;

      if (isUUID) {
        // If it's a UUID, it could be the ID or a slug that happens to look like a UUID
        const result = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .or(`id.eq.${id},slug.eq.${id}`)
          .maybeSingle();
        data = result.data;
        error = result.error;
      } else {
        // If not a UUID, search ONLY in slug to avoid cast errors
        const result = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .eq('slug', id)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data) {
        setBlog(null);
        return;
      }
      
      setBlog(data);
      
      // Fetch related blogs
      const { data: related } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .neq('id', data.id)
        .eq('category', data.category)
        .limit(3);
      
      setRelatedBlogs(related || []);
    } catch (error) {
      console.error('Error fetching blog:', error);
      // router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-12">
                <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-900 truncate max-w-[200px]">{blog.title}</span>
            </nav>

            <article>
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider mb-6">
                        {blog.category}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.1] mb-8">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-400 border-b border-gray-100 pb-8">
                        <div className="flex items-center gap-3 text-gray-900">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="font-black tracking-tight">{blog.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(blog.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="flex items-center gap-2">
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
                        className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 bg-gray-50 mb-16"
                    >
                        <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Main Content (8 cols) */}
                    <div className="lg:col-span-8 article-content">
                        <style jsx global>{`
                            .article-content {
                                color: #334155;
                                line-height: 1.8;
                                font-size: 1.125rem;
                            }
                            .article-content p {
                                margin-bottom: 1.75rem;
                            }
                            .article-content h2, .article-content h3 {
                                color: #0f172a;
                                font-weight: 800;
                                margin-top: 3rem;
                                margin-bottom: 1.25rem;
                                letter-spacing: -0.02em;
                            }
                            .article-content h2 { font-size: 2rem; }
                            .article-content h3 { font-size: 1.5rem; }
                            .article-content ul, .article-content ol {
                                margin-bottom: 1.75rem;
                                padding-left: 1.25rem;
                            }
                            .article-content li {
                                margin-bottom: 0.75rem;
                            }
                            .article-content blockquote {
                                border-left: 4px solid #4f46e5;
                                padding: 1.5rem 2rem;
                                font-style: italic;
                                background-color: #f8fafc;
                                margin: 2.5rem 0;
                                border-radius: 0 16px 16px 0;
                            }
                            .article-content img {
                                border-radius: 16px;
                                margin: 3rem 0;
                            }
                        `}</style>
                        <div 
                            className="selection:bg-indigo-100 mb-20"
                            dangerouslySetInnerHTML={{ __html: blog.content }} 
                        />
                    </div>

                    {/* Sidebar (4 cols) */}
                    <aside className="lg:col-span-4 space-y-12 sticky top-24 h-fit">
                        {/* Share Links */}
                        <Card className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Share Article</h4>
                            <div className="flex gap-3">
                                <button onClick={handleCopyLink} className="flex-1 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all">
                                    {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5" />}
                                </button>
                                <a href="#" className="flex-1 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all">
                                    <Share2 className="w-5 h-5" />
                                </a>
                                <a href="#" className="flex-1 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all">
                                    <MessageCircle className="w-5 h-5" />
                                </a>
                            </div>
                        </Card>

                        {/* Author Card */}
                        <Card className="p-6 border border-gray-100 rounded-2xl bg-white">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">About Author</h4>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                    {blog.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 leading-none">{blog.author}</p>
                                    <p className="text-xs text-gray-400 mt-1 font-bold">Content Strategist</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Expert in career growth and workplace dynamics. Sharing insights to help you navigate the modern job market.
                            </p>
                        </Card>

                        {/* Newsletter Sidebar */}
                        <Card className="p-8 bg-indigo-600 rounded-2xl text-white">
                            <Sparkles className="w-8 h-8 mb-4 text-indigo-200" />
                            <h4 className="text-xl font-black mb-2">Get Updates</h4>
                            <p className="text-indigo-100 text-sm font-medium mb-6">Join 5,000+ pros getting weekly career tips.</p>
                            <input type="email" placeholder="Email address" className="w-full h-11 rounded-xl bg-white/10 border border-white/20 px-4 text-white placeholder:text-white/40 mb-3 text-sm" />
                            <Button className="w-full h-11 bg-white text-indigo-600 font-black rounded-xl hover:bg-indigo-50">Join Now</Button>
                        </Card>
                    </aside>
                </div>
            </article>

            {/* Related Articles Section */}
            {relatedBlogs.length > 0 && (
                <section className="mt-32 pt-20 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">More from <span className="text-indigo-600">{blog.category}</span></h2>
                        <Link href="/blog" className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-2 group">
                            View all articles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {relatedBlogs.map((item) => (
                            <Link key={item.id} href={`/blog/${item.slug || item.id}`} className="group">
                                <Card className="overflow-hidden border-0 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[32px] h-full flex flex-col bg-white">
                                    <div className="aspect-[16/10] overflow-hidden">
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h3 className="text-xl font-black text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1 font-medium leading-relaxed">{item.excerpt}</p>
                                        <div className="flex items-center gap-3 pt-6 border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

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
