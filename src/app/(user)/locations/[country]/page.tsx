import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Globe } from 'lucide-react';
import { Card } from '@/components/ui';

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

  // Mapped cities for specific countries
  let cities: string[] = [];
  
  if (countryName.toLowerCase() === 'india' || countryName.toLowerCase() === 'in') {
      cities = ['Delhi NCR', 'Bangalore', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Gurugram', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Indore'];
  } else if (countryName.toLowerCase() === 'usa' || countryName.toLowerCase() === 'united states') {
      cities = ['New York', 'New York City', 'San Francisco', 'Chicago', 'Los Angeles', 'Boston', 'Austin', 'Seattle'];
  } else if (countryName.toLowerCase() === 'uae' || countryName.toLowerCase() === 'united arab emirates') {
      cities = ['Dubai', 'Abu Dhabi', 'Sharjah'];
  } else if (countryName.toLowerCase() === 'uk' || countryName.toLowerCase() === 'united kingdom') {
      cities = ['London', 'Manchester', 'Birmingham'];
  } else if (countryName.toLowerCase() === 'canada') {
      cities = ['Toronto', 'Vancouver', 'Montreal'];
  } else if (countryName.toLowerCase() === 'australia') {
      cities = ['Sydney', 'Melbourne', 'Brisbane'];
  } else {
      cities = ['Major City 1', 'Major City 2']; // Fallback
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
            {cities.map(city => (
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
            ))}
        </div>
      </div>
    </div>
  );
}
