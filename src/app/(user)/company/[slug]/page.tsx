import React from 'react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button } from '@/components/ui';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Star,
  Globe,
  Users,
  Building2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { ApplyButton } from '@/components/ApplyButton';
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const decodedSlug = decodeURIComponent(slug);
  
  let query = supabase.from('companies').select('name');
  
  if (isUUID(decodedSlug)) {
    query = query.or(`id.eq.${decodedSlug},url_slug.eq.${decodedSlug}`);
  } else {
    query = query.eq('url_slug', decodedSlug);
  }

  const { data: company } = await query.maybeSingle();

  if (!company && decodedSlug !== slug) {
    // Fallback to try original slug
    let fallbackQuery = supabase.from('companies').select('name');
    if (isUUID(slug)) {
      fallbackQuery = fallbackQuery.or(`id.eq.${slug},url_slug.eq.${slug}`);
    } else {
      fallbackQuery = fallbackQuery.eq('url_slug', slug);
    }
    const { data: fallbackCompany } = await fallbackQuery.maybeSingle();
    
    if (fallbackCompany) {
      return {
        title: `${fallbackCompany.name} Jobs — Active Openings Hiring Now | http://www.hiringstores.com`,
        description: `Explore latest career opportunities at ${fallbackCompany.name}. View all active openings and company info. Verified manufacturing jobs at ${fallbackCompany.name}.`
      };
    }
  }

  if (!company) return { title: 'Company Not Found' };

  const title = `${company.name} Jobs — Active Openings Hiring Now | http://www.hiringstores.com`;
  const description = `Explore latest career opportunities at ${company.name}. View all active openings and company info. Verified manufacturing jobs at ${company.name}.`;

  return { title, description };
}

export default async function CompanyPage({ params }: Props) {
  const slug = (await params).slug;
  const decodedSlug = decodeURIComponent(slug);

  let query = supabase.from('companies').select('*');
  if (isUUID(decodedSlug)) {
    query = query.or(`id.eq.${decodedSlug},url_slug.eq.${decodedSlug}`);
  } else {
    query = query.eq('url_slug', decodedSlug);
  }

  let { data: company, error: companyError } = await query.maybeSingle();

  if ((companyError || !company) && decodedSlug !== slug) {
    let fallbackQuery = supabase.from('companies').select('*');
    if (isUUID(slug)) {
      fallbackQuery = fallbackQuery.or(`id.eq.${slug},url_slug.eq.${slug}`);
    } else {
      fallbackQuery = fallbackQuery.eq('url_slug', slug);
    }
    const { data: fallbackCompany, error: fallbackError } = await fallbackQuery.maybeSingle();
    company = fallbackCompany;
    companyError = fallbackError;
  }

  if (companyError || !company) {
    notFound();
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  const jobCount = jobs?.length || 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": company.name,
        "url": `https://www.hiringstores.com/company/${company.url_slug || company.id}`,
        "logo": company.logo_url,
        "sameAs": [company.website, company.linkedin_url].filter(Boolean)
      },
      {
        "@type": "ItemList",
        "name": `Jobs at ${company.name}`,
        "itemListElement": jobs?.slice(0, 10).map((job: any, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://www.hiringstores.com/jobs/${job.url_slug || job.id}`,
          "name": job.title
        }))
      }
    ]
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white border-b border-gray-100 pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="w-32 h-32 rounded-[40px] bg-white border border-gray-100 shadow-2xl shadow-indigo-100 flex items-center justify-center p-4 overflow-hidden -mt-16">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-indigo-600" />
              )}
            </div>
            <div className="flex-1 space-y-3 pb-2">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                {company.name} Jobs — {jobCount} Active Openings
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-600" /> {company.industry || 'Manufacturing'}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> {company.location}</span>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                    <Globe className="w-4 h-4" /> Official Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
             <section>
                <Card className="p-10 border-0 shadow-2xl shadow-gray-100 bg-white rounded-[40px] prose prose-slate max-w-none">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-indigo-600" /> Company Overview
                    </h2>
                    {company.description ? (
                      <div 
                          className="text-gray-600 font-medium leading-relaxed html-content"
                          dangerouslySetInnerHTML={{ __html: company.description }}
                      />
                    ) : (
                      <div className="text-gray-600 font-medium leading-relaxed">
                          {`${company.name} is a company in the ${company.industry || 'Manufacturing'} sector, currently hiring for ${jobCount} positions in ${company.location}.`}
                      </div>
                    )}
                </Card>
             </section>

             <section>
                <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="text-xl font-bold text-gray-900">Active Job Openings ({jobCount})</h2>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase text-[10px] px-3 py-1">Verified</Badge>
                </div>

                {jobs && jobs.length > 0 ? (
                  <div className="space-y-6">
                    {jobs.map((job) => (
                      <Card key={job.id} className="p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all bg-white group rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-0 group-hover:h-full bg-indigo-600 transition-all duration-300" />
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                              <a href={`/jobs/${job.url_slug || job.id}`}>{job.title}</a>
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">
                              {!job.is_approved && (
                                <Badge className="bg-amber-500 text-white border-0 font-black px-2 py-0.5">PENDING REVIEW</Badge>
                              )}
                              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <MapPin className="w-3 h-3" /> {job.location}
                              </span>
                              {job.salary_range && (
                                <span className="flex items-center gap-1.5 text-emerald-600 font-black">
                                  <Badge className="bg-emerald-50 text-emerald-600 border-0 font-bold px-2 py-0.5">{job.salary_range}</Badge>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 pt-4 md:pt-1 border-t md:border-t-0 border-gray-50">
                            <a href={`/jobs/${job.url_slug || job.id}`} className="flex-1 md:flex-none">
                              <Button variant="outline" className="w-full md:w-auto h-10 px-6 rounded-xl font-bold border-gray-100 hover:border-indigo-600 hover:text-indigo-600 transition-all text-[10px] uppercase tracking-widest">
                                  Quick View
                              </Button>
                            </a>
                            <ApplyButton 
                              jobId={job.id}
                              jobTitle={job.title}
                              companyId={company.id}
                              companyName={company.name}
                              applyLink={job.apply_link || '#'}
                              className="flex-1 md:flex-none h-10 text-[10px] px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold uppercase tracking-widest"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
                    <p className="text-gray-500 font-medium">No active openings at the moment.</p>
                  </div>
                )}
             </section>
          </div>

          <aside className="space-y-8">
             <Card className="p-8 border-0 shadow-xl shadow-gray-100 bg-white rounded-[40px]">
                <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Snapshot</h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Users className="w-6 h-6" /></div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Team Size</span>
                        <span className="font-bold text-gray-900">{company.team_size || 'N/A'}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Briefcase className="w-6 h-6" /></div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Industry</span>
                        <span className="font-bold text-gray-900">{company.industry || 'Manufacturing'}</span>
                      </div>
                   </div>
                </div>
                
                <div className="mt-10 pt-8 border-t border-gray-100 space-y-4">
                    {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors font-bold text-gray-600 text-sm">
                            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-600" /> Website</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
             </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
