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
  Star
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

import { Banner } from '@/components/Banner';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{fullName: string, role: string} | null>(null);

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const navigation = [
    { name: 'Find Jobs', href: '/jobs' },
    { name: 'Companies', href: '/companies' },
    { name: 'Salary Intel', href: '/salary' },
    { name: 'ATS Score', href: '/ats-score' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-gray-100/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                  <img src="/logo.png" alt="JobPortal" className="h-8 w-auto object-contain" />
                </div>
              </Link>
              
              <div className="hidden lg:flex items-center gap-8">
                {navigation.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="text-sm font-bold text-gray-500 hover:text-primary transition-all relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user.fullName || 'User'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="font-bold border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 h-10 rounded-xl transition-all">
                    Log Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="font-bold text-gray-600 hover:text-primary hover:bg-primary/5 px-4 h-10 rounded-xl">
                        <LogIn className="w-4 h-4 mr-2" /> Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 h-10 px-6 rounded-xl font-bold transition-all">
                        <UserPlus className="w-4 h-4 mr-2" /> Post a Job
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-8 space-y-4 shadow-xl">
             {navigation.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="block text-lg font-bold text-gray-900 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                {user ? (
                   <>
                     <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl border border-gray-100">
                       <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner">
                         {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                       </div>
                       <span className="font-black text-gray-900 text-lg">{user.fullName || 'User'}</span>
                     </div>
                     <Button variant="outline" onClick={handleLogout} className="w-full h-12 rounded-xl font-bold text-base hover:bg-red-50 hover:text-red-600 hover:border-red-200">Log Out</Button>
                   </>
                ) : (
                  <>
                    <Link href="/login" className="w-full">
                       <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-base">Sign In</Button>
                    </Link>
                    <Link href="/register" className="w-full">
                       <Button className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20">Post a Job</Button>
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
      <footer className="bg-gray-900 text-gray-300 pt-24 pb-12 mt-auto border-t-4 border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                
                <div className="lg:col-span-2 space-y-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl">
                          <img src="/logo.png" alt="JobPortal" className="h-8 w-auto object-contain" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter">JobPortal</span>
                    </Link>
                    <p className="text-gray-400 leading-relaxed text-sm max-w-sm">
                        Connecting world-class talent with the best startups and global companies. We are reshaping how people discover their dream careers through modern, intelligent tools.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                          </svg>
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z" />
                          </svg>
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                          </svg>
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/jobs" className="hover:text-primary transition-colors">Find a Job</Link></li>
                        <li><Link href="/companies" className="hover:text-primary transition-colors">Browse Companies</Link></li>
                        <li><Link href="/salary" className="hover:text-primary transition-colors">Salary Intelligence</Link></li>
                        <li><Link href="/ats-score" className="hover:text-primary transition-colors">ATS Resume Check</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Company</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
                        <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-1">
                    <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Stay Updated</h4>
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400">Get the latest job updates and industry news directly in your inbox.</p>
                      <div className="flex flex-col gap-3">
                          <Input placeholder="Email Address" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11 rounded-xl focus:bg-white/10" />
                          <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 font-bold">Subscribe</Button>
                      </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm font-bold text-gray-500">
                    &copy; {new Date().getFullYear()} JobPortal Inc. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> English (US)</span>
                  <span>Made with <span className="text-danger">❤</span> for Developers</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
