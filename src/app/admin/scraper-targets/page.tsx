"use client";
// Scraper Targets Management Page

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Textarea, Select } from '@/components/ui';
import { 
  Plus, 
  Trash2, 
  Loader2,
  ListPlus,
  RefreshCw,
  Globe,
  Upload,
  AlignLeft,
  Play,
  ChevronDown,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ScraperUrl {
  id: string;
  url: string;
  company_name?: string;
  location?: string;
  is_active: boolean;
  last_scraped_at?: string;
  created_at: string;
}

const DEFAULT_TARGETS = [
  { name: 'Hero MotoCorp', url: 'https://jobs.heromotocorp.com/search/?createNewAlert=false&q=&optionsFacetsDD_department=&locationsearch=India' },
  { name: 'Darwinbox (JSL)', url: 'https://jslhrms.darwinbox.in/ms/candidatev2/main/careers/allJobs' },
  { name: 'Unilever', url: 'https://careers.unilever.com/en/search-jobs/India/34155/2/1269750/22/79/100/2' },
  { name: 'Mercedes-Benz', url: 'https://jobs.mercedes-benz.com/en?en=&PositionLocation.Country=[390]&JobCategory.Code=[46]' },
  { name: 'Caterpillar', url: 'https://careers.caterpillar.com/en/jobs/?search=&country=India#results' },
  { name: 'Tenneco', url: 'https://jobs.tenneco.com/search/?createNewAlert=false&q=engineer&locationsearch=India' },
  { name: 'Maruti Suzuki', url: 'https://maruti.app.param.ai/jobs/?filters=Job%2520Category%255B%255D=Finance%26Job%2520Category%255B%255D=Accounting%252FAuditing%26Job%2520Category%255B%255D=Analyst%26Job%2520Category%255B%255D=Construction%26Job%2520Location%255B%255D=Gurgaon%26Job%2520Type%255B%255D=Full-time' },
  { name: 'Bajaj Electricals', url: 'https://careers.bajajelectricals.com/search/?createNewAlert=false&q=UI%2FUX+Designer&locationsearch=india' },
  { name: 'Bajaj Auto', url: 'https://www.bajajauto.com/careers/search-result' },
  { name: 'Ashok Leyland', url: 'https://ashokleyland.darwinbox.in/ms/candidate/a61cb038c35a54/careers' },
  { name: 'Aditya Birla', url: 'https://careers.adityabirla.com/jobs/search' },
  { name: 'TechnipFMC', url: 'https://careers.technipfmc.com/search/?createNewAlert=false&q=&locationsearch=india&optionsFacetsDD_customfield4=&optionsFacetsDD_customfield2=&optionsFacetsDD_customfield3=' },
  { name: 'Siemens', url: 'https://jobs.siemens.com/en_US/externaljobs/SearchJobs/?42414=%5B812053%5D&42414_format=17570&listFilterMode=1&folderRecordsPerPage=6&' },
  { name: 'Apollo Tyres', url: 'https://apollotyres.csod.com/ux/ats/careersite/1/home?c=apollotyres&country=in' },
  { name: 'Royal Enfield', url: 'https://careers.royalenfield.com/us/en/search-results' },
  { name: 'Panasonic', url: 'https://careers.na.panasonic.com/jobs?locations=Mumbai,,India%7CNew%20Delhi,,India%7CPune,,India&page=1' },
  { name: 'Oracle', url: 'https://fa-escq-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs?location=India&locationId=300000000446243&locationLevel=country&mode=location' },
  { name: 'Honeywell', url: 'https://careers.honeywell.com/en/sites/Honeywell/jobs?lastSelectedFacet=CATEGORIES&location=India&locationId=300000000469485&locationLevel=country&mode=location&selectedCategoriesFacet=300000017425649' }
];

export default function ScraperTargetsManagement() {
  const [urls, setUrls] = useState<ScraperUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSingle, setAddingSingle] = useState(false);
  const [addingBulk, setAddingBulk] = useState(false);
  
  const [singleUrl, setSingleUrl] = useState('');
  const [singleName, setSingleName] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [urlLogs, setUrlLogs] = useState<Record<string, string>>({});


  // Scraper Trigger States
  const [triggering, setTriggering] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [scrapeFilters, setScrapeFilters] = useState({
    jobType: 'All',
    jobAge: 'Any',
    experienceLevel: 'All',
    duplicateJob: 'Skip',
    country: 'All',
    maxDescLength: 0,
    target: 'New Only',
    targetUrl: ''
  });

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
      if (!data || data.length === 0) {
        // Auto-seed if empty
        const inserts = DEFAULT_TARGETS.map(t => ({
          url: t.url,
          company_name: t.name,
          is_active: true
        }));
        const { error: seedError } = await supabase.from('scraper_urls').insert(inserts);
        if (!seedError) {
          fetchUrls(); // Re-fetch after seeding
          return;
        }
      }
      setUrls(data || []);

      // ✨ SMART FALLBACK: Fetch latest logs to find last scraped date if column is missing
      const { data: logs } = await supabase
        .from('scraper_logs')
        .select('error_message, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (logs) {
        const logMap: Record<string, string> = {};
        logs.forEach(l => {
          if (!logMap[l.error_message]) {
            logMap[l.error_message] = l.created_at;
          }
        });
        setUrlLogs(logMap);
      }
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
        const addedUrl = singleUrl.trim();
        setSingleUrl('');
        fetchUrls();
        
        // Auto-trigger scraper for this newly added URL specifically
        handleTriggerSingleScraper(addedUrl, true);
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
      const urlArray = bulkUrls
        .split(/[\n,]+/)
        .map(u => u.trim())
        .filter(u => u.length > 5);

      if (urlArray.length === 0) return;

      const inserts = urlArray.map(url => ({ 
        url,
        company_name: url.split('/')[2].replace('www.', '').split('.')[0].toUpperCase()
      }));

      const { error } = await supabase.from('scraper_urls').insert(inserts);
      if (error) throw error;
      
      setBulkUrls('');
      fetchUrls();
    } catch (err: any) {
      alert("Error bulk adding URLs: " + err.message);
    } finally {
      setAddingBulk(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Add default career targets to the database?')) return;
    setLoading(true);
    try {
      const inserts = DEFAULT_TARGETS.map(t => ({
        url: t.url,
        company_name: t.name,
        is_active: true
      }));

      const { error } = await supabase.from('scraper_urls').insert(inserts);
      if (error) throw error;
      
      fetchUrls();
    } catch (err: any) {
      alert('Error seeding: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSwitch = async (id: string, currentUrl: string, targetLocation: 'India' | 'US') => {
    let newUrl = currentUrl;
    if (targetLocation === 'US') {
      newUrl = currentUrl
        .replace(/locationsearch=India/gi, 'locationsearch=United States')
        .replace(/location=India/gi, 'location=United States')
        .replace(/country=India/gi, 'country=United States')
        .replace(/country=in/gi, 'country=us')
        .replace(/India/g, 'United States');
    } else {
      newUrl = currentUrl
        .replace(/locationsearch=United States/gi, 'locationsearch=India')
        .replace(/location=United States/gi, 'location=India')
        .replace(/country=United States/gi, 'country=India')
        .replace(/country=us/gi, 'country=in')
        .replace(/United States/g, 'India');
    }

    try {
      const { error } = await supabase
        .from('scraper_urls')
        .update({ url: newUrl })
        .eq('id', id);
      
      if (error) throw error;
      fetchUrls();
    } catch (err: any) {
      alert('Error updating location: ' + err.message);
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

  const handleTriggerScraper = async () => {
    setTriggering(true);
    setShowFilters(false);
    try {
      const response = await fetch('/api/scraper', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: scrapeFilters })
      });
      const data = await response.json();
      if (data.success) {
        alert('Scraper initiated with selected filters!');
        fetchUrls();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error triggering scraper: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  const handleTriggerSingleScraper = async (url: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm(`Run scraper specifically for this URL?\n${url}`)) return;
    setTriggering(true);
    try {
      const response = await fetch('/api/scraper', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { ...scrapeFilters, targetUrl: url } })
      });
      const data = await response.json();
      if (data.success) {
        alert('Scraper initiated for this specific URL!');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error triggering scraper: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };
  const filteredUrlsList = urls.filter(u => {
    const matchesSearch = (u.url || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (u.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && u.is_active) || 
                         (filterStatus === 'inactive' && !u.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Scraper Targets</h1>
          <p className="text-gray-500">Configure and manage active job discovery targets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSeedDefaults} variant="outline" className="bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold">
            <RefreshCw className="mr-2 h-4 w-4" /> Seed Defaults
          </Button>
          <Button onClick={fetchUrls} variant="ghost" className="text-gray-500 hover:text-indigo-600 font-bold">
             Refresh List
          </Button>
          
          <div className="relative">
            <div className="flex items-center gap-0">
              <Button 
                size="lg" 
                onClick={handleTriggerScraper}
                disabled={loading || triggering}
                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-l-xl rounded-r-none shadow-lg shadow-indigo-100 transition-all font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-r border-indigo-500/30"
              >
                {loading || triggering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                {triggering ? 'Starting...' : 'Run Scraper'}
              </Button>
              <Button
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                disabled={loading || triggering}
                className="h-12 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-xl rounded-l-none shadow-lg shadow-indigo-100 transition-all border-l border-indigo-700/20"
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform", showFilters && "rotate-180")} />
              </Button>
            </div>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 z-50">
                <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" /> Scraper Settings
                </h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target URL (Optional)</label>
                    <Input 
                      placeholder="Paste specific URL to scrape only this one..." 
                      value={scrapeFilters.targetUrl}
                      onChange={(e) => setScrapeFilters({...scrapeFilters, targetUrl: e.target.value})}
                      className="h-9 text-xs"
                    />
                    <p className="text-[9px] text-gray-400">Leave empty to scrape all active URLs in the database.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Full-time', 'Contract'].map(type => (
                        <button
                          key={type}
                          onClick={() => setScrapeFilters({...scrapeFilters, jobType: type})}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            scrapeFilters.jobType === type ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Job Age</label>
                    <div className="flex flex-wrap gap-2">
                      {['Any', '24h', '7d', '30d', '60d'].map(age => (
                        <button
                          key={age}
                          onClick={() => setScrapeFilters({...scrapeFilters, jobAge: age})}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            scrapeFilters.jobAge === age ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience Level</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Entry', 'Mid', 'Senior', 'Lead'].map(exp => (
                        <button
                          key={exp}
                          onClick={() => setScrapeFilters({...scrapeFilters, experienceLevel: exp})}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            scrapeFilters.experienceLevel === exp ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country</label>
                      <Select 
                        value={scrapeFilters.country}
                        onChange={(e) => setScrapeFilters({...scrapeFilters, country: e.target.value})}
                        className="h-9 text-[11px] px-2"
                      >
                        {['All', 'USA', 'India', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Remote', 'Japan', 'China', 'Brazil', 'Netherlands', 'Sweden', 'Switzerland', 'Ireland', 'Spain', 'Italy', 'South Africa'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Desc Length</label>
                      <Input 
                        type="number"
                        value={scrapeFilters.maxDescLength}
                        onChange={(e) => setScrapeFilters({...scrapeFilters, maxDescLength: parseInt(e.target.value) || 0})}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discovery Mode</label>
                    <div className="flex gap-2">
                      {['New Only', 'All Data'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setScrapeFilters({...scrapeFilters, target: opt})}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                            scrapeFilters.target === opt ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-gray-400">'New Only' skips URLs scraped in the last 24h.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duplicate Job</label>
                    <div className="flex gap-2">
                      {['Skip', 'Overwrite'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setScrapeFilters({...scrapeFilters, duplicateJob: opt})}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                            scrapeFilters.duplicateJob === opt ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <Button 
                      className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      onClick={handleTriggerScraper}
                      loading={triggering}
                    >
                      Start Discovery Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Forms to Add URLs */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border-0 shadow-sm border-t-4 border-t-primary">
            <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> New Discovery Target
            </h3>
            <form onSubmit={handleAddSingle} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name</label>
                <Input 
                  placeholder="e.g. Google" 
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Career URL</label>
                <Input 
                  placeholder="https://careers.google.com..." 
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" loading={addingSingle} className="w-full h-11 bg-indigo-600 font-bold">
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
          <Card className="p-0 bg-white border-0 shadow-sm min-h-[500px] overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                <h3 className="font-black text-gray-900 text-lg">Discovery Pipeline ({filteredUrlsList.length})</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group flex-1 md:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input 
                    placeholder="Filter by company or URL..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-xs border-gray-100 bg-gray-50 focus:bg-white"
                  />
                </div>
                <Select 
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                  className="h-9 text-xs w-32 px-2"
                >
                  <option value="all">All Targets</option>
                  <option value="active">Active</option>
                  <option value="inactive">Disabled</option>
                </Select>
              </div>
            </div>

            {loading && urls.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="h-10 w-10 animate-spin text-indigo-500/30" />
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scanning infrastructure...</p>
              </div>
            ) : filteredUrlsList.length === 0 ? (
              <div className="text-center py-32 bg-gray-50/50">
                <ListPlus className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900">No Pipeline Targets</h3>
                <p className="text-gray-500 text-sm mt-1 font-medium max-w-xs mx-auto">Either you haven't added any URLs yet, or your search criteria returned zero results.</p>
                <Button onClick={handleSeedDefaults} variant="outline" className="mt-6 font-bold border-indigo-100 text-indigo-600">Seed Default Targets</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company & Location</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Discovery URL</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Scraped</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUrlsList.map((target) => {
                      const hasLocationParam = target.url.toLowerCase().includes('india') || target.url.toLowerCase().includes('united states') || target.url.toLowerCase().includes('country=');
                      const isIndia = target.url.toLowerCase().includes('india') || target.url.toLowerCase().includes('country=in');
                      
                      return (
                        <tr key={target.id} className="hover:bg-indigo-50/10 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{target.company_name || 'Unknown Company'}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-[8px] px-1.5 py-0 font-black uppercase tracking-tighter", target.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                                  {target.is_active ? 'Discovery Active' : 'Pipeline Disabled'}
                                </Badge>
                                {hasLocationParam && (
                                  <div className="flex items-center gap-1">
                                    <select 
                                      className="text-[9px] font-black border-none bg-indigo-50 text-indigo-600 rounded px-1 cursor-pointer outline-none"
                                      value={isIndia ? 'India' : 'US'}
                                      onChange={(e) => handleLocationSwitch(target.id, target.url, e.target.value as any)}
                                    >
                                      <option value="India">📍 India</option>
                                      <option value="US">🇺🇸 US</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1 max-w-[300px]">
                              <a href={target.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-500 truncate hover:underline">
                                {target.url}
                              </a>
                              <span className="text-[9px] text-gray-400 font-medium">Added {new Date(target.created_at).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-gray-700">
                                {(target.last_scraped_at || urlLogs[target.url]) 
                                  ? new Date(target.last_scraped_at || urlLogs[target.url]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                                  : 'Never Scraped'}
                              </span>
                              {(target.last_scraped_at || urlLogs[target.url]) && (
                                <span className="text-[9px] font-bold text-gray-400">
                                  {new Date(target.last_scraped_at || urlLogs[target.url]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-3 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                onClick={() => handleTriggerSingleScraper(target.url)}
                              >
                                <Play className="h-3 w-3 mr-1.5" /> RUN
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className={cn("h-8 px-3 text-[10px] font-black rounded-lg", target.is_active ? "text-orange-600 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50")}
                                onClick={() => toggleStatus(target.id, target.is_active)}
                              >
                                {target.is_active ? 'DISABLE' : 'ENABLE'}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                onClick={() => handleDelete(target.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
