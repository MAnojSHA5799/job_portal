"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, Button, Input } from '@/components/ui';
import { 
  MapPin, 
  Loader2, 
  Sparkles, 
  Save, 
  X,
  Search,
  Globe,
  Building2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Wand2,
  Zap,
  Star,
  Eye,
  FileText
} from 'lucide-react';
import { calculateSEOScore, SEOCheck } from '@/lib/seo-utils';
import { supabase } from '@/lib/supabase';
import { enhanceCompanySEO } from '@/lib/seo-enhancer';

interface Company {
  id?: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  career_page_url?: string;
  description: string;
  logo_url: string;
  seo_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  url_slug?: string;
  seo_score?: number;
  team_size?: string;
  rating?: number;
}

interface CompanyFormProps {
  initialData?: Partial<Company>;
  onSave: (data: Company, publish?: boolean) => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export function CompanyForm({ 
  initialData, 
  onSave, 
  onCancel, 
  loading,
  title = "Company Profile",
  subtitle = "Update company branding and SEO"
}: CompanyFormProps) {
  const [currentCompany, setCurrentCompany] = useState<Company>({
    name: '',
    industry: 'Technology',
    location: '',
    website: '',
    career_page_url: '',
    description: '',
    logo_url: '',
    seo_title: '',
    meta_description: '',
    focus_keyword: '',
    url_slug: '',
    seo_score: 0,
    team_size: '',
    rating: 4.5,
    ...initialData
  });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fixingCheckId, setFixingCheckId] = useState<number | null>(null);

  // Real-time SEO Scoring
  const seoReport = calculateSEOScore({
    title: currentCompany.name,
    description: currentCompany.description,
    seo_title: currentCompany.seo_title,
    meta_description: currentCompany.meta_description,
    focus_keyword: currentCompany.focus_keyword,
    url_slug: currentCompany.url_slug,
    location: currentCompany.location
  });

