import React from 'react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  Zap, 
  Star,
  Building2,
  ExternalLink,
  Info,
  HelpCircle,
  TrendingUp,
  HandshakeIcon
} from 'lucide-react';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

// Utility to check if string is UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function getData(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  // 1. Try to find by ID
  if (isUUID(decodedSlug)) {
    const { data: job } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('id', decodedSlug)
      .single();
    if (job) return { type: 'job', data: job };
  }

  // 2. Try to find by url_slug
  const { data: jobBySlug } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .eq('url_slug', decodedSlug)
    .single();

  if (jobBySlug) return { type: 'job', data: jobBySlug };

  // Try original slug just in case
  if (decodedSlug !== slug) {
    const { data: jobByOriginalSlug } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('url_slug', slug)
      .single();
    if (jobByOriginalSlug) return { type: 'job', data: jobByOriginalSlug };
  }

  // 3. Try to find by Category
  const categoryName = decodedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const { data: categoryJobs } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .ilike('category', `%${categoryName}%`)
    .eq('is_approved', true)
    .limit(20);

  if (categoryJobs && categoryJobs.length > 0) {
    return { type: 'category', data: categoryJobs, name: categoryName, slug: decodedSlug };
  }

  require('fs').writeFileSync('slug_debug.txt', `slug: ${slug}\ndecodedSlug: ${decodedSlug}`);
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const result = await getData(slug);

  if (!result) return { title: 'Not Found' };

  if (result.type === 'job') {
    const job = result.data;
    const city = job.location?.split(',')[0] || 'India';
    const year = new Date().getFullYear();
    const title = `${job.title} Jobs in ${city} | ${job.companies?.name || 'Gethyrd'} Hiring ${year}`;
    const description = job.meta_description || job.description?.slice(0, 160);
    return { title, description };
  } else {
    const categoryName = result.name;
    const title = `${categoryName} Jobs in India — ${result.data.length} Active Openings`;
    const description = `Find the best ${categoryName} jobs in India. Verified manufacturing and industrial job openings with salary details.`;
    return { title, description };
  }
}

import { ApplyButton } from '@/components/ApplyButton';

