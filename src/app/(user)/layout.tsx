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
                  <img src="/lo.jpeg" alt="JobPortal" className="h-8 w-auto object-contain" />
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

            <div className="hidden lg:flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Job title, company..." 
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 rounded-xl text-sm font-medium w-64 transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 bg-gray-50 p-1.5 pr-4 rounded-xl border border-gray-100 hover:border-primary/20 transition-all cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{user.fullName || 'User'}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 h-10 px-4 rounded-xl transition-all">
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="font-bold text-gray-600 hover:text-primary hover:bg-primary/5 px-4 h-10 rounded-xl">
                          Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <div className="flex items-center gap-1 bg-primary text-white p-1 pr-1.5 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                        <div className="bg-white/20 p-1 rounded-full">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold px-2">Post a Job</span>
                      </div>
                    </Link>
                  </>
                )}
              </div>
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
      <footer className="bg-[#0A0A1F] text-gray-400 pt-24 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
                
                <div className="lg:col-span-3 space-y-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="bg-white p-2.5 rounded-2xl shadow-xl shadow-primary/10">
                          <img src="/lo.jpeg" alt="JobPortal" className="h-8 w-auto object-contain" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter">JobPortal</span>
                    </Link>
                    <p className="text-gray-400 leading-relaxed text-sm">
                        Connecting great talent with amazing opportunities across the globe. We build tools that make hiring and job seeking effortless.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-white/10 hover:border-primary">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </a>
                        <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-white/10 hover:border-primary">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                          </svg>
                        </a>
                        <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-white/10 hover:border-primary">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-white mb-8 text-sm uppercase tracking-wider">Platform</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/jobs" className="hover:text-primary transition-colors">Find Jobs</Link></li>
                        <li><Link href="/companies" className="hover:text-primary transition-colors">Browse Companies</Link></li>
                        <li><Link href="/salary" className="hover:text-primary transition-colors">Salary Insights</Link></li>
                        <li><Link href="/ats-score" className="hover:text-primary transition-colors">ATS Score</Link></li>
                        <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-white mb-8 text-sm uppercase tracking-wider">Company</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
                        <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-white mb-8 text-sm uppercase tracking-wider">Resources</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="#" className="hover:text-primary transition-colors">Career Tips</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Resume Builder</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Interview Guide</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                    </ul>
                </div>

                <div className="lg:col-span-3">
                    <h4 className="font-bold text-white mb-8 text-sm uppercase tracking-wider">Newsletter</h4>
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400">Get job alerts and career tips straight to your inbox.</p>
                      <div className="flex flex-col gap-3">
                          <Input placeholder="Enter email address" className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11 rounded-xl focus:bg-white/10" />
                          <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 font-bold">Subscribe</Button>
                      </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-sm font-medium text-gray-500">
                    &copy; {new Date().getFullYear()} JobPortal Inc. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-2 cursor-pointer hover:text-white transition-all">
                    <Globe className="w-4 h-4" /> English (US) <X className="w-3 h-3 rotate-45" />
                  </span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
