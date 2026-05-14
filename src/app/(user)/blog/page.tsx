"use client";

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  Clock, 
  User, 
  ArrowRight, 
  ChevronRight, 
  TrendingUp, 
  Bookmark,
  Sparkles,
  Loader2,
  Newspaper
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
}

export default function BlogListing() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(blogs.map(b => b.category)))];

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Featured Header */}
      <section className="bg-gray-50 pt-16 md:pt-24 pb-24 md:pb-32 overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-6 md:mb-8">
                    <Sparkles className="w-3 h-3 fill-primary animate-pulse" /> Fresh Career Insights
                </div>
                <h1 className="text-3xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6 md:mb-8">
                    The <span className="text-primary italic">Blog</span>.
                </h1>
                <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12">
                    Expert advice on job searching, skill building, and industry trends to help you land your dream role.
                </p>

                <div className="max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 flex items-center gap-2">
                    <Search className="ml-4 h-5 w-5 text-gray-400 shrink-0" />
                    <Input 
                      placeholder="Search articles..." 
                      className="border-0 shadow-none h-11 focus-visible:ring-0 text-sm md:text-base" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button size="sm" className="hidden sm:flex h-11 font-bold px-8 rounded-xl shadow-lg shadow-primary/20">Search</Button>
                </div>
            </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 z-20 relative">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 space-y-8 lg:space-y-12 bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] shadow-xl lg:shadow-2xl shadow-gray-100 border border-gray-100 shrink-0 h-fit lg:sticky lg:top-28">
                <div>
                    <h3 className="text-xs font-black text-gray-900 border-b border-gray-50 pb-4 mb-4 uppercase tracking-widest">Categories</h3>
                    <div className="flex lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
                        {categories.map((cat, i) => (
                            <button 
                              key={i} 
                              onClick={() => setSelectedCategory(cat)}
                              className={`whitespace-nowrap px-4 py-2 lg:px-0 lg:py-0 rounded-full lg:rounded-none border lg:border-0 text-sm font-bold transition-all ${selectedCategory === cat ? 'text-primary bg-primary/5 border-primary lg:bg-transparent' : 'text-gray-400 border-gray-100 hover:text-gray-900 hover:border-gray-300'}`}
                            >
                              {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:block">
                    <h3 className="text-xs font-black text-gray-900 border-b border-gray-50 pb-4 mb-4 uppercase tracking-widest">Trending Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {['Negotiation', 'React', 'AI', 'Remote', 'RemoteWork', 'Scaling', 'UXDesign'].map((tag, i) => (
                            <Badge key={i} variant="default" className="bg-gray-50 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors shadow-sm">{tag}</Badge>
                        ))}
                    </div>
                </div>

                <Card className="p-6 bg-primary rounded-2xl border-0 shadow-lg shadow-primary/20 text-white group cursor-pointer overflow-hidden relative">
                    <div className="relative z-10">
                        <TrendingUp className="h-8 w-8 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <h4 className="font-bold text-lg mb-2">Build a stunning Resume.</h4>
                        <p className="text-xs text-white/70 font-medium mb-6">Launch our interactive resume builder now.</p>
                        <Button className="w-full bg-white text-primary font-black text-[10px] tracking-widest h-9">LAUNCH BUILDER <ChevronRight className="h-3 w-3 ml-1" /></Button>
                    </div>
                    <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </Card>
            </aside>

            {/* Post Feed */}
            <div className="flex-1 space-y-12">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-primary/20" />
                  </div>
                ) : filteredBlogs.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                    <Newspaper className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-gray-900">No articles found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2 font-medium">We couldn't find any articles matching your criteria. Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      {filteredBlogs.map((post, i) => (
                          <motion.div
                              key={post.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                          >
                              <Link 
                                href={`/blog/${post.slug || post.id}`}
                                target="_blank"
                                className="block group/blog-card h-full"
                              >
                                <Card className="flex flex-col h-full border-0 shadow-sm group-hover/blog-card:shadow-2xl group-hover/blog-card:shadow-primary/5 group-hover/blog-card:-translate-y-2 transition-all group overflow-hidden bg-white rounded-[32px]">
                                    <div className="h-56 bg-gray-100 relative overflow-hidden">
                                        {post.image_url ? (
                                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover/blog-card:scale-110 transition-transform duration-700" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                                            <Newspaper className="w-12 h-12 text-primary/20" />
                                          </div>
                                        )}
                                        <div className="absolute top-4 left-4 z-10">
                                            <Badge variant="info" className="bg-white/80 backdrop-blur-md font-black text-[10px] text-primary border-primary/10">{post.category}</Badge>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 flex flex-col flex-1 relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/blog-card:opacity-100 transition-opacity" />
                                        
                                        <div className="relative z-10 flex-1 flex flex-col">
                                            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                                <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {post.author}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(post.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover/blog-card:text-primary transition-colors leading-tight tracking-tight">
                                                {post.title}
                                            </h3>
                                            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 line-clamp-3">
                                                {post.excerpt}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between">
                                                <Button variant="ghost" className="text-primary font-black text-xs uppercase tracking-widest px-0 hover:bg-transparent group/btn pointer-events-none">
                                                    Read Article <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                                <Bookmark className="h-5 w-5 text-gray-300 hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                              </Link>
                          </motion.div>
                      ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && filteredBlogs.length > 0 && (
                  <div className="pt-20 text-center flex items-center justify-center gap-2">
                      <Button variant="outline" className="font-bold border-2 rounded-xl text-gray-400">Previous</Button>
                      <button className="w-10 h-10 rounded-xl text-xs font-black bg-primary text-white">1</button>
                      <Button variant="outline" className="font-bold border-2 rounded-xl text-primary">Next</Button>
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
