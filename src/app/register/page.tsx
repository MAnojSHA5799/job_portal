"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [registerType, setRegisterType] = useState<'user' | 'admin'>('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, role: registerType })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error);
        }

        router.push('/login');
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] p-4 sm:p-8">
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-white/60">
        
        {/* Left Side: Illustration */}
        <div className="hidden md:flex w-full md:w-1/2 relative bg-[#1B365D]">
          <img src="/lo.jpeg" alt="Register Illustration" className="w-full h-full object-cover" />
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 px-8 py-10 md:py-12 md:px-16 flex flex-col justify-center bg-[#F4F7FB]">
          <h2 className="text-[32px] font-black text-center mb-8 text-gray-800 tracking-wide">REGISTER</h2>
          
          {/* User / Admin Slider */}
          <div className="relative flex items-center p-1 bg-gray-200/50 rounded-xl mb-8 w-full max-w-[240px] mx-auto">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0 ${registerType === 'user' ? 'left-1' : 'left-[calc(50%+3px)]'}`}
            ></div>
            <button 
              type="button"
              onClick={() => setRegisterType('user')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-bold z-10 transition-colors duration-300 ${registerType === 'user' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Job Seeker
            </button>
            <button 
              type="button"
              onClick={() => setRegisterType('admin')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-bold z-10 transition-colors duration-300 ${registerType === 'admin' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-100 border border-red-200 text-red-600 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block px-1">Full Name</label>
              <Input 
                type="text" 
                className="w-full h-[42px] bg-transparent border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded-xl font-medium px-4 shadow-sm"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block px-1">Email</label>
              <Input 
                type="email" 
                className="w-full h-[42px] bg-transparent border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded-xl font-medium px-4 shadow-sm"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 block px-1">Password</label>
              <Input 
                type="password" 
                className="w-full h-[42px] bg-transparent border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded-xl font-medium px-4 shadow-sm"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center pt-4 pb-2">
              <Button type="submit" className="w-[160px] h-[40px] text-sm font-bold rounded-xl bg-[#BACFE8] hover:bg-[#A3BBD8] text-gray-700 shadow-none transition-all" loading={loading}>
                Sign Up
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-[11px] text-gray-400 font-semibold">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline hover:text-blue-500">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
