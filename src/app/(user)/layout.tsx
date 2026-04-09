"use client";

import React from 'react';
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
import { useState } from 'react';

import { Banner } from '@/components/Banner';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Find Jobs', href: '/jobs' },
    { name: 'Companies', href: '/companies' },
    { name: 'Salary Intel', href: '/salary' },
    { name: 'ATS Score', href: '/ats-score' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        {/* ... existing nav content ... */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2 group">
                <img src="/logo.png" alt="JobPortal" className="h-10 w-auto object-contain" />
              </Link>
              
              <div className="hidden lg:flex items-center gap-8">
                {navigation.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold text-gray-500 hover:text-primary">
                    <LogIn className="w-4 h-4 mr-2" /> Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="shadow-lg shadow-primary/20 font-bold">
                    <UserPlus className="w-4 h-4 mr-2" /> Post a Job
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-8 space-y-4 animate-in slide-in-from-top duration-300">
             {navigation.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="block text-lg font-bold text-gray-900 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                 <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full">Sign In</Button>
                 </Link>
                 <Link href="/register" className="w-full">
                    <Button className="w-full">Create Account</Button>
                 </Link>
              </div>
          </div>
        )}
      </nav>

      {/* Banner Section */}
      <Banner />

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                <div className="space-y-6">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="JobPortal" className="h-8 w-auto object-contain" />
                    </Link>
                    <p className="text-gray-500 leading-relaxed text-sm">
                        Connecting world-class talent with the best startups and global companies. Modern, elegant, and efficient.
                    </p>
                    <div className="flex items-center gap-4 text-gray-400">
                        <Globe className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                        <Mail className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                        <Layers className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">Resources</h4>
                    <ul className="space-y-4 text-sm font-medium text-gray-500">
                        <li><Link href="/jobs" className="hover:text-primary">Find Jobs</Link></li>
                        <li><Link href="/companies" className="hover:text-primary">Companies</Link></li>
                        <li><Link href="/salary" className="hover:text-primary">Salary Intelligence</Link></li>
                        <li><Link href="/blog" className="hover:text-primary">Career Blog</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">Company</h4>
                    <ul className="space-y-4 text-sm font-medium text-gray-500">
                        <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                        <li><Link href="/contact" className="hover:text-primary">Contact Support</Link></li>
                        <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2">Subscribe to newsletter</h4>
                    <p className="text-xs text-gray-500 mb-4 font-medium">Get the latest job updates directly in your inbox.</p>
                    <div className="flex gap-2">
                        <Input placeholder="Enter email" className="bg-gray-50 border-0 h-9" />
                        <Button size="sm" className="h-9 px-4">Join</Button>
                    </div>
                </div>
            </div>
            <div className="pt-10 border-t border-gray-200 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    &copy; 2026 JOBPORTAL CLONE. BUILT FOR MODERN SUCCESS.
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
}
