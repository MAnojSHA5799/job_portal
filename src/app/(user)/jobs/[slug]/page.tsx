import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Share2, 
  Bookmark, 
  CheckCircle, 
  ChevronRight, 
  Zap, 
  Globe, 
  Star,
  Users,
  ChevronDown,
  Calendar,
  Search,
  DollarSign
} from 'lucide-react';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

// Utility to check if string is UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function getData(slug: string) {
  // 1. Try to find by ID
  if (isUUID(slug)) {
    const { data: job } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('id', slug)
      .single();
    if (job) return { type: 'job', data: job };
  }

  // 2. Try to find by url_slug
  const { data: jobBySlug } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .eq('url_slug', slug)
    .single();
  if (jobBySlug) return { type: 'job', data: jobBySlug };

  // 3. Try to find by Category (check if any job has this category)
  // We'll normalize the slug to category name (e.g. cnc-operator -> CNC Operator)
  const categoryName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const { data: categoryJobs } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .ilike('category', `%${categoryName}%`)
    .eq('is_approved', true)
    .limit(20);

  if (categoryJobs && categoryJobs.length > 0) {
    return { type: 'category', data: categoryJobs, name: categoryName };
  }

  return null;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const slug = (await params).slug;
  const result = await getData(slug);

  if (!result) return { title: 'Not Found' };

  if (result.type === 'job') {
    const job = result.data;
    const title = job.seo_title || `${job.title} at ${job.companies?.name || 'Gethyrd'}`;
    const description = job.meta_description || job.description?.slice(0, 160);
    return {
      title,
      description,
    };
  } else {
    const categoryName = result.name;
    const title = `${categoryName} Jobs in India - Active Openings | Gethyrd.in`;
    const description = `Find the best ${categoryName} jobs in India. Verified manufacturing and industrial job openings.`;
    return {
      title,
      description,
    };
  }
}

