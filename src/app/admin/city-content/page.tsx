"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input, Textarea, Select } from '@/components/ui';
import { 
  Plus, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Loader2,
  Trash2,
  Edit3,
  X,
  Save,
  Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface CityContent {
  id: string;
  city_name: string;
  heading: string | null;
  subheading: string | null;
  description: string | null;
  seo_heading: string | null;
  seo_description: string | null;
  salary_heading: string | null;
  salary_description: string | null;
  is_active: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function CityContentManagement() {
  const [contents, setContents] = useState<CityContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Partial<CityContent>>({});
  const [saving, setSaving] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>(['Delhi NCR', 'Bangalore', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai']);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('city_content')
        .select('*')
        .order('city_name', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching city content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    
    const fetchAvailableCities = async () => {
      try {
        const { data } = await supabase
          .from('jobs')
          .select('location')
          .eq('is_approved', true)
          .limit(1000);

        if (data && data.length > 0) {
          const uniqueCities = Array.from(new Set(data.map(j => j.location?.split(',')[0].trim())))
            .filter(Boolean);

          if (uniqueCities.length > 0) {
            setAvailableCities(uniqueCities as string[]);
          }
        }
      } catch (error) {
        console.error("Cities fetch error:", error);
      }
    };
    
    fetchAvailableCities();
  }, []);

  const handleSave = async () => {
    if (!currentEdit.city_name) {
      alert('City name is required!');
      return;
    }
    
    setSaving(true);
    try {
      const cityData = {
        city_name: currentEdit.city_name.trim().toLowerCase(),
        heading: currentEdit.heading,
        subheading: currentEdit.subheading,
        description: currentEdit.description,
        seo_heading: currentEdit.seo_heading,
        seo_description: currentEdit.seo_description,
        salary_heading: currentEdit.salary_heading,
        salary_description: currentEdit.salary_description,
        is_active: currentEdit.is_active ?? true,
      };

      if (currentEdit.id) {
        // Update
        const { error } = await supabase
          .from('city_content')
          .update(cityData)
          .eq('id', currentEdit.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('city_content')
          .insert([cityData]);
        if (error) throw error;
      }
      
      setIsEditing(false);
      setCurrentEdit({});
      fetchContents();
    } catch (error: any) {
      alert('Error saving city content: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete the content for this city? The default text will be shown instead.')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('city_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchContents();
    } catch (error: any) {
      alert('Error deleting city content: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(c => 
    c.city_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 p-6 bg-gray-50/30 min-h-screen relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter">
            Content Management
          </Badge>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">City Pages</h1>
          <p className="text-gray-500 font-medium max-w-xl">Customize the SEO text and hero content for specific city landing pages.</p>
        </div>
        <Button 
          onClick={() => { setCurrentEdit({}); setIsEditing(true); }} 
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 transition-all font-bold rounded-2xl"
        >
          <Plus className="mr-2 h-5 w-5" /> Add City Overrides
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4 px-2">
        <div className="relative max-w-md w-full group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by city name..." 
              className="pl-12 h-12 bg-white border-none shadow-xl shadow-gray-200/40 rounded-2xl focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-semibold" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-6">
            <div className="px-5 py-2.5 bg-white rounded-2xl shadow-lg shadow-gray-200/40 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-gray-500 uppercase tracking-[0.1em] whitespace-nowrap">
                Customized Cities: <span className="text-indigo-600 ml-1">{contents.length}</span>
              </span>
            </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {loading && contents.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Content...</p>
          </div>
        ) : contents.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
             <Globe className="w-12 h-12 text-gray-300" />
             <h3 className="text-xl font-bold text-gray-900">No City Overrides Found</h3>
             <p className="text-gray-500 text-sm">All cities are currently using the default global template.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredContents.map((content) => (
              <motion.div
                key={content.id}
                layout
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group h-full"
              >
                <Card className="p-6 border-none shadow-xl shadow-gray-200/50 rounded-[2rem] bg-white h-full flex flex-col justify-between transition-all hover:shadow-2xl hover:shadow-indigo-100 relative overflow-hidden group">
                  <div className="relative z-10 overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                               <MapPin className="h-8 w-8 text-indigo-500" />
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                             <Button 
                                variant="ghost" size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                onClick={() => { setCurrentEdit(content); setIsEditing(true); }}
                             >
                                <Edit3 className="h-4 w-4" />
                             </Button>
                             <Button 
                                variant="ghost" size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                onClick={() => handleDelete(content.id)}
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                      </div>
                      
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-black text-gray-900 capitalize truncate">
                            {content.city_name}
                           </h3>
                           {content.is_active && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50 space-y-3 mt-4">
                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Custom Heading</label>
                          <p className="text-xs text-gray-700 font-medium line-clamp-2">{content.heading || 'Default Heading'}</p>
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Custom Description</label>
                          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-3 font-medium">
                            {content.description || 'Default Description'}
                          </p>
                        </div>
                      </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !saving && setIsEditing(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-8 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900">
                  {currentEdit.id ? 'Edit City Content' : 'Add City Content'}
                </h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <h4 className="text-xs font-black text-indigo-900 mb-2 uppercase tracking-widest">Available Dynamic Variables</h4>
                <p className="text-xs text-indigo-700/80 mb-3 font-medium">Use these exact tags anywhere in your text, and they will be automatically replaced with real data when a user views the page:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white border-indigo-200 text-indigo-700 font-bold px-2 py-1 shadow-sm">
                    {`{cityName}`} <span className="font-normal text-indigo-400 ml-1 text-[10px]">(e.g. Pune)</span>
                  </Badge>
                  <Badge className="bg-white border-indigo-200 text-indigo-700 font-bold px-2 py-1 shadow-sm">
                    {`{jobCount}`} <span className="font-normal text-indigo-400 ml-1 text-[10px]">(e.g. 150)</span>
                  </Badge>
                  <Badge className="bg-white border-indigo-200 text-indigo-700 font-bold px-2 py-1 shadow-sm">
                    {`{majorIndustry}`} <span className="font-normal text-indigo-400 ml-1 text-[10px]">(e.g. Manufacturing)</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">City Name *</label>
                  <Select 
                    value={currentEdit.city_name || ''}
                    onChange={(e) => setCurrentEdit(prev => ({ ...prev, city_name: e.target.value }))}
                    disabled={!!currentEdit.id || saving}
                    className="bg-gray-50 border-gray-200 w-full"
                  >
                    <option value="" disabled>Select a city</option>
                    {availableCities.map(city => (
                      <option key={city} value={city.toLowerCase()}>{city}</option>
                    ))}
                  </Select>
                  <p className="text-[10px] text-gray-400 font-medium">Select the city for which you want to override the content.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Hero Heading Override</label>
                  <Input 
                    placeholder="e.g. Best IT Jobs in {cityName}" 
                    value={currentEdit.heading || ''}
                    onChange={(e) => setCurrentEdit(prev => ({ ...prev, heading: e.target.value }))}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Subheading Override</label>
                  <Input 
                    placeholder="e.g. Explore {jobCount} Verified Opportunities" 
                    value={currentEdit.subheading || ''}
                    onChange={(e) => setCurrentEdit(prev => ({ ...prev, subheading: e.target.value }))}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700">Description Override</label>
                  <Textarea 
                    placeholder="Find your next career in..." 
                    value={currentEdit.description || ''}
                    onChange={(e) => setCurrentEdit(prev => ({ ...prev, description: e.target.value }))}
                    disabled={saving}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-black text-gray-900">SEO Section Content</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Industry Overview Heading</label>
                    <Input 
                      placeholder="e.g. Manufacturing Industry in {cityName}" 
                      value={currentEdit.seo_heading || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, seo_heading: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Industry Overview Description</label>
                    <Textarea 
                      placeholder="With {jobCount} active job openings..." 
                      value={currentEdit.seo_description || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, seo_description: e.target.value }))}
                      disabled={saving}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Salary & Benefits Heading</label>
                    <Input 
                      placeholder="e.g. Salary & Benefits in {cityName}" 
                      value={currentEdit.salary_heading || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, salary_heading: e.target.value }))}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Salary & Benefits Description</label>
                    <Textarea 
                      placeholder="Manufacturing companies in {cityName} provide..." 
                      value={currentEdit.salary_description || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, salary_description: e.target.value }))}
                      disabled={saving}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={currentEdit.is_active ?? true}
                    onChange={(e) => setCurrentEdit(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (Show to users)</label>
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (currentEdit.id ? 'Save Changes' : 'Create Override')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
