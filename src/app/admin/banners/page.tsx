"use client";

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Edit2, 
  ExternalLink,
  Save,
  X,
  Loader2,
  Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadMedia } from './actions';

interface Banner {
  id: string;
  page_path: string;
  title: string;
  subtitle: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_active: boolean;
  created_at: string;
}

export default function BannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({
    page_path: '',
    title: '',
    subtitle: '',
    media_url: '',
    media_type: 'image',
    is_active: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching banners:', error);
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    if (currentBanner.id) {
      const { error } = await supabase
        .from('banners')
        .update(currentBanner)
        .eq('id', currentBanner.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('banners')
        .insert([currentBanner]);
      if (error) alert(error.message);
    }
    
    setIsEditing(false);
    setCurrentBanner({
      page_path: '',
      title: '',
      subtitle: '',
      media_url: '',
      media_type: 'image',
      is_active: true
    });
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    
    if (error) alert(error.message);
    fetchBanners();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Auto-detect media type from file MIME type
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        alert('Please select a valid image or video file.');
        return;
      }

      const mediaType = isVideo ? 'video' : 'image';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'banners');
      formData.append('folder', 'banner-media');

      // Call Server Action for secure upload
      const result = await uploadMedia(formData);

      if (result.success && result.url) {
        setCurrentBanner(prev => ({ 
          ...prev, 
          media_url: result.url,
          media_type: mediaType 
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
      // Reset input value to allow selecting same file again
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Banner Management</h1>
          <p className="text-gray-500">Add dynamic banners to any page on the portal.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Add New Banner
          </Button>
        )}
      </div>

      {isEditing && (
        <Card className="p-8 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {currentBanner.id ? 'Edit Banner' : 'Create New Banner'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Target Page</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  value={currentBanner.page_path}
                  onChange={e => setCurrentBanner({...currentBanner, page_path: e.target.value})}
                >
                  <option value="" disabled>Select a page...</option>
                  <option value="/">Home Page (/)</option>
                  <option value="/jobs">Find Jobs (/jobs)</option>
                  <option value="/companies">Companies (/companies)</option>
                  <option value="/salary">Salary Intel (/salary)</option>
                  <option value="/ats-score">ATS Score (/ats-score)</option>
                  <option value="/blog">Blog (/blog)</option>
                  <option value="/contact">Contact (/contact)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Title (Optional)</label>
                <Input 
                  placeholder="Banner Title" 
                  value={currentBanner.title}
                  onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Subtitle (Optional)</label>
                <Input 
                  placeholder="Banner Subtitle" 
                  value={currentBanner.subtitle}
                  onChange={e => setCurrentBanner({...currentBanner, subtitle: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Media Type</label>
                <div className="flex gap-2">
                  <Button 
                    variant={currentBanner.media_type === 'image' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setCurrentBanner({...currentBanner, media_type: 'image'})}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Image
                  </Button>
                  <Button 
                    variant={currentBanner.media_type === 'video' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setCurrentBanner({...currentBanner, media_type: 'video'})}
                  >
                    <Video className="mr-2 h-4 w-4" /> Video
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Media URL or Upload</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..." 
                    value={currentBanner.media_url}
                    onChange={e => setCurrentBanner({...currentBanner, media_url: e.target.value})}
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={handleFileUpload}
                      accept="image/*,video/*"
                      disabled={uploading}
                    />
                    <Button variant="outline" size="icon" disabled={uploading} className="relative">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {currentBanner.media_url && (
                  <div className="mt-4 p-2 border border-gray-100 rounded-lg bg-white relative group">
                    <div className="aspect-video w-full rounded-md overflow-hidden bg-gray-50">
                      {currentBanner.media_type === 'image' ? (
                        <img 
                          src={currentBanner.media_url} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <video 
                          src={currentBanner.media_url} 
                          className="w-full h-full object-contain"
                          controls
                        />
                      )}
                    </div>
                    <Button 
                      size="icon" 
                      variant="danger" 
                      className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => setCurrentBanner({...currentBanner, media_url: ''})}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="info" className="bg-white/80 backdrop-blur-sm">
                        {currentBanner.media_type === 'image' ? 'Image Preview' : 'Video Preview'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={currentBanner.is_active}
                    onChange={e => setCurrentBanner({...currentBanner, is_active: e.target.checked})}
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-700 select-none">Mark as Active</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-primary/10">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={loading}>
              <Save className="mr-2 h-4 w-4" /> Save Banner
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && banners.length === 0 ? (
          <div className="col-span-full h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden group border-0 shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              {banner.media_type === 'image' ? (
                <img 
                  src={banner.media_url} 
                  alt={banner.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <video 
                  src={banner.media_url} 
                  className="w-full h-full object-cover"
                  autoPlay muted loop
                />
              )}
              <div className="absolute top-4 left-4">
                <Badge variant={banner.is_active ? 'success' : 'default'} className="backdrop-blur-md">
                  {banner.is_active ? 'Active' : 'Draft'}
                </Badge>
              </div>
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8 bg-white/90 backdrop-blur-md border-0"
                  onClick={() => {
                    setCurrentBanner(banner);
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="danger" 
                  className="h-8 w-8 bg-danger/90 backdrop-blur-md border-0"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest drop-shadow-md">
                  {banner.page_path}
                </p>
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md truncate">
                  {banner.title || 'Untitled Banner'}
                </h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                {banner.subtitle || 'No description provided.'}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400">
                  Created {new Date(banner.created_at).toLocaleDateString()}
                </span>
                <a 
                  href={banner.page_path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs flex items-center font-bold"
                >
                  View Page <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