export default async function SlugPage({ params }: Props) {
  const slug = (await params).slug;
  const result = await getData(slug);

  if (!result) {
    notFound();
  }

  if (result.type === 'job') {
    const job = result.data;
    // Schema.org JSON-LD
    const jsonLd = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "datePosted": job.created_at,
      "validThrough": job.valid_through || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.companies?.name,
        "sameAs": job.companies?.website,
        "logo": job.companies?.logo_url
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.location?.split(',')[0],
          "addressRegion": job.location?.split(',')[1] || '',
          "addressCountry": "IN"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.salary_range,
          "unitText": "MONTH"
        }
      },
      "employmentType": job.job_type?.toUpperCase().replace('-', '_') || "FULL_TIME"
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <a href="/" className="hover:text-primary">Home</a>
          <ChevronRight className="w-3 h-3" />
          <a href="/jobs" className="hover:text-primary">Jobs</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 truncate">{job.title}</span>
        </nav>

        <div className="h-40 bg-gradient-to-r from-indigo-600 to-indigo-900 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-24 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <Card className="p-8 md:p-12 border-0 shadow-2xl shadow-gray-200 bg-white rounded-3xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                      <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-[24px] bg-white border border-gray-100 shadow-xl shadow-gray-100 flex items-center justify-center text-3xl font-black text-indigo-600 p-2 overflow-hidden">
                              {job.companies?.logo_url ? (
                                  <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                              ) : (
                                  job.companies?.name?.charAt(0) || 'G'
                              )}
                          </div>
                          <div className="space-y-1">
                              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{job.title}</h1>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.companies?.name}</span>
                                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                                  {job.salary_range && (
                                      <span className="flex items-center gap-1.5 text-indigo-600"><Star className="w-4 h-4 fill-indigo-600" /> {job.salary_range}</span>
                                  )}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl"><Bookmark className="w-5 h-5 text-gray-400" /></Button>
                          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl"><Share2 className="w-5 h-5 text-gray-400" /></Button>
                      </div>
                  </div>

                  <div className="flex items-center gap-4 border-b border-gray-100 pb-8 mb-8 overflow-x-auto whitespace-nowrap">
                      <Badge className="px-4 py-1.5 font-black text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100">{job.job_type?.toUpperCase() || 'FULL-TIME'}</Badge>
                      <Badge className="px-4 py-1.5 font-black text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100">{job.experience_level?.toUpperCase() || 'EXPERIENCED'}</Badge>
                      <Badge className="px-4 py-1.5 font-black text-[10px] bg-amber-50 text-amber-600 border-amber-100">URGENT</Badge>
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                  </div>

                  <div className="prose prose-slate max-w-none space-y-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                          <Zap className="w-3 h-3 fill-indigo-600" /> SEO Optimized Content
                      </div>
                      
                      {job.description && (job.description.includes('H2:') || job.description.includes('##')) && (
                          <nav aria-label="Table of Contents" className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                              <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Table of Contents</h4>
                              <ol className="space-y-2">
                                  {job.description.split('\n')
                                      .filter((line: string) => line.startsWith('H2:') || line.startsWith('##'))
                                      .map((line: string, i: number) => {
                                          const text = line.replace(/^H2:|^##/, '').trim();
                                          const id = text.toLowerCase().replace(/\s+/g, '-');
                                          return (
                                              <li key={i}>
                                                  <a href={`#${id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                                                      <ChevronRight className="w-3 h-3" /> {text}
                                                  </a>
                                              </li>
                                          );
                                      })
                                  }
                              </ol>
                          </nav>
                      )}

                      <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                          {job.description}
                      </div>
                  </div>
              </Card>
            </div>

            <aside className="w-full lg:w-[400px] space-y-8">
                <Card className="p-8 border-0 shadow-2xl shadow-indigo-100 bg-gray-900 text-white sticky top-28 rounded-3xl">
                    <h3 className="text-lg font-bold mb-2">Apply for this position</h3>
                    <p className="text-gray-400 text-sm mb-8 font-medium">Fast response expected. Join other applicants now.</p>
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                          <span className="text-gray-400 flex items-center gap-2">Salary Range</span>
                          <span className="text-indigo-400">{job.salary_range || 'Competitive'}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                          <span className="text-gray-400 flex items-center gap-2">Job Type</span>
                          <span>{job.job_type}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm py-4 font-bold">
                          <span className="text-gray-400 flex items-center gap-2">Location</span>
                          <span>{job.location}</span>
                       </div>
                    </div>
                    <a href={job.apply_link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button className="w-full h-14 font-black flex items-center justify-center gap-2 group text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                          APPLY NOW <Zap className="w-5 h-5 fill-white" />
                      </Button>
                    </a>
                </Card>
            </aside>
          </div>
        </div>
      </div>
    );
  } else {
    // CATEGORY VIEW
    const jobs = result.data;
    const categoryName = result.name;

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-100 py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Badge className="mb-4 bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">Category</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter">
              {categoryName} Jobs in India
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl font-medium">
              Explore {jobs.length} active openings for {categoryName} roles.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {jobs.map((job: any) => (
                <Card key={job.id} className="p-6 border-0 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all bg-white group rounded-3xl overflow-hidden">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl font-black text-indigo-600 border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                      {job.companies?.logo_url ? (
                        <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                      ) : (
                        job.companies?.name?.charAt(0) || 'J'
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600">
                        <a href={`/jobs/${job.url_slug || job.id}`}>{job.title}</a>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                        <span>{job.companies?.name}</span>
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <aside className="space-y-8">
              <Card className="p-8 border-0 shadow-lg shadow-gray-100 bg-white rounded-3xl">
                <h3 className="text-lg font-black text-gray-900 mb-6">Career Insights</h3>
                <p className="text-sm text-gray-600 font-medium">
                  {categoryName} roles are in high demand in India's growing manufacturing sector.
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    );
  }
}
