"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Menu, 
  X, 
  Briefcase, 
  User, 
  UserPlus, 
  LogIn,
  Layers,
  HelpCircle,
  Mail,
  Globe,
  Star,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Banner } from '@/components/Banner';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jobsDropdownOpen, setJobsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{fullName: string, role: string} | null>(null);
  const [navData, setNavData] = useState<{ cities: string[], categories: string[], types: string[] }>({ 
    cities: ['Delhi NCR', 'Bangalore', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai'], 
    categories: ['IT', 'Sales', 'Marketing', 'Accounting', 'Production'],
    types: ['Full Time', 'Part Time', 'Contract', 'Remote', 'Freshers']
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }

    const fetchNavData = async () => {
      try {
        const { data } = await supabase
          .from('jobs')
          .select('location, category, job_type')
          .eq('is_approved', true)
          .limit(300);

        if (data && data.length > 0) {
          const uniqueCities = Array.from(new Set(data.map(j => j.location?.split(',')[0].trim())))
            .filter(Boolean)
            .slice(0, 6);
          
          const uniqueCats = Array.from(new Set(data.map(j => j.category)))
            .filter(Boolean)
            .slice(0, 6);

          const uniqueTypes = Array.from(new Set(data.map(j => j.job_type)))
            .filter(Boolean)
            .slice(0, 6);

          setNavData({
            cities: uniqueCities.length > 0 ? uniqueCities : navData.cities,
            categories: uniqueCats.length > 0 ? uniqueCats : navData.categories,
            types: uniqueTypes.length > 0 ? uniqueTypes : navData.types
          });
        }
      } catch (error) {
        console.error("Navigation data fetch error:", error);
      }
    };

    fetchNavData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const navigation = [
    { name: 'Find Jobs', href: '/jobs', hasDropdown: true },
    { name: 'Companies', href: '/companies' },
    // { name: 'Salary Intel', href: '/salary' },
    { name: 'ATS Score', href: '/ats-score' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  const jobsDropdownItems = {
    left: navData.types.map(type => ({
      name: `${type} Jobs`,
      href: `/jobs/${type.toLowerCase().replace(/\s+/g, '-')}`
    })),
    right: navData.categories.map(cat => ({
      name: `Jobs in ${cat}`,
      href: `/jobs/${cat.toLowerCase().replace(/\s+/g, '-')}`
    }))
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white z-50 border-b border-gray-100 shadow-sm" onMouseLeave={() => setJobsDropdownOpen(false)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="p-1 rounded-lg transition-all">
                  <img src="/lo.jpeg" alt="JobPortal" className="h-9 w-auto object-contain" />
                </div>
                <span className="text-xl font-bold text-primary tracking-tight">JobPortal</span>
              </Link>
              
              <div className="hidden lg:flex items-center gap-8">
                {navigation.map((item) => (
                  <div key={item.name} className="relative group/nav py-5" onMouseEnter={() => item.hasDropdown && setJobsDropdownOpen(true)}>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1 text-sm font-semibold transition-all",
                        item.hasDropdown && jobsDropdownOpen ? "text-primary" : "text-gray-600 hover:text-primary"
                      )}
                    >
                      {item.name}
                      {item.hasDropdown && <ChevronDown className={cn("w-4 h-4 transition-transform", jobsDropdownOpen && "rotate-180")} />}
                    </Link>

                    {item.hasDropdown && jobsDropdownOpen && (
                      <div className="absolute top-full left-0 w-[500px] bg-white border border-gray-100 rounded-b-2xl shadow-xl z-50 flex overflow-hidden">
                        <div className="flex-1 py-4">
                           {jobsDropdownItems.left.map((subItem) => (
                             <Link 
                               key={subItem.name} 
                               href={subItem.href}
                               className="block px-8 py-3 text-sm font-medium text-gray-500 hover:text-primary hover:bg-gray-50 transition-all"
                             >
                               {subItem.name}
                             </Link>
                           ))}
                        </div>
                        <div className="w-px bg-gray-100 my-4" />
                        <div className="flex-1 py-4">
                           {jobsDropdownItems.right.map((subItem) => (
                             <Link 
                               key={subItem.name} 
                               href={subItem.href}
                               className="flex items-center justify-between px-8 py-3 text-sm font-medium text-gray-500 hover:text-primary hover:bg-gray-50 transition-all group"
                             >
                               {subItem.name}
                               <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </Link>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 bg-gray-50 p-1.5 pr-4 rounded-full border border-gray-100 hover:border-primary/20 transition-all cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{user.fullName || 'User'}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 h-9 px-4 rounded-xl transition-all">
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="font-bold text-gray-600 hover:text-primary px-4 h-9 rounded-lg">
                          Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" className="bg-primary text-white font-bold px-6 h-9 rounded-lg shadow-md hover:shadow-lg transition-all">
                        Post a Job
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-primary rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
             {navigation.map((item) => (
                <div key={item.name}>
                  <div 
                    className="flex items-center justify-between text-base font-semibold text-gray-700 hover:text-primary transition-colors py-2 cursor-pointer"
                    onClick={() => {
                      if (item.hasDropdown) {
                        setJobsDropdownOpen(!jobsDropdownOpen);
                      } else {
                        setMobileMenuOpen(false);
                        window.location.href = item.href;
                      }
                    }}
                  >
                    <span>{item.name}</span>
                    {item.hasDropdown && <ChevronDown className={cn("w-4 h-4 transition-transform", jobsDropdownOpen && "rotate-180")} />}
                  </div>

                  {item.hasDropdown && jobsDropdownOpen && (
                    <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-50">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">Browse by Type</div>
                      {jobsDropdownItems.left.map((subItem) => (
                        <Link 
                          key={subItem.name} 
                          href={subItem.href}
                          className="block py-2 text-sm text-gray-600 hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-6">Browse by Category</div>
                      {jobsDropdownItems.right.map((subItem) => (
                        <Link 
                          key={subItem.name} 
                          href={subItem.href}
                          className="block py-2 text-sm text-gray-600 hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                {user ? (
                   <>
                     <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-gray-50 rounded-xl">
                       <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                         {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                       </div>
                       <span className="font-bold text-gray-900">{user.fullName || 'User'}</span>
                     </div>
                     <Button variant="outline" onClick={handleLogout} className="w-full h-11 rounded-xl">Log Out</Button>
                   </>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                       <Button variant="outline" className="w-full h-11 rounded-xl">Login</Button>
                    </Link>
                    <Link href="/register" className="w-full">
                       <Button className="w-full h-11 rounded-xl">Post a Job</Button>
                    </Link>
                  </>
                )}
              </div>
          </div>
        )}
      </nav>

      {/* Banner Section */}
      <Banner />

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Redesign */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-20 pb-12 mt-auto text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
                
                <div className="lg:col-span-4 space-y-6">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/lo.jpeg" alt="JobPortal" className="h-10 w-auto object-contain" />
                        <span className="text-2xl font-bold text-primary tracking-tight">JobPortal</span>
                    </Link>
                    <p className="text-gray-500 leading-relaxed text-sm max-w-sm">
                        India's leading job portal. Helping millions find their dream jobs and helping companies hire the best talent.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connect with us</span>
                        <div className="flex gap-3">
                          {/* Social Icons simplified */}
                          {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:text-primary hover:border-primary transition-all cursor-pointer"><Globe className="w-4 h-4" /></div>)}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-gray-900 mb-6 text-sm">Jobs by City</h4>
                    <ul className="space-y-3 text-sm">
                        {navData.cities.map(city => (
                          <li key={city}><Link href={`/jobs-in/${city.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors">Jobs in {city}</Link></li>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-gray-900 mb-6 text-sm">Popular Jobs</h4>
                    <ul className="space-y-3 text-sm">
                        {navData.categories.map(cat => (
                          <li key={cat}><Link href={`/jobs/${cat.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors">{cat} Jobs</Link></li>
                        ))}
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-gray-900 mb-6 text-sm">Platform</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link href="/companies" className="hover:text-primary transition-colors">Companies</Link></li>
                        <li><Link href="/salary" className="hover:text-primary transition-colors">Salary Intel</Link></li>
                        <li><Link href="/ats-score" className="hover:text-primary transition-colors">ATS Score</Link></li>
                        <li><Link href="/blog" className="hover:text-primary transition-colors">Career Blog</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-gray-900 mb-6 text-sm">Legal</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-xs font-medium text-gray-400">
                    &copy; {new Date().getFullYear()} JobPortal. All rights reserved. Made for professional growth.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Star className="w-3 h-3 text-accent fill-accent" /> 4.8/5 Rating on App Store
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
