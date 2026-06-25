import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Globe } from 'lucide-react';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const countryParam = (await params).country;
  if (!countryParam) return { title: 'Jobs by Country' };
  
  const rawCountrySlug = countryParam.replace(/^job-in-/, '').replace(/-/g, ' ');
  const countryName = rawCountrySlug.charAt(0).toUpperCase() + rawCountrySlug.slice(1);
  
  return {
    title: `Jobs in ${countryName} — Hiring Now | http://www.hiringstores.com`,
    description: `Discover manufacturing and industrial jobs across top cities in ${countryName}. Explore career opportunities today.`,
  };
}

export default async function CountryPage({ params }: Props) {
  const countrySlug = (await params).country;
  if (!countrySlug) return null;
  
  const rawCountrySlug = countrySlug.replace(/^job-in-/, '').replace(/-/g, ' ');
  const countryName = rawCountrySlug.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const COUNTRY_MAPPING: Record<string, string[]> = {
    'usa': ['United States', 'USA', 'US'],
    'uk': ['United Kingdom', 'UK'],
    'uae': ['United Arab Emirates', 'UAE'],
    'india': ['India', 'IN'],
    'canada': ['Canada'],
    'australia': ['Australia'],
    'germany': ['Germany'],
    'singapore': ['Singapore']
  };

  const searchTerms = COUNTRY_MAPPING[rawCountrySlug.toLowerCase()] || [rawCountrySlug];
  const orQuery = searchTerms.map(term => `location.ilike.%${term}%`).join(',');

  const { data: jobs } = await supabase
    .from('jobs')
    .select('location')
    .eq('is_approved', true)
    .or(orQuery);

  let cities: string[] = [];
  if (jobs && jobs.length > 0) {
    const rawLocations = jobs.map(j => j.location).filter(Boolean) as string[];
    cities = Array.from(new Set(rawLocations.map(l => l.split(',')[0].trim()))).sort();
  }

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Globe className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                Jobs in {countryName}
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                Explore the best manufacturing and industrial career opportunities across major cities in {countryName}.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.length > 0 ? (
              cities.map(city => (
                  <Link 
                      key={city} 
                      href={`/job-in-${countrySlug.replace(/^job-in-/, '')}/job-in-${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'))}`}
                      className="block group"
                  >
                      <Card className="p-8 border border-gray-100 hover:border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all bg-white rounded-3xl flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                              <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  Jobs in {city}
                              </h3>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">View Openings →</p>
                          </div>
                      </Card>
                  </Link>
              ))
            ) : (
                <div className="col-span-full bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100">
                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <MapPin className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 mb-2">No jobs available in {countryName} yet</h3>
                     <p className="text-gray-500 font-medium text-sm">Check back later as we are constantly adding new opportunities.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
