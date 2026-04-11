"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, ArrowRight, Globe, User, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'candidate' | 'employer'>('candidate');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error);
        }

        // Store JWT and User Info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/');
        }
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 bg-[url('/grid-bg.svg')] bg-center px-4 py-12 relative overflow-hidden">
      {/* Decorative backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-primary/5 mb-6 border border-gray-100">
            <img src="/logo.png" alt="JobPortal Logo" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 font-medium pb-2">Sign in to your account to continue</p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-white/90 border-white/20 shadow-2xl shadow-gray-200/50 rounded-3xl">
          
          {/* Role Slider */}
          <div className="relative flex items-center p-1 bg-gray-100/80 rounded-2xl mb-8">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out flex items-center justify-center z-0 ${loginType === 'candidate' ? 'left-1' : 'left-[calc(50%+3px)]'}`}
            ></div>
            <button 
              type="button"
              onClick={() => setLoginType('candidate')}
              className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold z-10 transition-colors duration-300 ${loginType === 'candidate' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User className="w-4 h-4 mr-2" /> Candidate
            </button>
            <button 
              type="button"
              onClick={() => setLoginType('employer')}
              className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold z-10 transition-colors duration-300 ${loginType === 'employer' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="w-4 h-4 mr-2" /> Employer
            </button>
          </div>

          {error && (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-bold flex items-center"
              >
                {error}
              </motion.div>
            </AnimatePresence>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200/50 focus:bg-white rounded-xl font-medium"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 block">Password</label>
                <Link href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200/50 focus:bg-white rounded-xl font-medium"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" loading={loading}>
              Sign In <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-gray-400">
                <span className="bg-white px-4">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-gray-200 hover:bg-gray-50 text-gray-700" type="button">
              <Globe className="mr-2 h-5 w-5" /> Github
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-primary hover:underline">Sign up for free</Link>
          </p>
        </Card>

        <div className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
          &copy; 2026 JobPortal. Built for modern success.
        </div>
      </motion.div>
    </div>
  );
}

