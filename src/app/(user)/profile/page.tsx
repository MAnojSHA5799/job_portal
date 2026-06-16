"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import {
  User, Mail, Phone, MapPin, FileText, Lock,
  CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft,
  Save, Upload, LogOut
} from 'lucide-react';

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
    { label: 'At least 8 characters',      pass: password.length >= 8 },
    { label: 'At least 1 number',           pass: /\d/.test(password) },
    { label: 'At least 1 uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'At least 1 special character',pass: /[^a-zA-Z0-9]/.test(password) },
  ];
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  location: string;
  resume_url?: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [resume, setResume] = useState<File | null>(null);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordChecks = getPasswordChecks(newPassword);
  const isPasswordValid = newPassword.length === 0 || passwordChecks.every(c => c.pass);
  const passwordStrength = passwordChecks.filter(c => c.pass).length;
  const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const parsed = JSON.parse(stored);

    // Fetch fresh user data
    fetch(`/api/auth/profile?id=${parsed.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          setUserData(u);
          setFullName(u.full_name || '');
          setLocation(u.location || '');
          // Parse phone
          if (u.phone) {
            const matched = COUNTRY_CODES.find(c => u.phone.startsWith(c.code));
            if (matched) {
              setCountryCode(matched.code);
              setPhone(u.phone.slice(matched.code.length));
            } else {
              setPhone(u.phone);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setPhone(digits);
    if (digits.length > 0 && digits.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits'); return;
    }
    if (newPassword && !isPasswordValid) {
      setPasswordTouched(true); return;
    }

    setLoading(true); setError(null); setSuccess(null);

    const formData = new FormData();
    formData.append('id', userData!.id);
    formData.append('fullName', fullName);
    formData.append('location', location);
    formData.append('phone', phone ? `${countryCode}${phone}` : '');
    if (newPassword) formData.append('newPassword', newPassword);
    if (resume) formData.append('resume', resume);

    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, fullName: fullName };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setNewPassword('');
      setPasswordTouched(false);
      if (data.user) setUserData(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10">
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-[#ADC5E3] to-indigo-200" />
          <div className="px-8 pb-8">
            <div className="flex items-end gap-4 -mt-10 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-black text-primary">
                {userData.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-black text-gray-900">{userData.full_name}</h1>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{userData.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <Mail className="w-4 h-4 text-gray-300" />
                <span className="truncate">{userData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <Phone className="w-4 h-4 text-gray-300" />
                <span>{userData.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 font-medium">
                <MapPin className="w-4 h-4 text-gray-300" />
                <span>{userData.location || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-black text-gray-900 mb-6">Edit Profile</h2>

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSave}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-[46px] border-2 border-gray-200 focus:border-blue-400 rounded-xl font-medium pl-11 pr-4 text-sm outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[46px] px-2 border-2 border-gray-200 focus:border-blue-400 rounded-xl font-bold text-sm text-gray-700 outline-none shrink-0 bg-transparent"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  maxLength={10}
                  className={`flex-1 h-[46px] border-2 ${phoneError ? 'border-red-400' : 'border-gray-200'} focus:border-blue-400 rounded-xl font-medium px-4 text-sm outline-none bg-transparent`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>
              {phoneError && <p className="text-[10px] text-red-500 font-bold">{phoneError}</p>}
              {phone.length === 10 && !phoneError && (
                <p className="text-[10px] text-emerald-600 font-bold">✓ Valid: {countryCode} {phone}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-[46px] border-2 border-gray-200 focus:border-blue-400 rounded-xl font-medium pl-11 pr-4 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Resume */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">Update Resume (optional)</label>
              {userData.resume_url && (
                <a href={userData.resume_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary font-bold flex items-center gap-1 mb-1 hover:underline">
                  <FileText className="w-3 h-3" /> View Current Resume
                </a>
              )}
              <div className="relative border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl transition-colors p-4 flex items-center gap-3 cursor-pointer group"
                onClick={() => document.getElementById('resume-upload')?.click()}>
                <Upload className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-600">{resume ? resume.name : 'Click to upload PDF/DOCX'}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Max 5MB</p>
                </div>
                <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={(e) => setResume(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" /> Change Password
                <span className="text-[10px] font-bold text-gray-400 ml-1">(leave empty to keep current)</span>
              </h3>

              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordTouched(true); }}
                    placeholder="New password (optional)"
                    className={`w-full h-[46px] border-2 ${(passwordTouched && newPassword && !isPasswordValid) ? 'border-red-400' : newPassword && isPasswordValid ? 'border-emerald-400' : 'border-gray-200'} focus:border-blue-400 rounded-xl font-medium px-4 pr-12 text-sm outline-none bg-transparent transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-black ${['','text-red-500','text-orange-500','text-yellow-600','text-emerald-600'][passwordStrength]}`}>
                      Password Strength: {strengthLabel[passwordStrength]}
                    </p>
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
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full h-12 bg-[#ADC5E3] hover:bg-[#9BB8DA] text-gray-800 font-black rounded-xl border-none shadow-none flex items-center justify-center gap-2 text-[15px] mt-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
