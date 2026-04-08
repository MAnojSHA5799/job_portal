"use client";

import React from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Search, 
  Clock, 
  User, 
  ArrowRight, 
  ChevronRight, 
  Tag, 
  TrendingUp, 
  Bookmark,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const posts = [
  { 
    id: 1, 
    title: 'How to Negotiate Your Tech Salary in 2026', 
    excerpt: 'Master the art of negotiation with our comprehensive guide to market trends and negotiation tactics.',
    author: 'Sarah Chen',
    date: 'Oct 12, 2026',
    category: 'Career Advice',
    image: 'Negotiation'
  },
  { 
    id: 2, 
    title: 'Top 10 High-Growth Skills for Frontend Engineers', 
    excerpt: 'From WebAssembly to AI-integrated UI, these are the skills that will dominate the market this year.',
    author: 'Alex Rivera',
    date: 'Oct 10, 2026',
    category: 'Skills',
    image: 'Engineering'
  },
  { 
    id: 3, 
    title: 'The Rise of AI-First Startups: A Hiring Guide', 
    excerpt: 'What these new companies are looking for and how you can position yourself as a top candidate.',
    author: 'James Wilson',
    date: 'Oct 08, 2026',
    category: 'Industry',
    image: 'Trends'
  }
];

const categories = ['All', 'Career Advice', 'Engineering', 'Product', 'Industry', 'Design', 'News'];

export default function BlogListing() {
  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Featured Header */}
      <section className="bg-gray-50 pt-24 pb-32 overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-8">
                    <Sparkles className="w-3 h-3 fill-primary animate-pulse" /> Fresh Career Insights
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-8">
                    The <span className="text-primary italic">Blog</span>.
                </h1>
                <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                    Expert advice on job searching, skill building, and industry trends to help you land your dream role.
                </p>

                <div className="max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 flex items-center gap-2">
                    <Search className="ml-4 h-5 w-5 text-gray-400" />
                    <Input placeholder="Search articles..." className="border-0 shadow-none h-11 focus-visible:ring-0" />
                    <Button size="sm" className="h-11 font-bold px-8 rounded-xl shadow-lg shadow-primary/20">Search</Button>
                </div>
            </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 z-20 relative">
        <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 space-y-12 bg-white p-8 rounded-[32px] shadow-2xl shadow-gray-100 border border-gray-100 shrink-0 h-fit sticky top-28">
                <div>
                    <h3 className="text-xs font-black text-gray-900 border-b border-gray-50 pb-4 mb-4 uppercase tracking-widest">Categories</h3>
                    <div className="space-y-4">
                        {categories.map((cat, i) => (
                            <button key={i} className={`block text-sm font-bold w-full text-left transition-colors ${i === 0 ? 'text-primary' : 'text-gray-400 hover:text-gray-900'}`}>{cat}</button>
                        ))}
                    </div>
                </div>

                <div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="flex flex-col h-full border-0 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group group overflow-hidden bg-white">
                                <div className="h-56 bg-gray-100 relative group-hover:scale-105 transition-transform duration-700">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-gray-200"></div>
                                    <div className="absolute inset-0 flex items-center justify-center font-black text-gray-300 text-6xl select-none">{post.image}</div>
                                    <div className="absolute top-4 left-4 z-10">
                                        <Badge variant="info" className="bg-white/80 backdrop-blur-md font-black text-[10px] text-primary">{post.category}</Badge>
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                        <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {post.author}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {post.date}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-primary transition-colors cursor-pointer leading-tight tracking-tight">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <Button variant="ghost" className="text-primary font-black text-xs uppercase tracking-widest px-0 hover:bg-transparent">
                                            Read Article <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                        <button className="text-gray-400 hover:text-primary transition-colors"><Bookmark className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="pt-20 text-center flex items-center justify-center gap-2">
                    <Button variant="outline" className="font-bold border-2 rounded-xl text-gray-400">Previous</Button>
                    {[1, 2, 3].map(n => (
                        <button key={n} className={`w-10 h-10 rounded-xl text-xs font-black ${n === 1 ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{n}</button>
                    ))}
                    <Button variant="outline" className="font-bold border-2 rounded-xl text-primary">Next</Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
