"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<Blog>>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    image_url: '',
    is_published: true,
    focus_keyword: ''
  });
  const [uploading, setUploading] = useState(false);
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

  const handleSave = async () => {
    if (!currentBlog.title || !currentBlog.content || !currentBlog.author || !currentBlog.category) {
      alert('Please fill in all required fields (Title, Content, Author, Category)');
      return;
    }

    setLoading(true);
    try {
      const blogData: any = {
        title: currentBlog.title,
        excerpt: currentBlog.excerpt,
        content: currentBlog.content,
        author: currentBlog.author,
        category: currentBlog.category,
        image_url: currentBlog.image_url,
        is_published: currentBlog.is_published,
        focus_keyword: currentBlog.focus_keyword
      };

      let saveError;

      if (currentBlog.id) {
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', currentBlog.id);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([blogData]);
        saveError = error;
      }

      // Handle missing column error gracefully
      if (saveError) {
        const isMissingColumn = saveError.message?.includes('focus_keyword') || saveError.code === '42703';
        
        if (isMissingColumn) {
          console.warn('focus_keyword column missing, retrying without it...');
          const { focus_keyword, ...safeData } = blogData;
          
          let retryError;
          if (currentBlog.id) {
            const { error } = await supabase.from('blogs').update(safeData).eq('id', currentBlog.id);
            retryError = error;
          } else {
            const { error } = await supabase.from('blogs').insert([safeData]);
            retryError = error;
          }

          if (retryError) throw retryError;
          
          alert('Blog saved successfully! Note: Focus Keyword was not saved because the database column is missing. Run the SQL fix to enable keyword persistence.');
        } else {
          throw saveError;
        }
      }
      
      setIsEditing(false);
      resetForm();
      fetchBlogs();
    } catch (error: any) {
      console.error('Save error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
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

  const resetForm = () => {
    setCurrentBlog({
      title: '',
      excerpt: '',
      content: '',
      author: '',
      category: '',
      image_url: '',
      is_published: true,
      focus_keyword: ''
    });
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

      // Use the generic secure server action
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
      // Reset input value to allow selecting same file again
      if (event.target) event.target.value = '';
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Blog Management</h1>
          <p className="text-gray-500">Create and manage insightful articles for your community.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => { resetForm(); setIsEditing(true); }} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        )}
      </div>

      {!isEditing && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 font-bold" />
          <Input 
            placeholder="Search by title, author, or category..." 
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {isEditing && (
        <Card className="p-8 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {currentBlog.id ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">Title</label>
                <Input 
                  placeholder="Post title" 
                  value={currentBlog.title}
                  onChange={e => setCurrentBlog({...currentBlog, title: e.target.value})}
                  className="text-lg font-bold"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">Excerpt</label>
                <Textarea 
                  placeholder="Brief summary of the post" 
                  value={currentBlog.excerpt}
                  onChange={e => setCurrentBlog({...currentBlog, excerpt: e.target.value})}
                  className="h-24"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">Content</label>
                <Textarea 
                  placeholder="Full blog content..." 
                  value={currentBlog.content}
                  onChange={e => setCurrentBlog({...currentBlog, content: e.target.value})}
                  className="min-h-[400px]"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">SEO Focus Keyword</label>
                <div className="relative">
                  <Input 
                    placeholder="e.g. Job Search Tips" 
                    value={currentBlog.focus_keyword}
                    onChange={e => setCurrentBlog({...currentBlog, focus_keyword: e.target.value})}
                    className="pr-10"
                  />
                  <Info className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">The main keyword you want this post to rank for.</p>
              </div>

              {/* SEO Analysis Panel */}
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                    SEO Analysis
                  </h3>
                  {(() => {
                    const report = calculateSeoScore(currentBlog);
                    return (
                      <Badge variant={report.score > 70 ? 'success' : report.score > 40 ? 'warning' : 'danger'}>
                        Score: {report.score}
                      </Badge>
                    );
                  })()}
                </div>
                
                <div className="space-y-3">
                  {calculateSeoScore(currentBlog).checks.map((check, i) => (
                    <div key={i} className="flex gap-2">
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className={cn("text-xs font-bold leading-none mb-1", check.passed ? "text-gray-900" : "text-gray-400")}>
                          {check.label}
                        </p>
                        {!check.passed && <p className="text-[10px] text-gray-500 font-medium">{check.suggestion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">Featured Image</label>
                <div className="space-y-4">
                  {currentBlog.image_url ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                      <img src={currentBlog.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setCurrentBlog({...currentBlog, image_url: ''})}
                        className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white transition-colors"
                      >
                        <X className="h-4 w-4 text-danger" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 group hover:border-primary/50 transition-colors relative">
                        <Upload className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold">Click to upload image</p>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleFileUpload}
                          accept="image/*"
                          disabled={uploading}
                        />
                    </div>
                  )}
                  {uploading && <div className="flex items-center gap-2 text-primary animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">Author Name</label>
                  <Input 
                    placeholder="e.g., Sarah Chen" 
                    value={currentBlog.author}
                    onChange={e => setCurrentBlog({...currentBlog, author: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block font-black">Category</label>
                  <Input 
                    placeholder="e.g., Career Advice" 
                    value={currentBlog.category}
                    onChange={e => setCurrentBlog({...currentBlog, category: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">Published Status</span>
                </div>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary"
                  checked={currentBlog.is_published}
                  onChange={e => setCurrentBlog({...currentBlog, is_published: e.target.checked})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-primary/10">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={loading} className="px-8 shadow-lg shadow-primary/20">
              <Save className="mr-2 h-4 w-4" /> {currentBlog.id ? 'Update Post' : 'Publish Post'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && blogs.length === 0 ? (
          <div className="col-span-full h-40 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
            <Newspaper className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No blog posts found</h3>
            <p className="text-gray-500 font-medium">Get started by creating your first insight today.</p>
          </div>
        ) : filteredBlogs.map((blog) => (
          <Card key={blog.id} className="overflow-hidden group border-0 shadow-sm hover:shadow-2xl transition-all h-full flex flex-col bg-white">
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {blog.image_url ? (
                <img 
                  src={blog.image_url} 
                  alt={blog.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-300 uppercase select-none tracking-tighter">
                   {blog.category ? blog.category[0] : 'B'}
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge variant={blog.is_published ? 'success' : 'default'} className="backdrop-blur-md">
                  {blog.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link 
                    href={`/admin/blogs/seo/${blog.id}`}
                    className="h-8 w-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center border-0 shadow-sm hover:bg-white transition-all overflow-hidden"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {(() => {
                      const score = calculateSeoScore(blog).score;
                      return (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center text-[8px] font-black border-2 rounded-xl",
                          score > 70 ? "border-success text-success" : score > 40 ? "border-warning text-warning" : "border-danger text-danger"
                        )}>
                          {score}
                        </div>
                      );
                    })()}
                  </Link>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8 bg-white/90 backdrop-blur-md border-0"
                    onClick={() => {
                      setCurrentBlog(blog);
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-primary" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="danger" 
                    className="h-8 w-8 bg-danger/90 backdrop-blur-md border-0"
                    onClick={() => handleDelete(blog.id)}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="info" className="h-5 text-[9px] font-black tracking-widest uppercase">{blog.category}</Badge>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                {blog.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 font-medium">
                {blog.excerpt}
              </p>
              
              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {blog.author}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(blog.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
