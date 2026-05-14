"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
);

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
      <nav className="sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-gray-100 transition-all duration-300" onMouseLeave={() => setJobsDropdownOpen(false)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-12">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <img src="/lo.png" alt="JobPortal" className="h-16 w-auto object-contain transition-transform group-hover:scale-105" />
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </div>
              </Link>
              
              <div className="hidden lg:flex items-center gap-8">
                {navigation.map((item) => (
                  <div key={item.name} className="relative group/nav py-6" onMouseEnter={() => item.hasDropdown && setJobsDropdownOpen(true)}>
                    <Link 
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1 text-[15px] font-medium transition-colors relative group-hover/nav:text-primary",
                        item.hasDropdown && jobsDropdownOpen ? "text-primary" : "text-black"
                      )}
                    >
                      {item.name}
                      {item.hasDropdown && <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", jobsDropdownOpen && "rotate-180")} />}
                      <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover/nav:w-full transition-all duration-300 ease-out" />
                    </Link>

                    {item.hasDropdown && jobsDropdownOpen && (
                      <div className="absolute top-[calc(100%-10px)] left-0 w-[550px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 flex overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex-1 p-6 bg-slate-50/50">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Job Categories</h5>
                           <div className="space-y-1">
                             {jobsDropdownItems.left.map((subItem) => (
                               <Link 
                                 key={subItem.name} 
                                 href={subItem.href}
                                 className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm shadow-transparent hover:shadow-slate-200/50"
                               >
                                 <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                 {subItem.name}
                               </Link>
                             ))}
                           </div>
                        </div>
                        <div className="w-px bg-gray-200/50 my-6" />
                        <div className="flex-1 p-6">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Popular Industries</h5>
                           <div className="space-y-1">
                             {jobsDropdownItems.right.map((subItem) => (
                               <Link 
                                 key={subItem.name} 
                                 href={subItem.href}
                                 className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-all"
                               >
                                 <Layers className="w-4 h-4 text-slate-400" />
                                 {subItem.name}
                               </Link>
                             ))}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 focus-within:ring-2 ring-primary/20 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-transparent border-none focus:outline-none text-sm ml-2 w-32 lg:w-48 text-slate-600 font-medium"
                />
              </div>

              <div className="hidden md:flex items-center gap-3 ml-2">
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{user.fullName}</span>
                      <span className="text-[10px] font-bold text-primary uppercase">{user.role}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100"
                    >
                      <LogIn className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="px-4 py-2.5 text-[15px] font-medium text-slate-800 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
                        Login
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-[15px] font-medium rounded-xl transition-all shadow-lg shadow-primary/25 hover:scale-105 active:scale-95">
                        Sign Up
                      </button>
                    </Link>
                  </>
                )}
              </div>

              <button 
                className="lg:hidden p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 p-6 space-y-6 animate-in slide-in-from-top-5 duration-300">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="block px-4 py-3 text-base font-semibold text-black hover:text-primary hover:bg-slate-50 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {!user && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3 text-sm font-black text-slate-600 border border-slate-100 rounded-xl uppercase tracking-widest">Login</button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3 bg-primary text-white text-sm font-black rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20">Sign Up</button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Banner Section - Show on all pages EXCEPT Home Page */}
      {pathname !== '/' && <Banner />}

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Redesign */}
      <footer className="bg-slate-950 pt-24 pb-12 mt-auto relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-x-8 gap-y-12 mb-20">
                
                <div className="col-span-2 md:col-span-3 lg:col-span-4 space-y-6">
                    <Link href="/" className="inline-block -mt-4">
                        <img src="/two.png" alt="JobPortal" className="w-56 md:w-72 h-auto object-contain object-left" />
                    </Link>
                </div>

                <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Jobs by City</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        {navData.cities.map(city => (
                          <li key={city}>
                            <Link href={`/jobs-in/${city.toLowerCase().replace(/\s+/g, '-')}`} className="text-slate-400 hover:text-primary transition-all flex items-center gap-2 group">
                              <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-primary transition-all" />
                              Jobs in {city}
                            </Link>
                          </li>
                        ))}
                    </ul>
                </div>

                <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Popular Roles</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        {navData.categories.map(cat => (
                          <li key={cat}>
                            <Link href={`/jobs/${cat.toLowerCase().replace(/\s+/g, '-')}`} className="text-slate-400 hover:text-primary transition-all flex items-center gap-2 group">
                              <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-primary transition-all" />
                              {cat} Jobs
                            </Link>
                          </li>
                        ))}
                    </ul>
                </div>

                <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Resources</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/companies" className="text-slate-400 hover:text-primary transition-all">Companies</Link></li>
                        <li><Link href="/salary" className="text-slate-400 hover:text-primary transition-all">Salary Intel</Link></li>
                        <li><Link href="/ats-score" className="text-slate-400 hover:text-primary transition-all">ATS Optimizer</Link></li>
                        <li><Link href="/blog" className="text-slate-400 hover:text-primary transition-all">Career Blog</Link></li>
                    </ul>
                </div>

                <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <h4 className="font-black text-white mb-8 text-xs uppercase tracking-widest">Company</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/about" className="text-slate-400 hover:text-primary transition-all">About Us</Link></li>
                        <li><Link href="/contact" className="text-slate-400 hover:text-primary transition-all">Contact Us</Link></li>
                        <li><Link href="/privacy" className="text-slate-400 hover:text-primary transition-all">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="text-slate-400 hover:text-primary transition-all">Terms of Service</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:items-start items-center gap-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      &copy; {new Date().getFullYear()} JobPortal. Defined by Excellence.
                  </p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">Built for the next generation of talent</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex gap-3">
                    {[
                      { icon: LinkedinIcon, href: '#' },
                      { icon: TwitterIcon, href: '#' },
                      { icon: InstagramIcon, href: '#' },
                      { icon: YoutubeIcon, href: '#' }
                    ].map((social, i) => {
                      const Icon = social.icon;
                      return (
                        <a key={i} href={social.href} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer group">
                          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        </a>
                      )
                    })}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-white/10 pl-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    System Operational
                  </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
