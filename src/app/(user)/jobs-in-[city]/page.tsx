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
  Building2
} from 'lucide-react';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cityParam = (await params).city;
  if (!cityParam) return { title: 'Jobs' };
  
  const city = cityParam.charAt(0).toUpperCase() + cityParam.slice(1);
  const title = `Manufacturing Jobs in ${city} - ${new Date().getFullYear()} Openings | Gethyrd.in`;
  const description = `Discover top manufacturing and industrial jobs in ${city}. Hiring now for CNC operators, engineers, and production roles. View salary ranges and apply today!`;

  return {
    title,
    description,
  };
}

export default async function LocationPage({ params }: Props) {
  const citySlug = (await params).city;
  if (!citySlug) return null;
  
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .ilike('location', `%${cityName}%`)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* City Hero */}
      <div className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white">
          <Badge className="mb-6 bg-indigo-600 text-white border-0 font-bold px-4 py-1">Hiring in {cityName}</Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
            Manufacturing Jobs in {cityName}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
            {cityName} is a leading industrial hub. Join {jobs?.length || 0} active opportunities in top manufacturing companies today.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
               <h2 className="text-2xl font-black text-gray-900">Current Openings</h2>
               <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                  <Building2 className="w-4 h-4" /> Top Employers in {cityName}
               </div>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <Card key={job.id} className="p-8 border-0 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/30 transition-all bg-white group rounded-[32px] overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl font-black text-indigo-600 border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 overflow-hidden shadow-sm">
                        {job.companies?.logo_url ? (
                          <img src={job.companies.logo_url} alt={job.companies.name} className="w-full h-full object-contain" />
                        ) : (
                          job.companies?.name?.charAt(0) || 'G'
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                            <a href={`/jobs/${job.id}`}>{job.title}</a>
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-indigo-600" /> {job.companies?.name}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-600" /> {job.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[10px] px-3">{job.salary_range || 'Competitive Pay'}</Badge>
                          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[10px] px-3">{job.job_type}</Badge>
                          <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black text-[10px] px-3">{job.experience_level}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center gap-3">
                        <Button className="w-full md:w-auto px-8 h-12 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-100">
                          Apply Now
                        </Button>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString()}
                        </span>
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

          {/* Sidebar */}
          <aside className="space-y-8">
            <Card className="p-8 border-0 shadow-xl shadow-gray-100 bg-white rounded-[32px]">
               <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Industrial Zones in {cityName}</h3>
               <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                     <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:text-indigo-600 shadow-sm">1</div>
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm">MIDC Phase 1</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">Primary hub for automotive components and tool rooms.</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                     <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:text-indigo-600 shadow-sm">2</div>
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm">Industrial Estate II</h4>
                        <p className="text-xs text-gray-500 font-medium mt-1">Focus on electronics manufacturing and CNC workshops.</p>
                     </div>
                  </div>
               </div>
               <Button variant="ghost" className="w-full mt-8 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50">
                  Explore Hub Map <ChevronRight className="w-4 h-4 ml-1" />
               </Button>
            </Card>

            <Card className="p-8 border-0 shadow-2xl shadow-indigo-100 bg-indigo-600 text-white rounded-[32px]">
               <Zap className="w-8 h-8 mb-4 fill-white animate-pulse" />
               <h3 className="text-lg font-black mb-2 leading-tight">Fastest Growing Roles in {cityName}</h3>
               <ul className="mt-6 space-y-4">
                  {['CNC Operators', 'VMC Programmers', 'Quality Inspectors', 'Shop Floor Managers'].map((role, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold opacity-90">
                      <Star className="w-3 h-3 fill-indigo-400 text-indigo-400" /> {role}
                    </li>
                  ))}
               </ul>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
