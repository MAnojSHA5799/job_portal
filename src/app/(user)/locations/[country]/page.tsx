import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Globe } from 'lucide-react';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const normalizedSlug = rawCountrySlug.toLowerCase();

  const COUNTRY_KEYWORDS_MAP: Record<string, string[]> = {
    'usa': ['united states', 'usa', 'united states of america', 'us'],
    'uk': ['united kingdom', 'uk', 'great britain', 'gb', 'gbr', 'england', 'scotland', 'wales'],
    'uae': ['united arab emirates', 'uae'],
    'india': ['india', 'in', 'ind'],
    'canada': ['canada', 'ca', 'can'],
    'australia': ['australia', 'au', 'aus'],
    'germany': ['germany', 'de', 'deu'],
    'singapore': ['singapore', 'sg', 'sgp'],
  };

  const US_STATES = new Set([
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware',
    'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky',
    'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi',
    'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico',
    'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania',
    'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont',
    'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming'
  ]);

  const INDIAN_STATES = new Set([
    'andhra pradesh', 'ap', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
    'goa', 'gujarat', 'gj', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
    'kerala', 'madhya pradesh', 'mp', 'maharashtra', 'mh', 'manipur', 'meghalaya',
    'mizoram', 'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim',
    'tamil nadu', 'tn', 'telangana', 'ts', 'tripura', 'uttar pradesh', 'up',
    'uttarakhand', 'west bengal', 'wb', 'delhi', 'delhi ncr', 'jammu', 'kashmir', 'ladakh'
  ]);

  const COUNTRY_MAPPING: Record<string, string> = {
    'us': 'usa', 'usa': 'usa', 'united states': 'usa', 'united states of america': 'usa',
    'uk': 'uk', 'united kingdom': 'uk', 'great britain': 'uk', 'gb': 'uk', 'gbr': 'uk', 'england': 'uk', 'scotland': 'uk', 'wales': 'uk',
    'in': 'india', 'india': 'india', 'ind': 'india',
    'uae': 'uae', 'united arab emirates': 'uae',
    'canada': 'canada', 'australia': 'australia', 'germany': 'germany',
    'singapore': 'singapore', 'netherlands': 'netherlands', 'france': 'france',
    'saudi arabia': 'saudi-arabia', 'qatar': 'qatar', 'oman': 'oman',
    'kuwait': 'kuwait', 'bahrain': 'bahrain', 'malaysia': 'malaysia',
    'japan': 'japan', 'china': 'china', 'south korea': 'south-korea',
    'ireland': 'ireland', 'new zealand': 'new-zealand', 'south africa': 'south-africa',
    'brazil': 'brazil', 'mexico': 'mexico', 'spain': 'spain', 'italy': 'italy',
    'switzerland': 'switzerland', 'sweden': 'sweden', 'norway': 'norway',
    'denmark': 'denmark', 'finland': 'finland', 'poland': 'poland',
    'belgium': 'belgium', 'portugal': 'portugal', 'greece': 'greece',
    'turkey': 'turkey', 'philippines': 'philippines', 'indonesia': 'indonesia',
    'thailand': 'thailand', 'vietnam': 'vietnam', 'taiwan': 'taiwan',
    'argentina': 'argentina', 'chile': 'chile', 'colombia': 'colombia',
    'nigeria': 'nigeria', 'kenya': 'kenya', 'egypt': 'egypt',
  };

  const CITY_BLACKLIST = new Set([
    'location', 'locations', 'n/a', 'na', 'tbd', 'various', 'multiple',
    'india', 'usa', 'uk', 'uae', 'canada', 'australia', 'germany',
    'netherlands', 'france', 'singapore', 'unknown', 'other', 'pan india',
    'anywhere', 'flexible', 'negotiable', 'work from office', 'work from home',
    'united states', 'united kingdom', 'united arab emirates', 'remote',
    'unspecified', 'alternate', 'home', 'ssir', 'angkor west', 'bsh-sakinaka',
    'home remote alternate', 'england', 'scotland', 'wales'
  ]);

  // City alias mapping for canonical city names
  const CITY_ALIASES: Record<string, string> = {
    'bangalore': 'Bangalore',
    'bengaluru': 'Bangalore',
    'gurgaon': 'Gurugram',
    'gurugram': 'Gurugram',
    'delhi': 'Delhi NCR',
    'new delhi': 'Delhi NCR',
    'delhi ncr': 'Delhi NCR',
  };

  const cleanCity = (raw: string): string | null => {
    raw = raw.replace(/\([^)]*\)/g, '').trim();
    raw = raw.replace(/\s+\d+.*$/, '').trim();
    raw = raw.replace(/[|_/\\@#]+/g, ' ').replace(/\s+/g, ' ').trim();
    raw = raw.replace(/(\s+[A-Z]{2,3})+$/, '').trim();

    if (!raw || raw.length < 2 || raw.length > 40) return null;
    if (/^\d/.test(raw)) return null;

    const lower = raw.toLowerCase();
    if (CITY_BLACKLIST.has(lower)) return null;
    if (COUNTRY_MAPPING[lower]) return null;
    if (!/[a-zA-Z]/.test(raw)) return null;

    return raw;
  };

  // Fetch approved, active jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('location')
    .eq('is_approved', true)
    .eq('is_deleted', false);

  let cities: string[] = [];
  if (jobs && jobs.length > 0) {
    const rawLocations = jobs.map(j => j.location).filter(Boolean) as string[];
    const citySet = new Set<string>();

    rawLocations.forEach(loc => {
      // Split multiple locations by ; or | — each segment is an independent location
      const entries = loc.split(/[;|]+/).map(e => e.trim()).filter(Boolean);

      entries.forEach(entry => {
        const parts = entry.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length === 0) return;

        // Detect country for this specific entry
        let entryCountrySlug: string | null = null;

        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i].toLowerCase();
          if (COUNTRY_MAPPING[p]) {
            entryCountrySlug = COUNTRY_MAPPING[p];
            break;
          }
          const words = p.split(/\s+/);
          for (const w of words) {
            if (COUNTRY_MAPPING[w] && COUNTRY_MAPPING[w] !== 'india') {
              entryCountrySlug = COUNTRY_MAPPING[w];
              break;
            }
          }
          if (entryCountrySlug) break;
        }

        if (!entryCountrySlug && parts.some(p => US_STATES.has(p.toLowerCase()))) {
          entryCountrySlug = 'usa';
        }

        // Default to India only if no foreign indicator found
        if (!entryCountrySlug) {
          entryCountrySlug = 'india';
        }

        if (entryCountrySlug !== normalizedSlug) return;

        // Extract pure place/city name from this entry
        for (const part of parts) {
          const cleaned = cleanCity(part);
          if (!cleaned) continue;

          const lower = cleaned.toLowerCase();
          if (normalizedSlug === 'india' && INDIAN_STATES.has(lower) && parts.length > 1) continue;
          if (/^[A-Z]{2,4}$/.test(cleaned.trim()) && parts.length > 1) continue;
          if (normalizedSlug === 'usa' && US_STATES.has(lower) && parts.length > 1) continue;

          const canonicalCity = CITY_ALIASES[lower] ||
            cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

          citySet.add(canonicalCity);
          break; // First valid place token in this entry is the city
        }
      });
    });

    cities = Array.from(citySet).sort();
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
