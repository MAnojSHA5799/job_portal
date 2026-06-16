"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Layers, Sparkles, Upload } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

export default function NewIndustryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [industryData, setIndustryData] = useState({ name: '', logo_url: '' });
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `industry-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setIndustryData({ ...industryData, logo_url: data.publicUrl });
    } catch (error: any) {
      alert('Error uploading logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    const fetchCategories = async () => {
      // Fetch unique industries from the companies table
      const { data } = await supabase.from('companies').select('industry');
      if (data) {
        const unique = Array.from(new Set(data.map(d => d.industry).filter(Boolean)));
        setCategories(unique as string[]);
      }
    };
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industryData.name) return alert('Industry Name is required');

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('industries')
        .insert([industryData])
        .select()
        .single();
      
      if (error) throw error;
      
      router.push('/admin/industries');
    } catch (error: any) {
      alert('Error creating industry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
           <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/industries')}
                className="group -ml-3 text-gray-500 hover:text-indigo-600 hover:bg-transparent font-bold flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Button>
              <div className="space-y-1">
                 <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   New Industry <Sparkles className="h-6 w-6 text-indigo-500 fill-indigo-500" />
                 </h1>
                 <p className="text-gray-500 font-medium">Add a new industry category and configure its icon.</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 pr-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Layers className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                 <p className="text-xs font-bold text-gray-900">New Addition</p>
              </div>
           </div>
        </div>

        <Card className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/30">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  Industry Name <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="w-full h-14 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white transition-all text-lg font-bold px-4 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  value={industryData.name}
                  onChange={e => setIndustryData({...industryData, name: e.target.value})}
                >
                  <option value="" disabled>Select an Industry</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  Logo / Icon URL
                </label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    <Input 
                      placeholder="https://example.com/logo.png" 
                      className="h-14 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white transition-all"
                      value={industryData.logo_url}
                      onChange={e => setIndustryData({...industryData, logo_url: e.target.value})}
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                        onChange={handleFileUpload}
                        accept="image/*"
                        disabled={uploading}
                      />
                      <Button type="button" variant="outline" className="h-12 w-full rounded-xl border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm font-bold text-indigo-600 border-indigo-100" disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {industryData.logo_url ? 'Change Image' : 'Upload Image'}
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-2">
                      Provide a direct link or upload an image (PNG, SVG, or JPG recommended).
                    </p>
                  </div>
                  {industryData.logo_url && (
                    <div className="w-16 h-16 shrink-0 rounded-xl border border-gray-200 p-2 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      <img src={industryData.logo_url} alt="Preview" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/admin/industries')}
                className="h-14 flex-1 rounded-xl font-bold border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="h-14 flex-1 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100"
              >
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Save Industry
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
