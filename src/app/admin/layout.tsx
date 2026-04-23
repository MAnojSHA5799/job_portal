"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Globe, 
  Copy, 
  Building2, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogOut,
  ChevronRight,
  Image as ImageIcon,
  Newspaper,
  Target,
  Users
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Briefcase, label: 'Jobs Queue', href: '/admin/jobs' },
  { icon: Users, label: 'Applications', href: '/admin/applications' },
  { icon: Globe, label: 'Scraper Status', href: '/admin/scraper' },
  { icon: Target, label: 'Scraper Targets', href: '/admin/scraper-targets' },
  { icon: Copy, label: 'Duplicate Jobs', href: '/admin/duplicates' },
  { icon: Building2, label: 'Companies', href: '/admin/companies' },
  { icon: Newspaper, label: 'Blogs', href: '/admin/blogs' },
  { icon: ImageIcon, label: 'Banners', href: '/admin/banners' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkUser = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        const sessionUser = JSON.parse(userStr);

        if (sessionUser.role !== 'admin') {
            router.push('/');
            return;
        }
        
        setUser(sessionUser);
    };

    checkUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) return null;
  if (!user) return <div className="h-screen w-screen bg-white flex items-center justify-center font-bold text-primary italic">Verifying Secure Session...</div>;

  return (
    <div className="flex h-screen bg-background-gray">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out z-20",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/lo.jpeg" alt="JobPortal" className={cn("h-8 w-auto object-contain", !sidebarOpen && "mx-auto")} />
            {sidebarOpen && <span className="font-bold text-xl text-gray-900 tracking-tight">JobPortal</span>}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                {!sidebarOpen && (
                   <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
             <Button 
                variant="ghost" 
                onClick={handleLogout}
                className={cn("w-full justify-start text-gray-500", !sidebarOpen && "px-0")}
             >
                <LogOut className="h-5 w-5 mr-3" />
                {sidebarOpen && <span>Logout</span>}
             </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden md:flex relative max-w-sm w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search everything..." className="pl-10 h-9 bg-gray-50 border-0" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
               </div>
               <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  AU
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
