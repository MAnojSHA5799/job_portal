"use client";

import React from 'react';
import { Card, Button } from '@/components/ui';
import { Building2, ChevronRight, Zap, TrendingUp, Users, Landmark } from 'lucide-react';

interface AnimatedSidebarProps {
  cityName: string;
  topCompanies: any[];
  topRoles: string[];
}

export const AnimatedSidebar = ({ cityName, topCompanies, topRoles }: AnimatedSidebarProps) => {
  return (
    <aside className="space-y-8">
      {topCompanies && topCompanies.length > 0 && (
        <div>
          <Card className="p-8 border-0 shadow-xl shadow-gray-100 bg-white rounded-[40px]">
            <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Top Employers in {cityName}
            </h3>
            <div className="space-y-4">
              {topCompanies.map((comp, index) => (
                <a 
                  key={comp.id} 
                  href={`/company/${comp.url_slug || comp.id}`} 
                  className="block p-5 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 group"
                >
                  <h4 className="font-black text-gray-900 text-sm group-hover:text-indigo-600">{comp.name}</h4>
                  <p className="text-xs text-gray-500 font-bold mt-1">{comp.industry || 'Manufacturing'}</p>
                </a>
              ))}
            </div>
          </Card>
        </div>
      )}

      {topRoles.length > 0 && (
        <div>
          <Card className="p-8 border-0 shadow-2xl shadow-indigo-100/20 bg-white rounded-[40px]">
            <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Trending Roles in {cityName}</h3>
            <div className="space-y-3">
              {topRoles.map((role, index) => (
                <a 
                  key={role} 
                  href={`/jobs/${role.toLowerCase().replace(' ', '-')}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-600 hover:text-white transition-all font-bold text-gray-600"
                >
                  {role} <ChevronRight className="w-4 h-4" />
                </a>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div>
        <Card className="p-8 border-0 shadow-2xl shadow-indigo-600 bg-indigo-600 text-white rounded-[40px] relative overflow-hidden group">
          <Zap className="w-8 h-8 mb-4 fill-white relative z-10" />
          <h3 className="text-lg font-black mb-2 leading-tight relative z-10">Job Alerts in {cityName}</h3>
          <p className="text-sm font-medium opacity-80 mb-6 relative z-10">Get notified instantly when new manufacturing jobs are posted in {cityName}.</p>
          <Button className="w-full h-12 rounded-2xl bg-white text-indigo-600 font-black hover:bg-gray-100 border-0 relative z-10">
            Join Telegram
          </Button>
        </Card>
      </div>
    </aside>
  );
};

export const AnimatedOverview = ({ cityName, jobCount, majorIndustry }: { cityName: string, jobCount: number, majorIndustry: string }) => {
  return (
    <div>
      <Card className="p-10 border-0 shadow-2xl shadow-gray-100 bg-white rounded-[40px] prose prose-slate max-w-none">
        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> Manufacturing Industry in {cityName}
        </h2>
        <p className="text-gray-600 font-medium">
          With {jobCount} active job openings, {cityName} continues to be a destination for skilled workers in India. The local industry is characterized by a strong presence of {majorIndustry} companies.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 not-prose">
          {[
            { icon: TrendingUp, label: 'Active Openings', value: `${jobCount} Live Positions`, color: 'indigo' },
            { icon: Users, label: 'Top Sector', value: majorIndustry, color: 'emerald' },
            { icon: Landmark, label: 'Location', value: `${cityName}, India`, color: 'amber' }
          ].map((stat, i) => (
            <div 
              key={i}
              className={`p-6 bg-${stat.color}-50 rounded-3xl border border-${stat.color}-100 hover:shadow-lg transition-shadow duration-300`}
            >
              <stat.icon className={`w-8 h-8 text-${stat.color}-600 mb-3`} />
              <h4 className={`font-black text-${stat.color}-900 text-sm mb-1`}>{stat.label}</h4>
              <p className={`text-xs text-${stat.color}-700 font-bold`}>{stat.value}</p>
            </div>
          ))}
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-4">Salary & Benefits in {cityName}</h3>
        <p className="text-gray-600 font-medium">
          Manufacturing companies in {cityName} provide competitive compensation packages including PF, ESIC, and performance bonuses.
        </p>
      </Card>
    </div>
  );
};
