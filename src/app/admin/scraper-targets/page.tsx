"use client";

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Textarea } from '@/components/ui';
import { 
  Plus, 
  Trash2, 
  Loader2,
  ListPlus,
  RefreshCw,
  Globe,
  Upload,
  AlignLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ScraperUrl {
  id: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

export default function ScraperTargetsManagement() {
  const [urls, setUrls] = useState<ScraperUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSingle, setAddingSingle] = useState(false);
  const [addingBulk, setAddingBulk] = useState(false);
  
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scraper_urls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching urls:', error);
    } else {
      setUrls(data || []);
    }
    setLoading(false);
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl.trim()) return;

    setAddingSingle(true);
    try {
      const { error } = await supabase
        .from('scraper_urls')
        .insert([{ url: singleUrl.trim() }]);

      if (error) {
        if (error.code === '23505') alert('This URL already exists!');
        else throw error;
      } else {
        setSingleUrl('');
        fetchUrls();
      }
    } catch (err: any) {
      alert("Error adding URL: " + err.message);
    } finally {
      setAddingSingle(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrls.trim()) return;

    setAddingBulk(true);
    try {
      // Split by newline or comma, trim, and filter out empties
      const urlArray = bulkUrls
        .split(/[\n,]+/)
        .map(u => u.trim())
        .filter(u => u.length > 5); // basic validation

      if (urlArray.length === 0) return;

      const inserts = urlArray.map(url => ({ url }));

      const { error } = await supabase
        .from('scraper_urls')
        .insert(inserts)
        // Ignoring duplicates based on ON CONFLICT is tricky via JS client without an RPC, 
        // fallback to trying them all and catching errors or inserting one by one 
        // if unique constraint strictly fails the whole batch.
        // For simplicity, we just insert. If it fails due to unique constraint, we'll alert.
      
      if (error) throw error;
      
      setBulkUrls('');
      fetchUrls();
    } catch (err: any) {
      alert("Error bulk adding URLs. Some might be duplicates: " + err.message);
    } finally {
      setAddingBulk(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this URL?')) return;
    
    setLoading(true);
    try {
      await supabase.from('scraper_urls').delete().eq('id', id);
      fetchUrls();
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      await supabase
        .from('scraper_urls')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      fetchUrls();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scraper Targets</h1>
          <p className="text-gray-500">Manage the URLs that the automated job scraper will visit.</p>
        </div>
        <Button onClick={fetchUrls} variant="outline" className="shadow-sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Forms to Add URLs */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border-0 shadow-sm border-t-4 border-t-primary">
            <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add Single URL
            </h3>
            <form onSubmit={handleAddSingle} className="space-y-4">
              <Input 
                placeholder="https://careers.company.com..." 
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                autoComplete="off"
              />
              <Button type="submit" loading={addingSingle} className="w-full">
                Save Target
              </Button>
            </form>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm border-t-4 border-t-secondary">
            <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
              <AlignLeft className="h-5 w-5 text-secondary" /> Bulk Upload URLs
            </h3>
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <p className="text-xs text-gray-500">Paste multiple URLs separated by commas or new lines.</p>
              <Textarea 
                placeholder="https://careers.ibm.com&#10;https://careers.google.com" 
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                className="h-32 text-xs"
              />
              <Button type="submit" variant="secondary" loading={addingBulk} className="w-full">
                <Upload className="h-4 w-4 mr-2" /> Bulk Insert
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Col: List of URLs */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white border-0 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
               <Globe className="h-5 w-5 text-gray-400" />
               <h3 className="font-black text-gray-900 text-lg">Active Target List ({urls.length})</h3>
            </div>

            {loading && urls.length === 0 ? (
              <div className="py-20 flex justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <ListPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No Target URLs Found</h3>
                <p className="text-gray-500 text-sm mt-1">Add some URLs from the sidebar to begin scraping.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                {urls.map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all group bg-white">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${target.is_active ? 'bg-success' : 'bg-danger'}`}></span>
                        <a href={target.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 truncate hover:text-primary transition-colors">
                          {target.url}
                        </a>
                      </div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-2 ml-5">
                        Added: {new Date(target.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant={target.is_active ? 'outline' : 'primary'} 
                        className="h-8 text-xs px-3"
                        onClick={() => toggleStatus(target.id, target.is_active)}
                      >
                        {target.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="danger" 
                        className="h-8 w-8"
                        onClick={() => handleDelete(target.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
