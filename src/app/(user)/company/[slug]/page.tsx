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

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .or(`id.eq.${slug},url_slug.eq.${slug}`)
    .single();

  if (!company) return { title: 'Company Not Found' };

  const title = `${company.name} Jobs — Active Openings Hiring Now | Gethyrd.in`;
  const description = `Explore latest career opportunities at ${company.name}. View all active openings and company info. Verified manufacturing jobs at ${company.name}.`;

  return { title, description };
}

export default async function CompanyPage({ params }: Props) {
  const slug = (await params).slug;

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .or(`id.eq.${slug},url_slug.eq.${slug}`)
    .single();

  if (companyError || !company) {
    notFound();
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const jobCount = jobs?.length || 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": company.name,
        "url": `https://gethyrd.in/company/${company.url_slug || company.id}`,
        "logo": company.logo_url,
        "sameAs": [company.website, company.linkedin_url].filter(Boolean)
      },
      {
        "@type": "ItemList",
        "name": `Jobs at ${company.name}`,
        "itemListElement": jobs?.slice(0, 10).map((job: any, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://gethyrd.in/jobs/${job.url_slug || job.id}`,
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
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
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
                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-indigo-600" /> Company Overview
                    </h2>
                    <div className="text-gray-600 font-medium leading-relaxed">
                        {company.description || `${company.name} is a company in the ${company.industry || 'Manufacturing'} sector, currently hiring for ${jobCount} positions in ${company.location}.`}
                    </div>
                </Card>
             </section>

             <section>
                <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="text-2xl font-black text-gray-900">Active Job Openings ({jobCount})</h2>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase text-[10px] px-3 py-1">Verified</Badge>
                </div>

                {jobs && jobs.length > 0 ? (
                  <div className="space-y-6">
                    {jobs.map((job) => (
                      <Card key={job.id} className="p-8 border-0 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all bg-white group rounded-[32px] overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                              <a href={`/jobs/${job.url_slug || job.id}`}>{job.title}</a>
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> {job.location}</span>
                              {job.salary_range && (
                                <span className="flex items-center gap-1.5 text-indigo-600 font-black"><Star className="w-4 h-4 fill-indigo-600" /> {job.salary_range}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <a href={`/jobs/${job.url_slug || job.id}`}>
                              <Button variant="outline" className="h-11 px-6 rounded-xl font-bold border-2">
                                  View Details
                              </Button>
                            </a>
                            <ApplyButton 
                              jobId={job.id}
                              jobTitle={job.title}
                              companyId={company.id}
                              companyName={company.name}
                              applyLink={job.apply_link || '#'}
                              className="h-11 text-xs px-8 rounded-xl"
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
                        <span className="font-bold text-gray-900">{company.headcount || 'N/A'}</span>
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
