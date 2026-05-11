import React from 'react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Star,
  ChevronRight,
  Zap,
  Building2,
  TrendingUp,
  Landmark,
  Map,
  Users
} from 'lucide-react';
import { ApplyButton } from '@/components/ApplyButton';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityParam = (await params).city;
  if (!cityParam) return { title: 'Jobs' };
  
  const city = cityParam.charAt(0).toUpperCase() + cityParam.slice(1);
  const title = `Manufacturing Jobs in ${city} — Hiring Now | http://www.hiringstores.com`;
  const description = `Discover top manufacturing and industrial jobs in ${city}. Hiring now for CNC operators, engineers, and production roles. View salary ranges and top employers in ${city}.`;

  return {
    title,
    description,
  };
}

export default async function LocationPage({ params }: Props) {
  const citySlug = (await params).city;
  if (!citySlug) return null;
  
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  // Fetch jobs in this city
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .ilike('location', `%${cityName}%`)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  // Fetch unique categories (roles) in this city for sidebar
  const { data: cityRoles } = await supabase
    .from('jobs')
    .select('category')
    .ilike('location', `%${cityName}%`)
    .eq('is_approved', true);

  const topRoles = Array.from(new Set(cityRoles?.map(j => j.category).filter(Boolean))).slice(0, 5);

  // Fetch top companies in this city
  const { data: topCompanies } = await supabase
    .from('companies')
    .select('*')
    .ilike('location', `%${cityName}%`)
    .limit(3);

  const jobCount = jobs?.length || 0;
  const majorIndustry = jobs?.[0]?.companies?.industry || 'Manufacturing';

  // ItemList Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": jobs?.slice(0, 10).map((job: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://http://www.hiringstores.com/jobs/${job.url_slug || job.id}`,
        "name": job.title
    }))
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* City Hero */}
      <div className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white">
          <Badge className="mb-6 bg-indigo-600 text-white border-0 font-bold px-4 py-1 uppercase tracking-widest">Local Jobs</Badge>
          <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
            Manufacturing Jobs in {cityName} — {jobCount} Openings Hiring Now
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
            {cityName} is a key industrial hub. Explore {jobCount} verified career opportunities in {majorIndustry} and other sectors within the city.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* SEO Content: Dynamic Industry Overview */}
            <Card className="p-10 border-0 shadow-2xl shadow-gray-100 bg-white rounded-[40px] prose prose-slate max-w-none">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-600" /> Manufacturing Industry in {cityName}
                </h2>
                <p className="text-gray-600 font-medium">
                    With {jobCount} active job openings, {cityName} continues to be a destination for skilled workers in India. The local industry is characterized by a strong presence of {majorIndustry} companies, offering roles ranging from production and operations to specialized engineering.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 not-prose">
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
                        <h4 className="font-black text-indigo-900 text-sm mb-1">Active Openings</h4>
                        <p className="text-xs text-indigo-700 font-bold">{jobCount} Live Positions</p>
                    </div>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <Users className="w-8 h-8 text-emerald-600 mb-3" />
                        <h4 className="font-black text-emerald-900 text-sm mb-1">Top Sector</h4>
                        <p className="text-xs text-emerald-700 font-bold">{majorIndustry}</p>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                        <Landmark className="w-8 h-8 text-amber-600 mb-3" />
                        <h4 className="font-black text-amber-900 text-sm mb-1">Location</h4>
                        <p className="text-xs text-amber-700 font-bold">{cityName}, India</p>
                    </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4">Salary & Benefits in {cityName}</h3>
                <p className="text-gray-600 font-medium">
                    Manufacturing companies in {cityName} provide competitive compensation packages. Current listings show a variety of roles with benefits like PF, ESIC, and performance bonuses. Most employers in the area prioritize safety and skill development for their workforce.
                </p>
            </Card>

            <div className="space-y-6">
               <h2 className="text-2xl font-black text-gray-900 px-2">Job Listings in {cityName}</h2>
               {jobs && jobs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {jobs.map((job) => (
                      <Card key={job.id} className="p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all bg-white group rounded-[2.5rem] overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-0 group-hover:h-full bg-indigo-600 transition-all duration-300" />
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white flex items-center justify-center text-3xl font-black text-indigo-600 border border-gray-50 transition-all shrink-0 overflow-hidden shadow-sm p-2 group-hover:border-indigo-100">
                            {job.companies?.logo_url ? (
                              <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                            ) : (
                              job.companies?.name?.charAt(0) || 'G'
                            )}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                <a href={`/jobs/${job.url_slug || job.id}`}>{job.title}</a>
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                  <Briefcase className="w-3 h-3" /> {job.companies?.name}
                                </span>
                                <span className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-indigo-600" /> {job.location}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px] px-4 py-1.5 rounded-lg border-0">{job.salary_range || 'Competitive Pay'}</Badge>
                              <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold text-[10px] px-4 py-1.5 rounded-lg border-0">{job.job_type}</Badge>
                              <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold text-[10px] px-4 py-1.5 rounded-lg border-0">{job.experience_level}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                            <a href={`/jobs/${job.url_slug || job.id}`} className="flex-1 md:flex-none">
                              <Button variant="outline" className="w-full md:w-auto h-12 px-8 rounded-2xl font-bold border-gray-100 hover:border-indigo-600 hover:text-indigo-600 transition-all text-xs">
                                  Quick View
                              </Button>
                            </a>
                            <ApplyButton 
                              jobId={job.id}
                              jobTitle={job.title}
                              companyId={job.companies?.id}
                              companyName={job.companies?.name}
                              applyLink={job.apply_link || '#'}
                              className="flex-1 md:flex-none h-12 text-xs px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                        <MapPin className="w-10 h-10" />
                     </div>
                     <h3 className="text-2xl font-black text-gray-900 mb-2">No jobs in {cityName} yet</h3>
                     <p className="text-gray-500 font-medium">Try searching in nearby cities or different categories.</p>
                  </div>
                )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {topCompanies && topCompanies.length > 0 && (
                <Card className="p-8 border-0 shadow-xl shadow-gray-100 bg-white rounded-[40px]">
                <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" /> Top Employers in {cityName}
                </h3>
                <div className="space-y-4">
                    {topCompanies.map((comp) => (
                        <a key={comp.id} href={`/company/${comp.url_slug || comp.id}`} className="block p-5 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 group">
                            <h4 className="font-black text-gray-900 text-sm group-hover:text-indigo-600">{comp.name}</h4>
                            <p className="text-xs text-gray-500 font-bold mt-1">{comp.industry || 'Manufacturing'}</p>
                        </a>
                    ))}
                </div>
                </Card>
            )}

            {topRoles.length > 0 && (
                <Card className="p-8 border-0 shadow-2xl shadow-indigo-100/20 bg-white rounded-[40px]">
                    <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Trending Roles in {cityName}</h3>
                    <div className="space-y-3">
                        {topRoles.map((role) => (
                            <a 
                                key={role} 
                                href={`/jobs/${role.toLowerCase().replace(' ', '-')}`}
                                className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-600 hover:text-white transition-all font-bold text-gray-600"
                            >
                                {role} <ChevronRight className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </Card>
            )}

            <Card className="p-8 border-0 shadow-2xl shadow-indigo-600 bg-indigo-600 text-white rounded-[40px]">
               <Zap className="w-8 h-8 mb-4 fill-white animate-pulse" />
               <h3 className="text-lg font-black mb-2 leading-tight">Job Alerts in {cityName}</h3>
               <p className="text-sm font-medium opacity-80 mb-6">Get notified instantly when new manufacturing jobs are posted in {cityName}.</p>
               <Button className="w-full h-12 rounded-2xl bg-white text-indigo-600 font-black hover:bg-gray-100 border-0">
                  Join Telegram
               </Button>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
