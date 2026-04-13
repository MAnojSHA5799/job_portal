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
    <div className="h-screen w-full flex bg-[#F4F7FB] overflow-hidden">
      
      {/* Left Side: Illustration (60% width) edge-to-edge */}
      <div className="hidden md:flex w-full md:w-[60%] h-full relative bg-white items-stretch">
        <img src="/lo.jpeg" alt="Register Illustration" className="w-full h-full object-cover" />
      </div>

      {/* Right Side: Form (40% width) */}
      <div className="w-full h-full md:w-[40%] px-8 py-8 md:px-12 xl:px-16 flex flex-col justify-center bg-[#F4F7FB] overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="max-w-[400px] w-full mx-auto">
          <h2 className="text-[28px] font-black text-center mb-6 text-gray-800 tracking-wide uppercase">REGISTER</h2>
          
          {/* User / Admin Slider */}
          <div className="relative flex items-center p-1 bg-gray-200/50 rounded-xl mb-6 w-full mx-auto">
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
            <div className="mb-4 p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Full Name</label>
              <Input 
                type="text" 
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

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

            <div className="flex items-center justify-center pt-2 pb-2">
              <Button type="submit" className="w-full h-[46px] text-[15px] font-bold rounded-xl bg-[#ADC5E3] hover:bg-[#9BB8DA] text-gray-800 shadow-none transition-colors border-none" loading={loading}>
                Sign Up
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 font-semibold">
            Already have an account?{' '}
            <Link href="/login" className="text-[#ADC5E3] hover:underline">Log In</Link>
          </p>
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