  const generateFocusKeyword = (name: string, location: string | null | undefined) => {
    if (!location) return name || '';
    return `${name} ${location.split(',')[0]}`.trim();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setCurrentCompany({ ...currentCompany, logo_url: data.publicUrl });
    } catch (error: any) {
      alert('Error uploading logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };


  const handleAIFix = async (check: SEOCheck) => {
    setFixingCheckId(check.id);
    try {
      if (check.category === 'title') {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Rewrite this SEO title for a company profile: ${currentCompany.name}. 
MANDATORY: 50-60 chars. Start with focus keyword. Return ONLY the title string.`
              },
              {
                role: 'user',
                content: `Focus Keyword: ${currentCompany.focus_keyword}, Location: ${currentCompany.location}, Industry: ${currentCompany.industry}`
              }
            ]
          })
        });
        const data = await response.json();
        setCurrentCompany({ ...currentCompany, seo_title: data.choices[0].message.content.replace(/"/g, '') });
      } else if (check.category === 'meta') {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Rewrite this meta description for a company profile. 
MANDATORY: 130-160 chars. Include focus keyword. Return ONLY the meta string.`
              },
              {
                role: 'user',
                content: `Company: ${currentCompany.name}, Focus Keyword: ${currentCompany.focus_keyword}, Industry: ${currentCompany.industry}, Location: ${currentCompany.location}`
              }
            ]
          })
        });
        const data = await response.json();
        setCurrentCompany({ ...currentCompany, meta_description: data.choices[0].message.content.replace(/"/g, '') });
      } else if (check.category === 'url') {
        const slug = (currentCompany.focus_keyword || '')
          .toLowerCase()
          .replace(/\b(in|at|for|the|and|a|an|with|by|to|from)\b/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        setCurrentCompany({ ...currentCompany, url_slug: slug });
      } else if (check.category === 'content') {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Fix this SEO issue in company description: ${check.name}. Return ONLY updated HTML.`
              },
              {
                role: 'user',
                content: `Current Description: ${currentCompany.description}, Focus Keyword: ${currentCompany.focus_keyword}`
              }
            ]
          })
        });
        const data = await response.json();
        const updatedContent = data.choices[0].message.content.replace(/```html|```/g, '').trim();
        setCurrentCompany({ ...currentCompany, description: updatedContent });
      }
    } catch (error) {
      console.error('AI Fix Error:', error);
    } finally {
      setFixingCheckId(null);
    }
  };

  const handleFixAllChecklist = async () => {
    setIsFixingAll(true);
    try {
      const enhanced = await enhanceCompanySEO(currentCompany);

      setCurrentCompany(prev => ({
        ...prev,
        focus_keyword: enhanced.focus_keyword,
        seo_title: enhanced.seo_title,
        meta_description: enhanced.meta_description,
        url_slug: enhanced.url_slug,
        description: enhanced.description,
        seo_score: enhanced.seo_score
      }));
    } catch (error) {
      console.error('All Checklist Enhance Error:', error);
      alert('Failed to enhance checklist.');
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!currentCompany.description) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceCompanySEO(currentCompany);
      
      setCurrentCompany({ 
        ...currentCompany, 
        focus_keyword: enhanced.focus_keyword,
        seo_title: enhanced.seo_title,
        meta_description: enhanced.meta_description,
        url_slug: enhanced.url_slug,
        description: enhanced.description,
        seo_score: enhanced.seo_score
      });
    } catch (error) {
      console.error('Enhance Error:', error);
      alert('Failed to enhance description.');
    } finally {
      setIsEnhancing(false);
    }
  };


  const internalOnSave = (publish: boolean = true) => {
    if (!currentCompany.name || !currentCompany.description) {
      alert('Please fill in required fields (Name, Description)');
      return;
    }
    const { is_approved, ...companyData } = currentCompany as any;
    const finalCompany = {
      ...companyData,
      seo_score: seoReport.score
    };
    onSave(finalCompany, publish);
  };

  return (
    <Card className="p-0 border-0 bg-transparent shadow-none overflow-visible">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Main Company Details Form */}
        <div className="flex-1 bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
              <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-rose-50 hover:text-rose-500">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Company Name *</label>
                <Input 
                  className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. Acme Corp" 
                  value={currentCompany.name}
                  onChange={e => setCurrentCompany({...currentCompany, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Industry</label>
                <Input 
                  className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. Technology" 
                  value={currentCompany.industry}
                  onChange={e => setCurrentCompany({...currentCompany, industry: e.target.value})}
                  list="industry-options"
                />
                <datalist id="industry-options">
                  <option value="Technology" />
                  <option value="Fintech" />
                  <option value="Healthcare" />
                  <option value="E-commerce" />
                  <option value="Social Media" />
                  <option value="Entertainment" />
                </datalist>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Team Size</label>
                <Input 
                  className="h-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                  placeholder="e.g. 10-50, 100+, 5000+" 
                  value={currentCompany.team_size}
                  onChange={e => setCurrentCompany({...currentCompany, team_size: e.target.value})}
                  list="teamsize-options"
                />
                <datalist id="teamsize-options">
                  <option value="1-10" />
                  <option value="11-50" />
                  <option value="51-200" />
                  <option value="201-500" />
                  <option value="501-1000" />
                  <option value="1000+" />
                  <option value="5000+" />
                  <option value="10000+" />
                </datalist>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                  <Input 
                    className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="e.g. Pune, Maharashtra" 
                    value={currentCompany.location}
                    onChange={e => setCurrentCompany({...currentCompany, location: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Company Rating (0-5)</label>
                <div className="relative">
                  <Star className="absolute left-4 top-4 h-4 w-4 text-amber-400 fill-amber-400" />
                  <Input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="e.g. 4.5" 
                    value={currentCompany.rating}
                    onChange={e => setCurrentCompany({...currentCompany, rating: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Official Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-4 h-4 w-4 text-indigo-400" />
                  <Input 
                    className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="https://company.com" 
                    value={currentCompany.website}
                    onChange={e => setCurrentCompany({...currentCompany, website: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Careers Page Link</label>
                <div className="relative">
                  <Zap className="absolute left-4 top-4 h-4 w-4 text-amber-400" />
                  <Input 
                    className="h-12 pl-12 border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                    placeholder="https://company.com/careers" 
                    value={currentCompany.career_page_url}
                    onChange={e => setCurrentCompany({...currentCompany, career_page_url: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Company Logo</label>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                    {currentCompany.logo_url ? (
                      <img src={currentCompany.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="relative flex-1">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                      onChange={handleFileUpload}
                      accept="image/*"
                      disabled={uploading}
                    />
                    <Button variant="outline" className="h-12 w-full rounded-xl border-gray-100 bg-gray-50 hover:bg-white transition-all shadow-sm" disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      {currentCompany.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Company Synopsis *</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleEnhanceDescription}
                disabled={isEnhancing}
                className="h-8 px-3 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg uppercase tracking-wider"
              >
                {isEnhancing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
                AI Enhance
              </Button>
            </div>
            <textarea 
              className="w-full min-h-[300px] rounded-[24px] border-0 bg-gray-50 p-6 text-sm font-medium leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              placeholder="Describe the company mission, values, and history..."
              value={currentCompany.description}
              onChange={e => setCurrentCompany({...currentCompany, description: e.target.value})}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8">
             <Button 
               variant="outline"
               onClick={() => window.open(`/company/${currentCompany.url_slug || currentCompany.id}`, '_blank')}
               className="h-14 px-8 border-2 border-indigo-100 bg-white text-indigo-600 font-black rounded-2xl transition-all w-full sm:w-auto hover:bg-indigo-50 flex items-center justify-center whitespace-nowrap shrink-0"
             >
               <Eye className="h-5 w-5 mr-2" />
               PREVIEW
             </Button>

             <Button 
               variant="outline"
               onClick={() => internalOnSave(false)}
               disabled={loading}
               className="h-14 px-8 border-2 border-gray-100 bg-white text-gray-600 font-black rounded-2xl transition-all w-full sm:w-auto hover:bg-gray-50 flex items-center justify-center whitespace-nowrap shrink-0"
             >
               <FileText className="h-5 w-5 mr-2" />
               SAVE DRAFT
             </Button>

             <Button 
               onClick={() => internalOnSave(true)} 
               disabled={loading} 
               className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 w-full sm:w-auto flex items-center justify-center whitespace-nowrap shrink-0"
             >
               {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
               PUBLISH
             </Button>
          </div>
        </div>

        {/* SEO Sidebar */}
        <aside className="w-full xl:w-[450px] space-y-8 sticky top-10">
          <Card className="p-8 bg-gray-900 text-white rounded-[32px] border-0 shadow-2xl shadow-indigo-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-400" /> SEO Standards
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Get noticed on Search Engines.</p>
              </div>
              <div className={cn(
                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black",
                seoReport.score >= 85 ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
              )}>
                <span className="text-2xl">{seoReport.score}</span>
                <span className="text-[8px] uppercase tracking-tighter opacity-60">Score</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Focus Keyword</label>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-indigo-500/50"
                    placeholder="e.g. Acme Corp Pune"
                    value={currentCompany.focus_keyword}
                    onChange={e => setCurrentCompany({...currentCompany, focus_keyword: e.target.value})}
                  />
                </div>
                {!currentCompany.focus_keyword && currentCompany.name && (
                   <button 
                     onClick={() => setCurrentCompany({...currentCompany, focus_keyword: generateFocusKeyword(currentCompany.name, currentCompany.location)})}
                     className="text-[10px] font-bold text-indigo-400 mt-2 hover:underline"
                   >
                     + Auto-generate Keyword
                   </button>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">URL Slug</label>
                <div className="relative">
                  <Zap className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                  <Input 
                    className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:ring-indigo-500/50"
                    placeholder="acme-corp-pune"
                    value={currentCompany.url_slug}
                    onChange={e => {
                        const val = e.target.value.toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except space and hyphen
                            .replace(/\s+/g, '-')       // Replace spaces with hyphens
                            .replace(/-+/g, '-');       // Replace multiple hyphens with single hyphen
                        setCurrentCompany({...currentCompany, url_slug: val});
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">SEO Title</label>
                <div className="relative group">
                  <Input 
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl pr-12 focus:ring-indigo-500/50"
                    value={currentCompany.seo_title}
                    onChange={e => setCurrentCompany({...currentCompany, seo_title: e.target.value})}
                  />
                  <span className={cn(
                    "absolute right-4 top-4 text-[10px] font-black",
                    (currentCompany.seo_title?.length || 0) >= 50 && (currentCompany.seo_title?.length || 0) <= 60 ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {currentCompany.seo_title?.length || 0}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Meta Description</label>
                <div className="relative">
                  <textarea 
                    className="w-full min-h-[100px] bg-white/5 border border-white/10 text-white text-sm p-4 rounded-xl focus:ring-indigo-500/50 outline-none transition-all"
                    value={currentCompany.meta_description}
                    onChange={e => setCurrentCompany({...currentCompany, meta_description: e.target.value})}
                  />
                  <span className={cn(
                    "absolute right-4 bottom-4 text-[10px] font-black",
                    (currentCompany.meta_description?.length || 0) >= 130 && (currentCompany.meta_description?.length || 0) <= 160 ? "text-emerald-400" : "text-orange-400"
                  )}>
                    {currentCompany.meta_description?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-white/10">
              <Button 
                onClick={handleFixAllChecklist}
                disabled={isFixingAll}
                className="h-12 w-full text-[12px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-500/20"
              >
                {isFixingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Full SEO Optimization
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/30 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> SEO Checklist
              </h4>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {seoReport.checks.map((check) => (
                <div key={check.id} className="flex items-start justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="flex gap-3">
                    {check.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-800">{check.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium leading-tight">{check.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-black", check.passed ? "text-emerald-500" : "text-gray-300")}>+{check.points}</span>
                    {!check.passed && check.autoFixAvailable && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleAIFix(check)}
                        disabled={fixingCheckId === check.id}
                        className="h-6 px-2 text-[9px] font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {fixingCheckId === check.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Wand2 className="h-3 w-3 mr-1" /> FIX</>}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </aside>
      </div>
    </Card>
  );
}
