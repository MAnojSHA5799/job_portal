import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
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
  HandshakeIcon,
  Flame,
  CheckCircle2,
  Users2,
  ShieldCheck,
  GraduationCap,
  Users,
  Smartphone,
  Bike,
  Languages,
  Banknote,
  Search,
  Info,
  Building2,
  TrendingUp
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
      .eq('is_approved', true)
      .single();
    if (job) return { type: 'job', data: job };
  }

  // 2. Try to find by url_slug
  const { data: jobBySlug } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .eq('url_slug', decodedSlug)
    .eq('is_approved', true)
    .single();

  if (jobBySlug) return { type: 'job', data: jobBySlug };

  // Try original slug just in case
  if (decodedSlug !== slug) {
    const { data: jobByOriginalSlug } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('url_slug', slug)
      .eq('is_approved', true)
      .single();
    if (jobByOriginalSlug) return { type: 'job', data: jobByOriginalSlug };
  }

  // 3. Try to find by Category or Job Type
  const searchName = decodedSlug.replace(/-/g, ' ');
  const { data: matchedJobs } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .or(`category.ilike.%${searchName}%,job_type.ilike.%${searchName}%,category.ilike.%${decodedSlug}%,job_type.ilike.%${decodedSlug}%`)
    .eq('is_approved', true)
    .limit(20);

  if (matchedJobs && matchedJobs.length > 0) {
    const displayName = searchName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { type: 'category', data: matchedJobs, name: displayName, slug: decodedSlug };
  }

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
      <div className="bg-[#f8f9fa] min-h-screen pb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Simplified Breadcrumb */}
        <nav className="max-w-3xl mx-auto px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <ChevronRight className="w-3 h-3" />
          <a href="/jobs" className="hover:text-primary transition-colors">Jobs</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 truncate">{job.title}</span>
        </nav>

        <div className="max-w-3xl mx-auto px-4 space-y-4">
          {/* Main Summary Card */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
             <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden p-1 shrink-0">
                    {job.companies?.logo_url ? (
                        <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-2xl">
                            {job.companies?.name?.charAt(0) || 'J'}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1">{job.title}</h1>
                    <p className="text-sm text-gray-500 font-semibold">{job.companies?.name}</p>
                </div>
             </div>

             <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold">{job.salary_range || 'Not disclosed'}</span>
                </div>
             </div>

             {/* Salary Breakdown */}
             {job.salary_range && (
                 <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Salary Range</p>
                            <p className="text-sm font-bold text-gray-700">{job.salary_range}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employment Type</p>
                            <p className="text-sm font-bold text-gray-700">{job.job_type || 'Full Time'}</p>
                        </div>
                    </div>
                 </div>
             )}

             {/* Badges Row */}
             <div className="flex flex-wrap gap-2 mb-8">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-gray-500 border border-gray-100/50">
                    <Bike className="w-3.5 h-3.5 text-gray-400" /> Field Job
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-gray-500 border border-gray-100/50">
                    <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-[10px] font-black">P</div>
                    Part Time
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-gray-500 border border-gray-100/50">
                    <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-[10px] font-black">F</div>
                    Full Time
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-gray-500 border border-gray-100/50">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" /> {job.experience_level || 'Any experience'}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-gray-500 border border-gray-100/50">
                    <Languages className="w-3.5 h-3.5 text-gray-400" /> No English Req.
                </div>
             </div>

             <div className="flex gap-3">
                <ApplyButton 
                    jobId={job.id}
                    jobTitle={job.title}
                    companyId={job.companies?.id}
                    companyName={job.companies?.name}
                    applyLink={job.apply_link || '#'}
                    className="flex-1 h-12 bg-[#006d5b] hover:bg-[#005a4b] text-white font-bold rounded-xl border-0"
                />
                <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-200 text-gray-600 font-bold flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Share
                </Button>
             </div>
          </Card>

          {/* Job Highlights Box */}
          <div className="bg-[#f0f7ff] border border-[#dceaff] rounded-2xl p-6 space-y-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Job highlights</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex items-start gap-3">
                    <Flame className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Urgently hiring</p>
                        <p className="text-xs text-gray-500 mt-1">Hiring for immediate joining</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Verified Job</p>
                        <p className="text-xs text-gray-500 mt-1">Verified by {job.companies?.name}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Job Benefits</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">As per company norms and statutory requirements</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">Posted On</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* Detailed Sections Card */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl bg-white space-y-10">
             {/* Job Description */}
             <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-50 pb-4">Job Description</h3>
                <div 
                    className="text-sm text-gray-600 leading-relaxed font-medium html-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                />
             </section>

             {/* Job Role Grid */}
             <section>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Job role</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-4">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Department</p>
                            <p className="text-sm font-bold text-gray-700">{job.category || 'General'}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <ShieldCheck className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Role / Category</p>
                            <p className="text-sm font-bold text-gray-700">{job.title}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Clock className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Employment type</p>
                            <p className="text-sm font-bold text-gray-700">{job.job_type || 'Full Time'}</p>
                        </div>
                    </div>
                </div>
             </section>

             {/* Job Requirements Grid */}
             <section>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Job requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-4">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Experience</p>
                            <p className="text-sm font-bold text-gray-700">{job.experience_level || 'Any experience'}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle2 className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Education</p>
                            <p className="text-sm font-bold text-gray-700">Check Job Description</p>
                        </div>
                    </div>
                </div>
             </section>

             {/* About Company */}
             <section className="pt-8 border-t border-gray-50">
                <h3 className="text-lg font-bold text-gray-900 mb-6">About company</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1">
                            {job.companies?.logo_url ? (
                                <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                            ) : (
                                <Building2 className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Name</p>
                            <p className="text-sm font-bold text-gray-700">{job.companies?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Address</p>
                            <p className="text-sm font-bold text-gray-700 leading-relaxed">{job.location}, India</p>
                        </div>
                    </div>
                </div>
             </section>

             <p className="text-xs font-bold text-gray-400 pt-6">Job posted by <span className="text-gray-600">{job.companies?.name}</span></p>
          </Card>

          {/* Related Jobs - Compact */}
          {relatedJobs && relatedJobs.length > 0 && (
            <section className="pt-8 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 px-1">More {job.category} Jobs</h3>
                <div className="grid grid-cols-1 gap-4">
                    {relatedJobs.map((rj) => (
                        <Link key={rj.id} href={`/jobs/${rj.url_slug || rj.id}`}>
                            <Card className="p-4 border border-gray-100 shadow-sm bg-white rounded-2xl hover:shadow-md transition-all flex items-center justify-between group">
                                <div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{rj.title}</h4>
                                    <p className="text-xs text-gray-500 font-semibold">{rj.companies?.name} • {rj.location}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary" />
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
          )}
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
                                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-2xl font-black text-indigo-600 border border-gray-100 transition-all shrink-0 p-2">
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
