"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FB] p-4">
      <div className="max-w-[400px] w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-[28px] font-black text-center mb-2 text-gray-800 tracking-wide uppercase">Reset Password</h2>
        <p className="text-center text-sm text-gray-500 mb-8 font-medium">Enter your email and we'll send a reset link</p>
        
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold">
              Password reset instructions have been sent to your email! (Check your dev console for the link).
            </div>
            <Link href="/login" className="block pt-4">
              <Button variant="outline" className="w-full h-[46px] rounded-xl font-bold">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Email Address</label>
              <Input 
                type="email" 
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-[46px] text-[15px] font-bold rounded-xl bg-[#ADC5E3] hover:bg-[#9BB8DA] text-gray-800 shadow-none transition-colors border-none" loading={loading}>
                Send Reset Link
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400 font-semibold">
              Remember your password?{' '}
              <Link href="/login" className="text-[#ADC5E3] hover:underline font-extrabold">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
