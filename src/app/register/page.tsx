"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  const containerVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF2F8] p-4 sm:p-8 relative overflow-hidden">
      
      {/* Animated Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[80px]"
        />
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.25, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[15%] w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-[100px]"
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
            alt="Register Illustration" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B365D]/60 to-transparent opacity-60"></div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 px-8 py-10 md:py-12 md:px-14 xl:px-16 flex flex-col justify-center bg-gradient-to-bl from-[#F4F7FB]/90 to-white/50">
          <motion.h2 variants={itemVariants} className="text-[32px] font-black text-center mb-8 text-gray-800 tracking-tight">
            Create Account
          </motion.h2>
          
          {/* User / Admin Slider */}
          <motion.div variants={itemVariants} className="relative flex items-center p-1.5 bg-gray-200/50 rounded-2xl mb-8 w-full max-w-[260px] mx-auto shadow-inner">
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-400 ease-out z-0 ${registerType === 'user' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
            ></div>
            <button 
              type="button"
              onClick={() => setRegisterType('user')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-bold z-10 transition-colors duration-300 ${registerType === 'user' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Job Seeker
            </button>
            <button 
              type="button"
              onClick={() => setRegisterType('admin')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-bold z-10 transition-colors duration-300 ${registerType === 'admin' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">Full Name</label>
              <Input 
                type="text" 
                className="w-full h-[46px] bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl font-medium px-4 shadow-sm transition-all hover:bg-white"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">Email</label>
              <Input 
                type="email" 
                className="w-full h-[46px] bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl font-medium px-4 shadow-sm transition-all hover:bg-white"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block px-1">Password</label>
              <Input 
                type="password" 
                className="w-full h-[46px] bg-white/70 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl font-medium px-4 shadow-sm transition-all hover:bg-white"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-center pt-4 pb-2">
              <Button 
                type="submit" 
                className="w-full sm:w-[180px] h-[48px] text-[15px] font-bold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5 border-0" 
                loading={loading}
              >
                Sign Up
              </Button>
            </motion.div>
          </form>

          <motion.p variants={itemVariants} className="mt-6 text-center text-[12px] text-gray-500 font-semibold">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500 hover:underline hover:text-blue-600 ml-1">Log In</Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
