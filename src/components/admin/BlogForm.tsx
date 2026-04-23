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
  Type as TypeIcon,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon
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

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
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

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
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
        // Update the blog data
        setCurrentBlog({ 
          ...currentBlog, 
          ...result.optimized 
        });

        // CRITICAL: Also re-parse the content into blocks so the UI updates
        if (result.optimized.content) {
          parseHtmlToBlocks(result.optimized.content);
        }
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

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setCurrentBlog(prev => ({
        ...prev,
        ...initialData
      }));
      
      // Parse HTML content into blocks if editing
      if (initialData.content) {
        parseHtmlToBlocks(initialData.content);
      } else if (!initialData.id) {
        // Initial block for new blog
        setBlocks([{ id: '1', type: 'text', content: '' }]);
      }
    } else {
      // New blog starting state
      setBlocks([{ id: '1', type: 'text', content: '' }]);
    }
  }, [initialData]);

  const parseHtmlToBlocks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newBlocks: ContentBlock[] = [];
    
    // Recursive function to extract nodes and split by images
    const processNodes = (nodes: NodeList | ChildNode[]) => {
      let currentText = '';
      
      Array.from(nodes).forEach((node) => {
        if (node.nodeName === 'IMG') {
          // Push accumulated text block
          if (currentText.trim()) {
            newBlocks.push({ 
              id: Math.random().toString(36).substr(2, 9), 
              type: 'text', 
              content: currentText.trim() 
            });
            currentText = '';
          }
          // Push image block
          newBlocks.push({ 
            id: Math.random().toString(36).substr(2, 9), 
            type: 'image', 
            content: (node as HTMLImageElement).src 
          });
        } else if (node.nodeName === 'DIV' && (node as HTMLElement).childNodes.length > 0) {
          // If it's a div, we might want to peek inside if it contains images
          const hasImages = (node as HTMLElement).querySelector('img');
          if (hasImages) {
            // If it has images inside, process its children to keep the split
            if (currentText.trim()) {
              newBlocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'text', content: currentText.trim() });
              currentText = '';
            }
            processNodes((node as HTMLElement).childNodes);
          } else {
            // No images, just treat as text
            currentText += (node as HTMLElement).outerHTML || node.textContent || '';
          }
        } else {
          // Regular text or other element
          if (node.nodeType === Node.TEXT_NODE) {
            currentText += node.textContent || '';
          } else {
            currentText += (node as HTMLElement).outerHTML || '';
          }
        }
      });
      
      if (currentText.trim()) {
        newBlocks.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          type: 'text', 
          content: currentText.trim() 
        });
      }
    };

    processNodes(doc.body.childNodes);
    
    if (newBlocks.length === 0) {
      newBlocks.push({ id: '1', type: 'text', content: '' });
    }
    
    setBlocks(newBlocks);
  };

  const updateHtmlFromBlocks = (updatedBlocks: ContentBlock[]) => {
    const html = updatedBlocks.map(block => {
      if (block.type === 'image') {
        return `<img src="${block.content}" alt="Blog Image" />`;
      }
      return block.content;
    }).join('\n');
    
    setCurrentBlog(prev => ({ ...prev, content: html }));
  };

  const addBlock = (type: 'text' | 'image') => {
    const newBlocks = [...blocks, { id: Math.random().toString(36).substr(2, 9), type, content: '' }];
    setBlocks(newBlocks);
    updateHtmlFromBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    if (newBlocks.length === 0) newBlocks.push({ id: '1', type: 'text', content: '' });
    setBlocks(newBlocks);
    updateHtmlFromBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    updateHtmlFromBlocks(newBlocks);
  };

  const updateBlockContent = (id: string, content: string) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, content } : b);
    setBlocks(newBlocks);
    updateHtmlFromBlocks(newBlocks);
  };

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, blockId?: string) => {
    try {
      if (blockId) setUploadingBlockId(blockId);
      else setUploading(true);

      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'blogs');
      formData.append('folder', 'blog-images');

      const result = await uploadMedia(formData);

      if (result.success && result.url) {
        if (blockId) {
          updateBlockContent(blockId, result.url);
        } else {
          setCurrentBlog({ ...currentBlog, image_url: result.url });
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
      setUploadingBlockId(null);
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Article Layout Blocks *</label>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><TypeIcon className="h-3 w-3" /> {wordCount} words</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime} min read</span>
                </div>
              </div>

              <div className="space-y-6">
                {blocks.map((block, index) => (
                  <div key={block.id} className="relative group/block animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => moveBlock(index, 'up')} 
                        disabled={index === 0}
                        className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-100"
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => moveBlock(index, 'down')} 
                        disabled={index === blocks.length - 1}
                        className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-100"
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeBlock(block.id)} 
                        className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 border border-rose-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {block.type === 'text' ? (
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="Write section text here (HTML supported)..." 
                          value={block.content}
                          onChange={e => updateBlockContent(block.id, e.target.value)}
                          className="min-h-[150px] rounded-2xl border-gray-100 focus:border-primary/30 bg-white font-medium leading-relaxed shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-video rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group/img transition-all hover:border-primary/50">
                        {block.content ? (
                          <>
                            <img src={block.content} alt="Blog Section" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <label className="h-10 px-4 bg-white text-gray-900 rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-gray-100">
                                <Upload className="h-4 w-4" /> Change
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={e => handleFileUpload(e, block.id)}
                                  accept="image/*"
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            {uploadingBlockId === block.id ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Click to upload image</p>
                              </>
                            )}
                            <input 
                              type="file" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={e => handleFileUpload(e, block.id)}
                              accept="image/*"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('text')}
                  className="flex-1 h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" /> ADD TEXT SECTION
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('image')}
                  className="flex-1 h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary font-bold"
                >
                  <ImageIcon className="h-4 w-4 mr-2" /> ADD IMAGE BLOCK
                </Button>
              </div>

              <div className="pt-8 space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-primary uppercase tracking-tight">AI Content Generation</h4>
                    <p className="text-[10px] text-primary/60 font-medium">Generate high-quality blog content using GPT-4o based on your title.</p>
                  </div>
                  <Button 
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={isGeneratingBlog}
                    className="bg-primary text-white font-black rounded-xl h-10 px-6 shadow-lg shadow-primary/20"
                  >
                    {isGeneratingBlog ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    GENERATE
                  </Button>
                </div>
              </div>
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
