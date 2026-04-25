"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, User, Sparkles, Loader2, Calendar, ArrowRight } from 'lucide-react';
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
                        className="w-full aspect-[21/9] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl shadow-indigo-100/50 border border-gray-100 bg-gray-50 mb-20 relative group"
                    >
                        <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </motion.div>
                )}

                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Floating Social Sidebar (Desktop) */}
                    <aside className="hidden lg:flex flex-col gap-4 sticky top-32 pt-4">
                        <button 
                            onClick={handleCopyLink}
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border",
                                copied ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100"
                            )}
                        >
                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                        </button>
                        <div className="w-px h-8 bg-gray-100 mx-auto" />
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                            <Share2 className="w-5 h-5" />
                        </a>
                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                            <MessageCircle className="w-5 h-5" />
                        </a>
                    </aside>

                    <div className="flex-1 max-w-[760px] mx-auto article-content">
                        <style jsx global>{`
                            .article-content {
                                color: #334155;
                                line-height: 1.85;
                                font-size: 1.125rem;
                            }
                            .article-content p {
                                margin-bottom: 2rem;
                                letter-spacing: -0.005em;
                            }
                            .article-content h1, .article-content h2, .article-content h3, .article-content h4 {
                                color: #0f172a;
                                font-weight: 900;
                                line-height: 1.25;
                                letter-spacing: -0.04em;
                                margin-top: 4rem;
                                margin-bottom: 1.5rem;
                            }
                            .article-content h2 { font-size: 2.5rem; border-left: 6px solid #4f46e5; padding-left: 1.5rem; margin-left: -2rem; }
                            .article-content h3 { font-size: 1.875rem; }
                            
                            .article-content ul, .article-content ol {
                                margin-bottom: 2.5rem;
                                padding-left: 1.5rem;
                            }
                            .article-content li {
                                margin-bottom: 1rem;
                                position: relative;
                                padding-left: 1rem;
                            }
                            .article-content ul li::before {
                                content: "";
                                position: absolute;
                                left: -1.5rem;
                                top: 0.8rem;
                                width: 0.6rem;
                                height: 2px;
                                background-color: #4f46e5;
                                border-radius: 4px;
                            }
                            .article-content blockquote {
                                border-left: 4px solid #4f46e5;
                                padding: 2.5rem 3rem;
                                font-style: italic;
                                font-size: 1.5rem;
                                color: #0f172a;
                                margin: 4rem 0;
                                font-weight: 700;
                                letter-spacing: -0.03em;
                                background-color: #f8fafc;
                                border-radius: 0 32px 32px 0;
                            }
                            .article-content img {
                                border-radius: 32px;
                                margin: 4.5rem 0;
                                box-shadow: 0 30px 60px -15px rgb(0 0 0 / 0.2);
                                width: 100%;
                                border: 1px solid #f1f5f9;
                            }
                            .article-content table {
                                width: 100%;
                                border-collapse: separate;
                                border-spacing: 0;
                                margin: 4rem 0;
                                border: 1px solid #e2e8f0;
                                border-radius: 24px;
                                overflow: hidden;
                                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                            }
                            .article-content th {
                                background-color: #f8fafc;
                                color: #0f172a;
                                font-weight: 900;
                                text-align: left;
                                padding: 1.25rem 1.75rem;
                                font-size: 0.75rem;
                                text-transform: uppercase;
                                letter-spacing: 0.1em;
                                border-bottom: 1px solid #e2e8f0;
                            }
                            .article-content td {
                                padding: 1.25rem 1.75rem;
                                border-bottom: 1px solid #f1f5f9;
                                font-size: 1rem;
                                color: #475569;
                            }
                            .article-content tr:last-child td { border-bottom: none; }
                            .article-content tr:hover td { background-color: #f8fafc; }
                            .article-content a {
                                color: #4f46e5;
                                text-decoration: underline;
                                text-decoration-thickness: 2px;
                                text-underline-offset: 4px;
                                font-weight: 700;
                                transition: all 0.2s;
                            }
                            .article-content a:hover { color: #4338ca; background-color: #4f46e510; }
                            .article-content strong { font-weight: 900; color: #0f172a; }

                            @media (max-width: 768px) {
                                .article-content h2 { font-size: 2rem; margin-left: 0; border-left-width: 4px; }
                                .article-content blockquote { padding: 1.5rem 2rem; font-size: 1.25rem; }
                            }
                        `}</style>
                        <div 
                            className="selection:bg-indigo-100"
                            dangerouslySetInnerHTML={{ __html: blog.content }} 
                        />

                        {/* FAQ Section */}
                        {blog.faqs && blog.faqs.length > 0 && (
                          <div className="mt-20 pt-20 border-t border-gray-100 space-y-12">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                    Frequently Asked <span className="text-indigo-600 italic">Questions</span>
                                </h2>
                                <p className="text-gray-500 font-medium mt-2">Common queries related to this topic.</p>
                            </div>
                            <div className="space-y-6">
                              {blog.faqs.map((faq, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, y: 10 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: i * 0.1 }}
                                  className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 group hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500"
                                >
                                  <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-lg shadow-indigo-200">Q</div>
                                    {faq.question}
                                  </h4>
                                  <p className="text-gray-600 font-medium leading-relaxed pl-14">{faq.answer}</p>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mobile Share */}
                        <div className="lg:hidden mt-16 pt-8 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Share this article</span>
                            <div className="flex gap-2">
                                <button onClick={handleCopyLink} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <LinkIcon className="w-4 h-4" />
                                </button>
                                <button className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
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
