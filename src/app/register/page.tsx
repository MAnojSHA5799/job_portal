"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
];

function getPasswordChecks(password: string) {
  return [
    { label: 'At least 8 characters',     pass: password.length >= 8 },
    { label: 'At least 1 number',          pass: /\d/.test(password) },
    { label: 'At least 1 uppercase letter',pass: /[A-Z]/.test(password) },
    { label: 'At least 1 special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ];
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = getPasswordChecks(password);
  const isPasswordValid = passwordChecks.every(c => c.pass);
  const passwordStrength = passwordChecks.filter(c => c.pass).length;

  const handlePhoneChange = (val: string) => {
    // Allow only digits
    const digits = val.replace(/\D/g, '');
    setPhone(digits);
    if (digits.length > 0 && digits.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setPasswordTouched(true);
      return;
    }
    if (phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('fullName', fullName);
      formData.append('phone', `${countryCode}${phone}`);
      formData.append('location', location);
      formData.append('role', 'user');
      if (resume) formData.append('resume', resume);

      const res = await fetch('/api/auth/register', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const strengthColor = ['bg-gray-200','bg-red-400','bg-orange-400','bg-yellow-400','bg-emerald-500'];
  const strengthLabel = ['','Weak','Fair','Good','Strong'];

  return (
    <div className="h-screen w-full flex bg-[#F4F7FB] overflow-hidden">
      {/* Left Side */}
      <div className="hidden md:flex w-full md:w-[60%] h-full relative bg-white items-stretch">
        <img src="/lo.jpeg" alt="Register Illustration" className="w-full h-full object-cover" />
      </div>

      {/* Right Side */}
      <div className="w-full h-full md:w-[40%] bg-[#F4F7FB] overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-full flex flex-col justify-center px-8 py-8 md:px-12 xl:px-16">
          <div className="max-w-[400px] w-full mx-auto py-10">
            <h2 className="text-[28px] font-black text-center mb-2 text-gray-800 tracking-wide uppercase">REGISTER</h2>
          <p className="text-center text-sm text-gray-500 mb-8 font-medium">Create your account to get started</p>

          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
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

            {/* Email */}
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

            {/* Phone with Country Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[46px] px-2 bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-bold text-sm text-gray-700 outline-none shrink-0"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  maxLength={10}
                  className={`flex-1 h-[46px] bg-transparent border-2 ${phoneError ? 'border-red-400' : 'border-gray-200'} focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm outline-none`}
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>
              {phoneError && (
                <p className="text-[10px] text-red-500 font-bold px-1">{phoneError}</p>
              )}
              {phone.length === 10 && !phoneError && (
                <p className="text-[10px] text-emerald-600 font-bold px-1">✓ Valid number: {countryCode} {phone}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Location</label>
              <Input
                type="text"
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Upload Resume (PDF/DOCX)</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                className="w-full h-[46px] bg-transparent border-2 border-gray-200 focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 text-sm pt-2"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* Password with strength */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block px-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full h-[46px] bg-transparent border-2 ${(passwordTouched && !isPasswordValid) ? 'border-red-400' : password && isPasswordValid ? 'border-emerald-400' : 'border-gray-200'} focus:border-blue-400 focus:ring-0 rounded-xl font-medium px-4 pr-12 text-sm outline-none transition-colors`}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Bar */}
              {password.length > 0 && (
                <div className="px-1 space-y-2">
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-black ${['','text-red-500','text-orange-500','text-yellow-600','text-emerald-600'][passwordStrength]}`}>
                    Password Strength: {strengthLabel[passwordStrength]}
                  </p>

                  {/* Checklist */}
                  <div className="space-y-1 pt-1">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2">
                        {check.pass
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        }
                        <span className={`text-[10px] font-bold ${check.pass ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pt-2 pb-2">
              <Button
                type="submit"
                className="w-full h-[46px] text-[15px] font-bold rounded-xl bg-[#ADC5E3] hover:bg-[#9BB8DA] text-gray-800 shadow-none transition-colors border-none"
                loading={loading}
              >
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
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
