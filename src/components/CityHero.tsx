"use client";

import React from 'react';
import { Badge } from '@/components/ui';

interface CityHeroProps {
  cityName: string;
  jobCount: number;
  majorIndustry: string;
}

export const CityHero = ({ cityName, jobCount, majorIndustry }: CityHeroProps) => {
  return (
    <div className="bg-gray-900 py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-gray-900 to-transparent z-0" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 opacity-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-white">
        <div>
          <Badge className="mb-6 bg-indigo-600 text-white border-0 font-black px-5 py-1.5 uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20">
            Local Opportunities
          </Badge>
        </div>

        <h1 
          className="text-4xl md:text-6xl font-black mb-8 tracking-tight leading-[1.1]"
        >
          Manufacturing Jobs in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-primary">{cityName}</span>
          <br />
          <span 
            className="text-2xl md:text-4xl text-gray-500 block mt-2"
          >
            {jobCount} Verified Openings Today
          </span>
        </h1>

        <p 
          className="text-lg md:text-xl text-gray-400 max-w-2xl font-medium leading-relaxed border-l-4 border-indigo-600/30 pl-6"
        >
          {cityName} is a key industrial hub. Explore verified career opportunities in <span className="text-white">{majorIndustry}</span> and other high-growth sectors within the city.
        </p>

        {/* Stats Row in Hero */}
        <div 
          className="flex flex-wrap gap-8 mt-12"
        >
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white">{jobCount}+</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Jobs</span>
          </div>
          <div className="w-px h-10 bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white">100%</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
