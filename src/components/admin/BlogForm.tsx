"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Badge } from '@/components/ui';
import { 
  X, 
  Loader2, 
  Upload, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Info,
  ChevronLeft,
  Eye,
  FileText,
  Link2,
  Hash,
  Clock,
  Type as TypeIcon
} from 'lucide-react';
import { calculateSeoScore } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/app/admin/banners/actions';
import { generateBlogContent, enhanceBlogSEO } from '@/app/admin/blogs/actions';

interface Blog {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  is_published: boolean;
  focus_keyword: string;
  slug: string;
  tags: string;
  meta_description: string;
}

interface BlogFormProps {
  initialData?: Partial<Blog>;
  onSave: (data: Blog) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function BlogForm({ initialData, onSave, onCancel, loading }: BlogFormProps) {
  const [currentBlog, setCurrentBlog] = useState<Blog>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    image_url: '',
    is_published: true,
    focus_keyword: '',
    slug: '',
    tags: '',
    meta_description: '',
    ...initialData
  });

  const [uploading, setUploading] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [isOptimizingSeo, setIsOptimizingSeo] = useState(false);

  const handleSeoOptimize = async () => {
    if (!currentBlog.title && !currentBlog.content) {
      alert('Please add some Title or Content first!');
      return;
    }

    setIsOptimizingSeo(true);
    try {
      const result = await enhanceBlogSEO(currentBlog);
      if (result.success && result.optimized) {
        setCurrentBlog({ 
          ...currentBlog, 
          ...result.optimized 
        });
      } else {
        throw new Error(result.error || 'SEO optimization failed');
      }
    } catch (error: any) {
      alert('SEO AI Error: ' + error.message);
    } finally {
      setIsOptimizingSeo(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = generateSlug(title);
    setCurrentBlog({ ...currentBlog, title, slug });
  };

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).filter(x => x).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const wordCount = currentBlog.content.trim().split(/\s+/).filter(x => x).length;
  const readingTime = calculateReadingTime(currentBlog.content);

  // Pre-fill form when initialData is provided (crucial for Edit pages)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setCurrentBlog(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleAiGenerate = async () => {
    if (!currentBlog.title) {
      alert('Please enter a Title first so AI knows what to write about!');
      return;
    }

    setIsGeneratingBlog(true);
    try {
      const result = await generateBlogContent(
        currentBlog.title, 
        currentBlog.category || 'General', 
        currentBlog.focus_keyword || currentBlog.title
      );

      if (result.success && result.content) {
        setCurrentBlog({ ...currentBlog, content: result.content });
      } else {
        throw new Error(result.error || 'AI generation failed');
      }
    } catch (error: any) {
      alert('AI Error: ' + error.message);
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'blogs');
      formData.append('folder', 'blog-images');

      const result = await uploadMedia(formData);

      if (result.success && result.url) {
        setCurrentBlog({ ...currentBlog, image_url: result.url });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const seoReport = calculateSeoScore(currentBlog);

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8 w-full">
        <Card className="p-8 rounded-[32px] border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Content Editor
            </h2>
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
              <X className="h-6 w-6 text-gray-400" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Article Title *</label>
              <Input 
                placeholder="Enter a catchy title..." 
                value={currentBlog.title}
                onChange={handleTitleChange}
                className="text-xl font-bold h-14 rounded-2xl border-gray-100 focus:border-primary/30 transition-all bg-gray-50/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block flex items-center gap-2">
                  <Link2 className="h-3 w-3" /> URL Slug *
                </label>
                <Input 
                  placeholder="url-friendly-slug" 
                  value={currentBlog.slug}
                  onChange={e => setCurrentBlog({...currentBlog, slug: generateSlug(e.target.value)})}
                  className="font-mono text-sm h-12 rounded-xl border-gray-100 bg-gray-50/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block flex items-center gap-2">
                  <Hash className="h-3 w-3" /> Tags (Comma separated)
                </label>
                <Input 
                  placeholder="e.g. technology, careers, ai" 
                  value={currentBlog.tags}
                  onChange={e => setCurrentBlog({...currentBlog, tags: e.target.value})}
                  className="h-12 rounded-xl border-gray-100 bg-gray-50/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Short Excerpt *</label>
              <Textarea 
                placeholder="A brief summary for the blog list..." 
                value={currentBlog.excerpt}
                onChange={e => setCurrentBlog({...currentBlog, excerpt: e.target.value})}
                className="h-24 rounded-2xl border-gray-100 focus:border-primary/30 bg-gray-50/30 resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Blog Content *</label>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><TypeIcon className="h-3 w-3" /> {wordCount} words</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime} min read</span>
                </div>
              </div>
              <Textarea 
                placeholder="Start writing your masterpiece here..." 
                value={currentBlog.content}
                onChange={e => setCurrentBlog({...currentBlog, content: e.target.value})}
                className="min-h-[500px] rounded-2xl border-gray-100 focus:border-primary/30 bg-gray-50/30 font-medium leading-relaxed"
              />
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={handleAiGenerate}
                disabled={isGeneratingBlog}
                className="text-primary hover:bg-primary/5 font-bold"
              >
                {isGeneratingBlog ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                GENERATE CONTENT WITH AI
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button 
              variant="outline"
              onClick={() => onSave({...currentBlog, is_published: false})} 
              loading={loading} 
              size="lg"
              className="h-14 px-8 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50"
            >
              SAVE AS DRAFT
            </Button>
            <Button 
              onClick={() => onSave({...currentBlog, is_published: true})} 
              loading={loading} 
              size="lg"
              className="h-14 px-12 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 tracking-tight"
            >
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
              {currentBlog.id ? 'UPDATE ARTICLE' : 'PUBLISH ARTICLE'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Sidebar Area */}
      <aside className="w-full xl:w-[400px] space-y-8 sticky top-8">
        {/* SEO Analysis */}
        <Card className="p-8 bg-gray-900 text-white rounded-[32px] border-0 shadow-2xl shadow-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2 tracking-tight">
                  <Sparkles className="h-5 w-5 text-primary" /> SEO Scoring
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Optimization level</p>
              </div>
              <div className={cn(
                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black",
                seoReport.score >= 80 ? "bg-success/20 text-success" : seoReport.score >= 50 ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"
              )}>
                <span className="text-2xl leading-none">{seoReport.score}</span>
                <span className="text-[8px] uppercase tracking-tighter opacity-60">Pts</span>
              </div>
            </div>

            <Button 
              onClick={handleSeoOptimize}
              disabled={isOptimizingSeo}
              className="w-full h-12 mb-8 bg-primary/20 hover:bg-primary/30 text-primary border-0 font-black rounded-xl gap-2 transition-all group"
            >
              {isOptimizingSeo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 group-hover:scale-125 transition-transform" />
              )}
              AUTO-OPTIMIZE SEO
            </Button>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Focus Keyword</label>
                <Input 
                  placeholder="e.g. Job Search Tips" 
                  value={currentBlog.focus_keyword}
                  onChange={e => setCurrentBlog({...currentBlog, focus_keyword: e.target.value})}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Meta Description (SEO)</label>
                <Textarea 
                  placeholder="The snippet that appears in search results..." 
                  value={currentBlog.meta_description}
                  onChange={e => setCurrentBlog({...currentBlog, meta_description: e.target.value})}
                  className="h-24 rounded-xl border-white/10 bg-white/5 text-white text-sm"
                />
                <p className="text-[10px] text-gray-400 font-bold uppercase">Chars: {currentBlog.meta_description.length} / 160</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {seoReport.checks.map((check, i) => (
                  <div key={i} className="flex gap-3 group">
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 shrink-0 group-hover:text-warning transition-colors" />
                    )}
                    <div>
                      <p className={cn("text-[11px] font-black leading-none mb-1", check.passed ? "text-gray-100" : "text-gray-500")}>
                        {check.label}
                      </p>
                      {!check.passed && <p className="text-[9px] text-gray-400 font-medium leading-tight">{check.suggestion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </Card>

        {/* Media & Meta */}
        <Card className="p-8 bg-white rounded-[32px] border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block underline decoration-primary decoration-2 underline-offset-4">Featured Image</label>
              <div className="space-y-4">
                {currentBlog.image_url ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner group">
                    <img src={currentBlog.image_url} alt="Featured" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="danger" size="sm" onClick={() => setCurrentBlog({...currentBlog, image_url: ''})} className="rounded-full h-10 w-10 p-0">
                          <X className="h-5 w-5" />
                        </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary/50 hover:bg-primary/5 transition-all relative group cursor-pointer">
                      <Upload className="h-8 w-8 mb-2 group-hover:translate-y-[-4px] transition-transform" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Select Cover</p>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleFileUpload}
                        accept="image/*"
                        disabled={uploading}
                      />
                  </div>
                )}
                {uploading && <div className="text-[10px] font-black text-primary animate-pulse uppercase flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Uploading to server...</div>}
              </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Author</label>
                  <Input 
                    placeholder="Sarah Chen" 
                    value={currentBlog.author}
                    onChange={e => setCurrentBlog({...currentBlog, author: e.target.value})}
                    className="bg-gray-50 border-gray-100 font-bold"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Category</label>
                  <Input 
                    placeholder="e.g. Industry Insights" 
                    value={currentBlog.category}
                    onChange={e => setCurrentBlog({...currentBlog, category: e.target.value})}
                    className="bg-gray-50 border-gray-100 font-bold"
                  />
               </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", currentBlog.is_published ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500")}>
                    <Eye className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Public Visibility</span>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                checked={currentBlog.is_published}
                onChange={e => setCurrentBlog({...currentBlog, is_published: e.target.checked})}
              />
            </div>
        </Card>
      </aside>
    </div>
  );
}
