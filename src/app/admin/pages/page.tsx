"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Textarea, Badge } from '@/components/ui';
import { Loader2, Save, AppWindow, Edit3, ShieldCheck, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StaticPagesAdmin() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('page_slug', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching static pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleEditClick = (page: any) => {
    setActivePage(page.page_slug);
    setCurrentContent(JSON.parse(JSON.stringify(page.content)));
  };

  const handleSave = async () => {
    if (!activePage || !currentContent) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('static_pages')
        .update({ content: currentContent })
        .eq('page_slug', activePage);

      if (error) throw error;
      
      alert('Content saved successfully!');
      fetchPages();
    } catch (error: any) {
      alert('Error saving content: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderAboutEditor = () => (
    <div className="space-y-8">
      {/* Mission */}
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">Mission Section</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Heading Line 1</label>
            <Input 
              value={currentContent.mission?.heading_line1 || ''} 
              onChange={e => setCurrentContent({...currentContent, mission: {...currentContent.mission, heading_line1: e.target.value}})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Heading Line 2</label>
            <Input 
              value={currentContent.mission?.heading_line2 || ''} 
              onChange={e => setCurrentContent({...currentContent, mission: {...currentContent.mission, heading_line2: e.target.value}})}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">Description</label>
          <Textarea 
            value={currentContent.mission?.description || ''} 
            onChange={e => setCurrentContent({...currentContent, mission: {...currentContent.mission, description: e.target.value}})}
            className="min-h-[100px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">Image URL</label>
          <Input 
            value={currentContent.mission?.image_url || ''} 
            onChange={e => setCurrentContent({...currentContent, mission: {...currentContent.mission, image_url: e.target.value}})}
            placeholder="https://images.unsplash.com/..."
          />
          {currentContent.mission?.image_url && (
            <div className="mt-2 h-32 w-48 rounded-xl overflow-hidden border border-slate-200">
              <img src={currentContent.mission.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">Stats (4 items)</h3>
        {currentContent.stats?.map((stat: any, index: number) => (
          <div key={index} className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Label</label>
              <Input 
                value={stat.label} 
                onChange={e => {
                  const newStats = [...currentContent.stats];
                  newStats[index].label = e.target.value;
                  setCurrentContent({...currentContent, stats: newStats});
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Value (Number)</label>
              <Input 
                type="number"
                value={stat.value} 
                onChange={e => {
                  const newStats = [...currentContent.stats];
                  newStats[index].value = parseInt(e.target.value) || 0;
                  setCurrentContent({...currentContent, stats: newStats});
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Suffix (e.g. k+, %)</label>
              <Input 
                value={stat.suffix} 
                onChange={e => {
                  const newStats = [...currentContent.stats];
                  newStats[index].suffix = e.target.value;
                  setCurrentContent({...currentContent, stats: newStats});
                }}
              />
            </div>
          </div>
        ))}
      </Card>
      
      {/* Tech Stack */}
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">Tech Stack Section</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Heading</label>
            <Input 
              value={currentContent.tech_stack?.heading || ''} 
              onChange={e => setCurrentContent({...currentContent, tech_stack: {...currentContent.tech_stack, heading: e.target.value}})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Description</label>
            <Input 
              value={currentContent.tech_stack?.description || ''} 
              onChange={e => setCurrentContent({...currentContent, tech_stack: {...currentContent.tech_stack, description: e.target.value}})}
            />
          </div>
        </div>
        <div className="space-y-4 mt-4">
          <label className="text-sm font-bold text-slate-700">Tech Features (3 items)</label>
          {currentContent.tech_stack?.items?.map((item: any, index: number) => (
            <div key={index} className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Input 
                placeholder="Title"
                value={item.title} 
                onChange={e => {
                  const newItems = [...currentContent.tech_stack.items];
                  newItems[index].title = e.target.value;
                  setCurrentContent({...currentContent, tech_stack: {...currentContent.tech_stack, items: newItems}});
                }}
              />
              <Textarea 
                placeholder="Description"
                value={item.desc} 
                onChange={e => {
                  const newItems = [...currentContent.tech_stack.items];
                  newItems[index].desc = e.target.value;
                  setCurrentContent({...currentContent, tech_stack: {...currentContent.tech_stack, items: newItems}});
                }}
              />
            </div>
          ))}
        </div>
      </Card>
      
      {/* CTA */}
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">CTA Section</h3>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">Heading (use \n for line break)</label>
          <Textarea 
            value={currentContent.cta?.heading || ''} 
            onChange={e => setCurrentContent({...currentContent, cta: {...currentContent.cta, heading: e.target.value}})}
          />
        </div>
      </Card>
    </div>
  );

  const renderTermsEditor = () => (
    <div className="space-y-8">
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">1. Acceptance of Terms</h3>
        <Textarea 
          value={currentContent.intro || ''} 
          onChange={e => setCurrentContent({...currentContent, intro: e.target.value})}
          className="min-h-[100px]"
        />
      </Card>
      
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">2. Use License & Aggregation</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Intro Text</label>
          <Textarea 
            value={currentContent.license?.intro || ''} 
            onChange={e => setCurrentContent({...currentContent, license: {...currentContent.license, intro: e.target.value}})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Points (4 items)</label>
          {currentContent.license?.points?.map((pt: string, idx: number) => (
            <Input 
              key={idx}
              value={pt} 
              onChange={e => {
                const newPts = [...currentContent.license.points];
                newPts[idx] = e.target.value;
                setCurrentContent({...currentContent, license: {...currentContent.license, points: newPts}});
              }}
            />
          ))}
        </div>
      </Card>

      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">3. Disclaimer & Accuracy</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Intro Text</label>
          <Input 
            value={currentContent.disclaimer?.intro || ''} 
            onChange={e => setCurrentContent({...currentContent, disclaimer: {...currentContent.disclaimer, intro: e.target.value}})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Information Accuracy Text</label>
          <Textarea 
            value={currentContent.disclaimer?.accuracy || ''} 
            onChange={e => setCurrentContent({...currentContent, disclaimer: {...currentContent.disclaimer, accuracy: e.target.value}})}
            className="min-h-[120px]"
          />
        </div>
      </Card>

      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">4. Limitations</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Main Limitations Text</label>
          <Textarea 
            value={currentContent.limitations?.text || ''} 
            onChange={e => setCurrentContent({...currentContent, limitations: {...currentContent.limitations, text: e.target.value}})}
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Governing Law</label>
          <Textarea 
            value={currentContent.limitations?.governing_law || ''} 
            onChange={e => setCurrentContent({...currentContent, limitations: {...currentContent.limitations, governing_law: e.target.value}})}
          />
        </div>
      </Card>
    </div>
  );

  const renderPrivacyEditor = () => (
    <div className="space-y-8">
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">1. Introduction</h3>
        <Textarea 
          value={currentContent.introduction || ''} 
          onChange={e => setCurrentContent({...currentContent, introduction: e.target.value})}
          className="min-h-[120px]"
        />
      </Card>
      
      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">2. How We Collect Data</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Intro Text</label>
          <Input 
            value={currentContent.data_collection?.intro || ''} 
            onChange={e => setCurrentContent({...currentContent, data_collection: {...currentContent.data_collection, intro: e.target.value}})}
          />
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500">Points (4 items)</label>
          {currentContent.data_collection?.points?.map((pt: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input 
                className="w-1/3"
                value={pt.title} 
                onChange={e => {
                  const newPts = [...currentContent.data_collection.points];
                  newPts[idx].title = e.target.value;
                  setCurrentContent({...currentContent, data_collection: {...currentContent.data_collection, points: newPts}});
                }}
              />
              <Input 
                className="w-2/3"
                value={pt.desc} 
                onChange={e => {
                  const newPts = [...currentContent.data_collection.points];
                  newPts[idx].desc = e.target.value;
                  setCurrentContent({...currentContent, data_collection: {...currentContent.data_collection, points: newPts}});
                }}
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Note Box Text</label>
          <Textarea 
            value={currentContent.data_collection?.note || ''} 
            onChange={e => setCurrentContent({...currentContent, data_collection: {...currentContent.data_collection, note: e.target.value}})}
          />
        </div>
      </Card>

      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">3. Information We Collect</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Intro Text</label>
          <Input 
            value={currentContent.user_data?.intro || ''} 
            onChange={e => setCurrentContent({...currentContent, user_data: {...currentContent.user_data, intro: e.target.value}})}
          />
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500">Points (3 items)</label>
          {currentContent.user_data?.points?.map((pt: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input 
                className="w-1/3"
                value={pt.title} 
                onChange={e => {
                  const newPts = [...currentContent.user_data.points];
                  newPts[idx].title = e.target.value;
                  setCurrentContent({...currentContent, user_data: {...currentContent.user_data, points: newPts}});
                }}
              />
              <Input 
                className="w-2/3"
                value={pt.desc} 
                onChange={e => {
                  const newPts = [...currentContent.user_data.points];
                  newPts[idx].desc = e.target.value;
                  setCurrentContent({...currentContent, user_data: {...currentContent.user_data, points: newPts}});
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">4. Data Sharing & Security</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Intro Text</label>
          <Input 
            value={currentContent.security?.intro || ''} 
            onChange={e => setCurrentContent({...currentContent, security: {...currentContent.security, intro: e.target.value}})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Tags (comma separated)</label>
          <Input 
            value={currentContent.security?.tags?.join(', ') || ''} 
            onChange={e => setCurrentContent({...currentContent, security: {...currentContent.security, tags: e.target.value.split(',').map((t:string)=>t.trim())}})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Security Standards</label>
          <Textarea 
            value={currentContent.security?.standards || ''} 
            onChange={e => setCurrentContent({...currentContent, security: {...currentContent.security, standards: e.target.value}})}
            className="min-h-[100px]"
          />
        </div>
      </Card>

      <Card className="p-6 border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 border-b pb-2">5. Your Rights</h3>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Intro Text</label>
          <Textarea 
            value={currentContent.rights?.intro || ''} 
            onChange={e => setCurrentContent({...currentContent, rights: {...currentContent.rights, intro: e.target.value}})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">Contact Email</label>
          <Input 
            value={currentContent.rights?.contact_email || ''} 
            onChange={e => setCurrentContent({...currentContent, rights: {...currentContent.rights, contact_email: e.target.value}})}
          />
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-10 p-6 bg-slate-50/50 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <AppWindow className="w-10 h-10 text-indigo-500" />
          Static Pages
        </h1>
        <p className="text-slate-500 font-medium">Manage the content of About, Terms, and Privacy pages while keeping their design intact.</p>
      </div>

      {!activePage ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : (
            pages.map(page => (
              <Card 
                key={page.id} 
                className="p-6 border-slate-100 shadow-lg hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group flex flex-col items-center text-center space-y-4"
                onClick={() => handleEditClick(page)}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  {page.page_slug === 'about' ? <Info className="w-8 h-8" /> : 
                   page.page_slug === 'terms' ? <FileText className="w-8 h-8" /> : 
                   <ShieldCheck className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 capitalize">{page.page_slug} Page</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Last Updated: {new Date(page.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Edit Content</Button>
              </Card>
            ))
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-4 z-10">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setActivePage(null)}>Back to Pages</Button>
              <h2 className="text-xl font-black text-slate-900 capitalize">Editing {activePage}</h2>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-200"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Changes
            </Button>
          </div>
          
          <div className="max-w-4xl">
            {activePage === 'about' && renderAboutEditor()}
            {activePage === 'terms' && renderTermsEditor()}
            {activePage === 'privacy' && renderPrivacyEditor()}
          </div>
        </motion.div>
      )}
    </div>
  );
}
