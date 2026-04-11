"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  const containerVariants: any = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] p-4 sm:p-8 relative overflow-hidden">
      
      {/* Animated Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[80px]"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[15%] w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-[100px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1000px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col md:flex-row border border-white/80 relative z-10"
      >
        
        {/* Left Side: Illustration */}
        <div className="hidden md:flex w-full md:w-1/2 relative bg-[#1B365D] overflow-hidden group">
          <motion.img 
            initial={{ scale: 1.1, filter: 'brightness(0.8)' }}
            animate={{ scale: 1, filter: 'brightness(1)' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="/lo.jpeg" 
            alt="Login Illustration" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B365D]/60 to-transparent opacity-60"></div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 px-8 py-12 md:py-16 md:px-14 xl:px-16 flex flex-col justify-center bg-gradient-to-br from-[#F4F7FB]/90 to-white/50">
          <motion.h2 variants={itemVariants} className="text-[32px] font-black text-center mb-10 text-gray-800 tracking-tight">
            Welcome Back
          </motion.h2>
          
          {/* User / Admin Slider */}
          <motion.div variants={itemVariants} className="relative flex items-center p-1.5 bg-gray-200/50 rounded-2xl mb-10 w-full max-w-[260px] mx-auto shadow-inner">
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) z-0 ${loginType === 'user' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
            ></div>
            <button 
              type="button"
              onClick={() => setLoginType('user')}
              className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold z-10 transition-colors duration-300 ${loginType === 'user' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Job Seeker
            </button>
            <button 
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold z-10 transition-colors duration-300 ${loginType === 'admin' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Admin
            </button>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold text-center shadow-sm">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">Email</label>
              <Input 
                type="email" 
                className="w-full h-[48px] bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl font-medium px-4 shadow-sm transition-all hover:bg-white"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">Password</label>
              <Input 
                type="password" 
                className="w-full h-[48px] bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl font-medium px-4 shadow-sm transition-all hover:bg-white"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-center pt-4 pb-6">
              <Button 
                type="submit" 
                className="w-full sm:w-[180px] h-[48px] text-[15px] font-bold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5 border-0" 
                loading={loading}
              >
                Sign In
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-between items-center text-xs font-semibold text-gray-500 px-1">
              <label className="flex items-center space-x-2 cursor-pointer hover:text-gray-700 group">
                <div className="relative flex items-center justify-center w-4 h-4 rounded border-2 border-gray-300 group-hover:border-blue-400 transition-colors">
                  <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" />
                  <div className="w-2 h-2 bg-blue-500 rounded-sm opacity-0 scale-50 transition-all"></div>
                </div>
                <span>Remember me</span>
              </label>
              <Link href="#" className="text-blue-500 hover:text-blue-600 hover:underline transition-colors">Forgot Password?</Link>
            </motion.div>
          </form>

          <motion.p variants={itemVariants} className="mt-8 text-center text-[12px] text-gray-500 font-semibold">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-500 hover:underline hover:text-blue-600 ml-1">Create one now</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

