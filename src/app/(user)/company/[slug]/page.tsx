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
  ExternalLink
} from 'lucide-react';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', slug) // Temporary using ID as slug until slug column is added
    .single();

  if (!company) return { title: 'Company Not Found' };

  const title = `${company.name} Jobs - Active Manufacturing Openings | Gethyrd.in`;
  const description = `Apply to latest job openings at ${company.name}. View roles, requirements, and salaries at ${company.name}. Career opportunities in top manufacturing plants.`;

  return {
    title,
    description,
  };
}

export default async function CompanyPage({ params }: Props) {
  const slug = (await params).slug;

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', slug) // Temporary using ID as slug
    .single();

  if (companyError || !company) {
    notFound();
  }

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Company Header */}
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
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-600" /> {company.industry || 'Manufacturing'}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> {company.location}</span>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                    <Globe className="w-4 h-4" /> {new URL(company.website).hostname} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-4 pb-2 w-full md:w-auto">
               <Button className="flex-1 md:flex-none h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">Follow</Button>
               <Button variant="outline" className="flex-1 md:flex-none h-12 px-8 rounded-2xl border-gray-200 font-bold">Share</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
             <section>
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  About the Company
                </h2>
                <div className="prose prose-slate max-w-none text-gray-600 font-medium leading-relaxed">
                   {company.description || `${company.name} is a leading player in the manufacturing industry, focused on delivering excellence and innovation in their sector.`}
                </div>
             </section>

             <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900">Active Openings ({jobs?.length || 0})</h2>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase text-[10px]">Hiring Now</Badge>
                </div>

                {jobs && jobs.length > 0 ? (
                  <div className="space-y-6">
                    {jobs.map((job) => (
                      <Card key={job.id} className="p-8 border-0 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all bg-white group rounded-[32px] overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                              <a href={`/jobs/${job.id}`}>{job.title}</a>
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> {job.location}</span>
                              {job.salary_range && (
                                <span className="flex items-center gap-1.5 text-indigo-600 font-black"><Star className="w-4 h-4 fill-indigo-600" /> {job.salary_range}</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                               <Badge className="bg-gray-50 text-gray-500 border-gray-100 text-[10px] uppercase font-bold px-3">{job.job_type}</Badge>
                               <Badge className="bg-gray-50 text-gray-500 border-gray-100 text-[10px] uppercase font-bold px-3">{job.experience_level}</Badge>
                            </div>
                          </div>
                          <Button className="h-12 px-8 rounded-2xl font-black bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
                    <p className="text-gray-500 font-medium">No active openings at the moment. Check back later!</p>
                  </div>
                )}
             </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
             <Card className="p-8 border-0 shadow-xl shadow-gray-100 bg-white rounded-[32px]">
                <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Company Snapshot</h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Users className="w-6 h-6" /></div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Team Size</span>
                        <span className="font-bold text-gray-900">500+ Employees</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Briefcase className="w-6 h-6" /></div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Industry</span>
                        <span className="font-bold text-gray-900">{company.industry || 'Manufacturing'}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><Star className="w-6 h-6" /></div>
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Reviews</span>
                        <span className="font-bold text-gray-900">4.2 / 5.0</span>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="p-8 border-0 shadow-2xl shadow-indigo-100 bg-gray-900 text-white rounded-[40px]">
                <h3 className="text-xl font-black mb-4 leading-tight text-indigo-400">Why Work Here?</h3>
                <ul className="space-y-4">
                   {['Competitive Salary', 'Career Growth', 'Safe Environment', 'Skill Development'].map((perk, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold opacity-80">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {perk}
                      </li>
                   ))}
                </ul>
                <Button className="w-full mt-10 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white border-0">
                  Read More
                </Button>
             </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