export default async function SlugPage({ params }: Props) {
  const slug = (await params).slug;
  const result = await getData(slug);

  if (!result) {
    notFound();
  }

  if (result.type === 'job') {
    const job = result.data;
    const city = job.location?.split(',')[0] || 'India';
    const year = new Date().getFullYear();

    // Fetch related jobs
    const { data: relatedJobs } = await supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('category', job.category)
        .neq('id', job.id)
        .eq('is_approved', true)
        .limit(3);

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
          "streetAddress": job.location,
          "addressLocality": city,
          "addressCountry": "IN"
        }
      },
      "baseSalary": job.salary_range ? {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.salary_range,
          "unitText": "MONTH"
        }
      } : undefined,
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
                                  <img 
                                    src={job.companies.logo_url} 
                                    alt={`${job.companies.name} ${city} Jobs`} 
                                    className="w-full h-full object-contain" 
                                  />
                              ) : (
                                  job.companies?.name?.charAt(0) || 'G'
                              )}
                          </div>
                          <div className="space-y-1">
                              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                                {job.title} Jobs in {city} | {job.companies?.name} Hiring {year}
                              </h1>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> 
                                    <a href={`/company/${job.companies?.id}`} className="hover:text-indigo-600 underline decoration-indigo-200 decoration-2 underline-offset-4">{job.companies?.name}</a>
                                  </span>
                                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                                  {job.salary_range && (
                                      <span className="flex items-center gap-1.5 text-indigo-600"><Star className="w-4 h-4 fill-indigo-600" /> {job.salary_range}</span>
                                  )}
                              </div>
                          </div>
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

                  <div className="prose prose-slate max-w-none space-y-12">
                      <section>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-4">
                            <Info className="w-6 h-6 text-indigo-600" /> Job Description
                        </h2>
                        <div 
                            className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap html-content"
                            dangerouslySetInnerHTML={{ __html: job.description }}
                        />
                      </section>

                      {job.salary_range && (
                        <section className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-4">
                                <TrendingUp className="w-6 h-6 text-indigo-600" /> Salary & Benefits
                            </h2>
                            <p className="text-gray-700 font-medium">
                                This position at {job.companies?.name} offers a salary of <strong>{job.salary_range}</strong>. Candidates will also be eligible for standard statutory benefits as per company policy.
                            </p>
                        </section>
                      )}

                      <section>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-4">
                            <Building2 className="w-6 h-6 text-indigo-600" /> About the Company
                        </h2>
                        <div className="text-gray-600 leading-relaxed font-medium">
                            {job.companies?.description || `${job.companies?.name} is a verified employer in the ${job.companies?.industry || 'Manufacturing'} sector located in ${job.companies?.location || city}.`}
                        </div>
                      </section>

                      <section>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
                            <HelpCircle className="w-6 h-6 text-indigo-600" /> FAQs for {job.title}
                        </h2>
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-50 rounded-2xl">
                                <h4 className="font-black text-gray-900 mb-2">Where is this job located?</h4>
                                <p className="text-sm text-gray-600 font-medium">This {job.title} role is based in {job.location}.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl">
                                <h4 className="font-black text-gray-900 mb-2">What is the required experience?</h4>
                                <p className="text-sm text-gray-600 font-medium">The employer is looking for candidates with {job.experience_level} experience.</p>
                            </div>
                        </div>
                      </section>
                  </div>
              </Card>

              {relatedJobs && relatedJobs.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900">More {job.category} Jobs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {relatedJobs.map((rj) => (
                            <Card key={rj.id} className="p-6 border-0 shadow-xl shadow-gray-100 bg-white rounded-3xl hover:shadow-indigo-100 transition-all">
                                <h4 className="font-black text-gray-900 mb-2 line-clamp-1">{rj.title}</h4>
                                <p className="text-xs text-gray-500 font-bold mb-4">{rj.companies?.name} • {rj.location}</p>
                                <a href={`/jobs/${rj.url_slug || rj.id}`} className="text-sm font-black text-indigo-600 hover:underline flex items-center gap-1">
                                    View Job <ChevronRight className="w-4 h-4" />
                                </a>
                            </Card>
                        ))}
                    </div>
                </section>
              )}
            </div>

            <aside className="w-full lg:w-[400px] space-y-8">
                <Card className="p-8 border-0 shadow-2xl shadow-indigo-100 bg-gray-900 text-white sticky top-28 rounded-3xl">
                    <h3 className="text-lg font-bold mb-2">Apply Now</h3>
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                          <span className="text-gray-400 flex items-center gap-2">Salary</span>
                          <span className="text-indigo-400">{job.salary_range || 'As per norms'}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm py-4 border-b border-white/5 font-bold">
                          <span className="text-gray-400 flex items-center gap-2">Type</span>
                          <span>{job.job_type}</span>
                       </div>
                    </div>
                    
                    <ApplyButton 
                      jobId={job.id}
                      jobTitle={job.title}
                      companyId={job.companies?.id}
                      companyName={job.companies?.name}
                      applyLink={job.apply_link || '#'}
                    />
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
    const citiesInCat = Array.from(new Set(jobs.map((j: any) => j.location?.split(',')[0]))).slice(0, 5);

    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": jobs.slice(0, 10).map((job: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `https://gethyrd.in/jobs/${job.url_slug || job.id}`,
            "name": job.title
        }))
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />

        <div className="bg-white border-b border-gray-100 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-50/30"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <Badge className="mb-4 bg-indigo-600 text-white border-0 font-bold px-4 py-1">Career Category</Badge>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter">
              {categoryName} Jobs in India — {jobs.length} Active Openings
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
              Explore {jobs.length} active opportunities for {categoryName} roles across India's industrial hubs.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
                <Card className="p-10 border-0 shadow-2xl shadow-gray-100 bg-white rounded-[40px] prose prose-slate max-w-none">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">{categoryName} Careers Overview</h2>
                    <p className="text-gray-600 font-medium">
                        There are currently {jobs.length} verified openings for {categoryName} positions. These roles are essential for the manufacturing and industrial sectors, offering diverse opportunities in production, maintenance, and quality control.
                    </p>
                </Card>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 px-2">Recent Openings</h2>
                    <div className="grid grid-cols-1 gap-6">
                        {jobs.map((job: any) => (
                            <Card key={job.id} className="p-8 border-0 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/30 transition-all bg-white group rounded-[32px] overflow-hidden">
                                <div className="flex items-start gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl font-black text-indigo-600 border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                        {job.companies?.logo_url ? (
                                            <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                                        ) : (
                                            job.companies?.name?.charAt(0) || 'J'
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600">
                                            <a href={`/jobs/${job.url_slug || job.id}`}>{job.title}</a>
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold">
                                            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.companies?.name}</span>
                                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <aside className="space-y-8">
              {citiesInCat.length > 0 && (
                <Card className="p-8 border-0 shadow-2xl shadow-indigo-100/20 bg-white rounded-[40px]">
                  <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Cities with {categoryName} Jobs</h3>
                  <div className="space-y-3">
                      {(citiesInCat as string[]).map((city: string) => (
                          <a 
                              key={city} 
                              href={`/jobs-in/${city.toLowerCase()}`}
                              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-600 hover:text-white transition-all font-bold text-gray-600"
                          >
                              {city} <ChevronRight className="w-4 h-4" />
                          </a>
                      ))}
                  </div>
                </Card>
              )}

              <Card className="p-8 border-0 shadow-2xl shadow-indigo-100 bg-indigo-600 text-white rounded-[40px]">
                  <TrendingUp className="w-10 h-10 mb-4 fill-white animate-pulse" />
                  <h3 className="text-xl font-black mb-2 leading-tight">Apply for {categoryName} Jobs</h3>
                  <p className="text-sm font-medium opacity-80 mb-6">Stay updated with the latest industrial career opportunities.</p>
                  <Button className="w-full h-12 rounded-2xl bg-white text-indigo-600 font-black hover:bg-gray-100 border-0">Get Alerts</Button>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    );
  }
}
