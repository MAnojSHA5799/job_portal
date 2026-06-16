"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user');

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

        if (data.user.role === 'admin' || loginType === 'admin') {
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
    <div className="h-screen w-full flex bg-[#F4F7FB] overflow-hidden">
      
      {/* Left Side: Illustration (60% width) edge-to-edge */}
      <div className="hidden md:flex w-full md:w-[60%] h-full relative bg-white items-stretch">
        <img src="/lo.jpeg" alt="Login Illustration" className="w-full h-full object-cover" />
      </div>

      {/* Right Side: Form (40% width) */}
      <div className="w-full h-full md:w-[40%] bg-[#F4F7FB] overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-full flex flex-col justify-center px-8 py-8 md:px-12 xl:px-16">
          <div className="max-w-[400px] w-full mx-auto">
            <h2 className="text-[28px] font-black text-center mb-2 text-gray-800 tracking-wide uppercase">JOB SEEKER LOGIN</h2>
          <p className="text-center text-sm text-gray-500 mb-8 font-medium">Please sign in to access your account</p>
          


          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Email</label>
              <Input 
                type="email" 
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Password</label>
              <Input 
                type="password" 
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center pt-4 pb-2">
              <Button type="submit" className="w-full h-[46px] text-[15px] font-bold rounded-xl bg-[#ADC5E3] hover:bg-[#9BB8DA] text-gray-800 shadow-none transition-colors border-none" loading={loading}>
                Login
              </Button>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-1 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer hover:text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 text-[#ADC5E3] focus:ring-[#ADC5E3] w-3.5 h-3.5" />
                <span className="font-extrabold">Remember me</span>
              </label>
              {/* <Link href="/forgot-password" className="hover:text-blue-600 transition-colors text-[#ADC5E3] font-extrabold">Forgot Password?</Link> */}
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400 font-semibold">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#ADC5E3] hover:underline">Sign Up</Link>
          </p>
        </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

