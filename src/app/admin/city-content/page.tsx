"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button, Input, Textarea } from '@/components/ui';
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
  Globe,
  ExternalLink,
  Sparkles,
  Briefcase,
  SlidersHorizontal,
  Check,
  AlertCircle
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

interface UnifiedCity {
  cityName: string;
  citySlug: string;
  jobCount: number;
  content: CityContent | null;
  isCustomized: boolean;
  isActive: boolean;
}

const DEFAULT_KNOWN_CITIES = [
  'Mumbai', 'Pune', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Chennai', 
  'Vadodara', 'Ahmedabad', 'Kolkata', 'Noida', 'Gurugram', 'Navi Mumbai',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 
  'Chandigarh', 'Coimbatore', 'Kochi', 'Nashik', 'Faridabad', 'Ghaziabad',
  'London', 'Toronto', 'Dubai', 'Riyadh'
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 16 }
  }
};

export default function CityContentManagement() {
  const [contents, setContents] = useState<CityContent[]>([]);
  const [jobCityCounts, setJobCityCounts] = useState<Record<string, number>>({});
  const [allDetectedCities, setAllDetectedCities] = useState<string[]>(DEFAULT_KNOWN_CITIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'customized' | 'default'>('all');
  
  // Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Partial<CityContent>>({});
  const [saving, setSaving] = useState(false);
  const [customCityInput, setCustomCityInput] = useState(false);

  // Fetch both city_content records and actual jobs to compute counts
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch all configured city_content records
      const { data: contentData, error: contentError } = await supabase
        .from('city_content')
        .select('*')
        .order('city_name', { ascending: true });

      if (contentError) throw contentError;
      setContents(contentData || []);

      // 2. Fetch jobs locations to calculate live job counts and discover any extra cities
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('location')
        .limit(2000);

      const counts: Record<string, number> = {};
      const detected = new Set<string>(DEFAULT_KNOWN_CITIES);

      if (jobsData) {
        jobsData.forEach(j => {
          if (!j.location) return;
          const rawCity = j.location.split(/[;,]/)[0]?.trim();
          if (rawCity && rawCity.length > 2 && !rawCity.toLowerCase().includes('location') && !rawCity.toLowerCase().includes('remote')) {
            const normalized = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
            counts[normalized.toLowerCase()] = (counts[normalized.toLowerCase()] || 0) + 1;
            detected.add(normalized);
          }
        });
      }

      setJobCityCounts(counts);
      setAllDetectedCities(Array.from(detected).sort());
    } catch (error) {
      console.error('Error loading city content data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Merge known/detected cities with configured city_content
  const unifiedCities: UnifiedCity[] = useMemo(() => {
    const map = new Map<string, UnifiedCity>();

    // Add all detected / known cities
    allDetectedCities.forEach(city => {
      const slug = city.toLowerCase();
      map.set(slug, {
        cityName: city,
        citySlug: slug,
        jobCount: jobCityCounts[slug] || 0,
        content: null,
        isCustomized: false,
        isActive: true,
      });
    });

    // Merge in city_content records
    contents.forEach(item => {
      const slug = item.city_name.toLowerCase();
      const existing = map.get(slug);
      const displayName = existing ? existing.cityName : item.city_name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      map.set(slug, {
        cityName: displayName,
        citySlug: slug,
        jobCount: jobCityCounts[slug] || existing?.jobCount || 0,
        content: item,
        isCustomized: true,
        isActive: item.is_active,
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize customized cities first, then by job count descending, then alphabetically
      if (a.isCustomized !== b.isCustomized) return a.isCustomized ? -1 : 1;
      if (b.jobCount !== a.jobCount) return b.jobCount - a.jobCount;
      return a.cityName.localeCompare(b.cityName);
    });
  }, [allDetectedCities, contents, jobCityCounts]);

  const filteredCities = useMemo(() => {
    return unifiedCities.filter(c => {
      const matchesSearch = c.cityName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.content?.heading && c.content.heading.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterTab === 'customized') return c.isCustomized;
      if (filterTab === 'default') return !c.isCustomized;
      return true;
    });
  }, [unifiedCities, searchQuery, filterTab]);

  const stats = useMemo(() => {
    const total = unifiedCities.length;
    const customized = unifiedCities.filter(c => c.isCustomized).length;
    const defaultTemplate = total - customized;
    const totalJobs = unifiedCities.reduce((acc, c) => acc + c.jobCount, 0);
    return { total, customized, defaultTemplate, totalJobs };
  }, [unifiedCities]);

  const openEditModal = (city?: UnifiedCity) => {
    if (city) {
      if (city.content) {
        setCurrentEdit({ ...city.content });
      } else {
        // Pre-fill smart defaults for this city
        setCurrentEdit({
          city_name: city.citySlug,
          heading: `Top Manufacturing & Engineering Jobs in {cityName}`,
          subheading: `Explore {jobCount}+ Verified Job Openings with Leading Employers`,
          description: `Discover premier manufacturing, industrial operations, and technical careers in {cityName}. Leading employers in the region are hiring specialists with competitive compensation packages.`,
          seo_heading: `Industrial & Engineering Ecosystem in {cityName}`,
          seo_description: `{cityName} is an established industrial powerhouse, hosting top manufacturing plants and active engineering opportunities.`,
          salary_heading: `Salary Trends & Benefits in {cityName}`,
          salary_description: `Manufacturing and industrial employers in {cityName} offer attractive salary structures, statutory PF, medical benefits, and accelerated career growth.`,
          is_active: true
        });
      }
      setCustomCityInput(false);
    } else {
      setCurrentEdit({
        city_name: '',
        heading: 'Top Manufacturing & Engineering Jobs in {cityName}',
        subheading: 'Explore {jobCount}+ Verified Opportunities',
        description: 'Explore verified career opportunities in manufacturing and industrial operations across {cityName}.',
        is_active: true
      });
      setCustomCityInput(false);
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentEdit.city_name?.trim()) {
      alert('Please specify a city name!');
      return;
    }
    
    setSaving(true);
    try {
      const normalizedCityName = currentEdit.city_name.trim().toLowerCase();
      const cityData = {
        city_name: normalizedCityName,
        heading: currentEdit.heading || null,
        subheading: currentEdit.subheading || null,
        description: currentEdit.description || null,
        seo_heading: currentEdit.seo_heading || null,
        seo_description: currentEdit.seo_description || null,
        salary_heading: currentEdit.salary_heading || null,
        salary_description: currentEdit.salary_description || null,
        is_active: currentEdit.is_active ?? true,
      };

      if (currentEdit.id) {
        // Update existing override
        const { error } = await supabase
          .from('city_content')
          .update(cityData)
          .eq('id', currentEdit.id);
        if (error) throw error;
      } else {
        // Upsert by city_name
        const { error } = await supabase
          .from('city_content')
          .upsert([cityData], { onConflict: 'city_name' });
        if (error) throw error;
      }
      
      setIsEditing(false);
      setCurrentEdit({});
      await loadData();
    } catch (error: any) {
      alert('Error saving city content: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contentId: string, cityName: string) => {
    if (!confirm(`Are you sure you want to remove the custom overrides for "${cityName}"? The page will revert to the standard global template.`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('city_content')
        .delete()
        .eq('id', contentId);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert('Error deleting city override: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string, field: keyof CityContent) => {
    const currentVal = (currentEdit[field] as string) || '';
    setCurrentEdit(prev => ({
      ...prev,
      [field]: currentVal ? `${currentVal} ${variable}` : variable
    }));
  };

  return (
    <div className="space-y-8 p-6 md:p-10 bg-[#F8FAFC] min-h-screen relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-indigo-500/5 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> Location CMS
            </Badge>
            <span className="text-xs font-bold text-gray-400">•</span>
            <span className="text-xs font-bold text-gray-500">SEO & Hero Content Customizer</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            City Pages Management <Sparkles className="h-6 w-6 text-indigo-500" />
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl text-sm leading-relaxed">
            Manage SEO metadata, custom hero text, salary overviews, and landing page content across every city job hub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => openEditModal()} 
            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200/50 font-black rounded-2xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" /> Add New City Override
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-5 rounded-2xl border-gray-100 shadow-sm bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tracked Cities</p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Globe className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-gray-100 shadow-sm bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Custom Overrides</p>
            <p className="text-2xl font-black text-emerald-600">{stats.customized}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-gray-100 shadow-sm bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Default Template</p>
            <p className="text-2xl font-black text-gray-600">{stats.defaultTemplate}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center font-bold">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-gray-100 shadow-sm bg-white flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Active Job Listings</p>
            <p className="text-2xl font-black text-indigo-600">{stats.totalJobs}+</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Briefcase className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              "px-4 py-2 text-xs font-black rounded-xl transition-all",
              filterTab === 'all' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            All Cities ({stats.total})
          </button>
          <button
            onClick={() => setFilterTab('customized')}
            className={cn(
              "px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5",
              filterTab === 'customized' 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Customized ({stats.customized})
          </button>
          <button
            onClick={() => setFilterTab('default')}
            className={cn(
              "px-4 py-2 text-xs font-black rounded-xl transition-all",
              filterTab === 'default' 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            Default Template ({stats.defaultTemplate})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search city by name (e.g. Mumbai, Pune, Bangalore)..." 
            className="pl-11 h-11 bg-gray-50/80 border-gray-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Cities */}
      {loading ? (
        <div className="py-28 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading City Ecosystem...</p>
        </div>
      ) : filteredCities.length === 0 ? (
        <div className="py-24 bg-white rounded-3xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center space-y-4 p-8">
          <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Globe className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900">No Cities Match "{searchQuery}"</h3>
          <p className="text-gray-500 text-xs font-medium max-w-md">
            You can create a custom content override for this city right now.
          </p>
          <Button 
            onClick={() => {
              setCurrentEdit({ city_name: searchQuery.toLowerCase() });
              setIsEditing(true);
            }}
            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Customize "{searchQuery}"
          </Button>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredCities.map((city) => (
              <motion.div
                key={city.citySlug}
                layout
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="group h-full"
              >
                <Card className={cn(
                  "p-6 rounded-[28px] bg-white h-full flex flex-col justify-between transition-all relative overflow-hidden border",
                  city.isCustomized 
                    ? "border-emerald-100 hover:border-emerald-300 shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10" 
                    : "border-gray-100 hover:border-indigo-200 shadow-sm hover:shadow-md"
                )}>
                  <div className="space-y-4">
                    {/* Top Row: Icon, Title, Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105",
                          city.isCustomized 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        )}>
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            {city.cityName}
                            {city.isCustomized && (
                              <span title="Customized Content Active">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="h-3 w-3 text-indigo-400" />
                            {city.jobCount} Active {city.jobCount === 1 ? 'Job' : 'Jobs'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {city.isCustomized ? (
                          <Badge className="bg-emerald-100/80 text-emerald-700 border-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            Customized
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            Default
                          </Badge>
                        )}
                        {!city.isActive && (
                          <Badge className="bg-rose-100 text-rose-600 border-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Preview Section */}
                    <div className="pt-3 border-t border-gray-100/80 space-y-2.5">
                      {city.isCustomized && city.content ? (
                        <>
                          <div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Custom Hero Heading</span>
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">
                              {city.content.heading || `Manufacturing Jobs in ${city.cityName}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Custom Description</span>
                            <p className="text-[11px] font-medium text-gray-500 line-clamp-2 leading-relaxed">
                              {city.content.description || 'Using standard description.'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="py-2.5 px-3 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                          <p className="text-[11px] font-medium text-gray-400 leading-snug">
                            Using global default template: <span className="font-bold text-gray-600">"Manufacturing Jobs in {city.cityName}"</span>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <a 
                      href={`/locations/india/job-in-${city.citySlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-indigo-600 transition-colors"
                      title="View public landing page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Page
                    </a>

                    <div className="flex items-center gap-2">
                      {city.isCustomized && city.content && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                          onClick={() => handleDelete(city.content!.id, city.cityName)}
                          title="Reset to default template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <Button 
                        size="sm"
                        onClick={() => openEditModal(city)}
                        className={cn(
                          "h-9 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all",
                          city.isCustomized
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        )}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {city.isCustomized ? 'Edit Content' : 'Customize'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsEditing(false)}
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[36px] shadow-2xl p-6 md:p-8 overflow-hidden z-10 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      {currentEdit.id ? 'Edit City Content' : 'Customize City Landing Page'}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Configure customized texts and SEO metadata.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto pr-2 py-6 space-y-6 flex-1">
                {/* Dynamic Variables Legend */}
                <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-indigo-100/40 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">
                      Dynamic Replacement Tags
                    </h4>
                  </div>
                  <p className="text-[11px] text-indigo-800 font-medium mb-3 leading-relaxed">
                    Insert these tags anywhere in the inputs below. They are automatically replaced with real database values when users visit the page:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => insertVariable('{cityName}', 'heading')}
                      className="cursor-pointer bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs shadow-sm transition-all"
                    >
                      {`{cityName}`}
                    </button>
                    <button 
                      type="button"
                      onClick={() => insertVariable('{jobCount}', 'subheading')}
                      className="cursor-pointer bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs shadow-sm transition-all"
                    >
                      {`{jobCount}`}
                    </button>
                    <button 
                      type="button"
                      onClick={() => insertVariable('{majorIndustry}', 'description')}
                      className="cursor-pointer bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs shadow-sm transition-all"
                    >
                      {`{majorIndustry}`}
                    </button>
                  </div>
                </div>

                {/* City Name Selection / Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Target City *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomCityInput(!customCityInput)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {customCityInput ? 'Select from tracked list' : 'Type a custom city name'}
                    </button>
                  </div>

                  {customCityInput ? (
                    <Input 
                      placeholder="e.g. Coimbatore, Jaipur, Chicago" 
                      value={currentEdit.city_name || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, city_name: e.target.value }))}
                      disabled={saving}
                      className="h-12 bg-gray-50 border-gray-200 rounded-xl font-bold"
                    />
                  ) : (
                    <select 
                      value={currentEdit.city_name || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, city_name: e.target.value }))}
                      disabled={!!currentEdit.id || saving}
                      className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-800 w-full focus:ring-2 focus:ring-indigo-200 outline-none"
                    >
                      <option value="" disabled>Select a city to customize</option>
                      {allDetectedCities.map(city => (
                        <option key={city} value={city.toLowerCase()}>
                          {city} {jobCityCounts[city.toLowerCase()] ? `(${jobCityCounts[city.toLowerCase()]} jobs)` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-gray-400 font-medium">
                    This slug connects to <code className="text-indigo-600">/locations/india/job-in-{currentEdit.city_name || 'city'}</code>.
                  </p>
                </div>

                {/* Hero Section Overrides */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Hero Heading Override
                    </label>
                    <Input 
                      placeholder="e.g. Top Manufacturing & Engineering Jobs in {cityName}" 
                      value={currentEdit.heading || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, heading: e.target.value }))}
                      disabled={saving}
                      className="h-12 bg-gray-50 border-gray-200 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Hero Subheading Override
                    </label>
                    <Input 
                      placeholder="e.g. Explore {jobCount}+ Verified Openings Today" 
                      value={currentEdit.subheading || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, subheading: e.target.value }))}
                      disabled={saving}
                      className="h-12 bg-gray-50 border-gray-200 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                      Hero Description Override
                    </label>
                    <Textarea 
                      placeholder="Discover verified career opportunities in manufacturing..." 
                      value={currentEdit.description || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, description: e.target.value }))}
                      disabled={saving}
                      className="min-h-[90px] bg-gray-50 border-gray-200 rounded-xl font-medium resize-none"
                    />
                  </div>
                </div>

                {/* SEO Overview & Salary Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-600" /> SEO Content & Salary Overviews
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Industry Overview Heading</label>
                    <Input 
                      placeholder="e.g. Industrial & Manufacturing Growth in {cityName}" 
                      value={currentEdit.seo_heading || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, seo_heading: e.target.value }))}
                      disabled={saving}
                      className="h-11 bg-gray-50 border-gray-200 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Industry Overview Description</label>
                    <Textarea 
                      placeholder="With {jobCount} active job vacancies across major industrial zones..." 
                      value={currentEdit.seo_description || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, seo_description: e.target.value }))}
                      disabled={saving}
                      className="min-h-[80px] bg-gray-50 border-gray-200 rounded-xl font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Salary & Benefits Heading</label>
                    <Input 
                      placeholder="e.g. Salary Benchmarks & Benefits in {cityName}" 
                      value={currentEdit.salary_heading || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, salary_heading: e.target.value }))}
                      disabled={saving}
                      className="h-11 bg-gray-50 border-gray-200 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Salary & Benefits Description</label>
                    <Textarea 
                      placeholder="Manufacturing companies in {cityName} provide competitive compensation packages..." 
                      value={currentEdit.salary_description || ''}
                      onChange={(e) => setCurrentEdit(prev => ({ ...prev, salary_description: e.target.value }))}
                      disabled={saving}
                      className="min-h-[80px] bg-gray-50 border-gray-200 rounded-xl font-medium resize-none"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <label htmlFor="is_active" className="text-xs font-black text-gray-900 block">
                      Enable Override on Public Page
                    </label>
                    <p className="text-[10px] text-gray-400 font-medium">When checked, visitors to this city will see your custom text instead of defaults.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={currentEdit.is_active ?? true}
                    onChange={(e) => setCurrentEdit(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded-lg border-gray-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="h-12 px-6 border-gray-200 text-gray-600 font-bold rounded-xl"
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200"
                  type="button"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {currentEdit.id ? 'Save Changes' : 'Create Override'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
