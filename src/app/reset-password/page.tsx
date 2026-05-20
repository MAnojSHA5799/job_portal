"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) return <div className="min-h-screen w-full flex items-center justify-center p-8 text-center font-bold text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FB] p-4">
      <div className="max-w-[400px] w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-[28px] font-black text-center mb-2 text-gray-800 tracking-wide uppercase">New Password</h2>
        <p className="text-center text-sm text-gray-500 mb-8 font-medium">Create a new secure password</p>
        
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold">
              Password successfully reset! Redirecting to login...
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">New Password</label>
              <Input 
                type="password" 
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={!token}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Confirm Password</label>
              <Input 
                type="password" 
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={!token}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-[46px] text-[15px] font-bold rounded-xl bg-[#ADC5E3] hover:bg-[#9BB8DA] text-gray-800 shadow-none transition-colors border-none" loading={loading} disabled={!token}>
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center p-8 text-center font-bold text-gray-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
