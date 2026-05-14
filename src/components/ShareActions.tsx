"use client";

import React, { useState } from 'react';
import { Share2, X, MessageCircle, Mail, Send, Copy, Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface ShareActionsProps {
    title: string;
    url?: string;
}

export function ShareActions({ title, url }: ShareActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Fallback for SSR
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareUrl = url || currentUrl;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(`Check out this job: ${title}`);

    const copyToClipboard = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="w-6 h-6" />,
            color: 'bg-[#25D366]',
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
        },
        {
            name: 'LinkedIn',
            icon: (
                <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-6 h-6"
                >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                </svg>
            ),
            color: 'bg-[#0077B5]',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        },
        {
            name: 'Telegram',
            icon: <Send className="w-6 h-6" />,
            color: 'bg-[#0088cc]',
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
        },
        {
            name: 'Email',
            icon: <Mail className="w-6 h-6" />,
            color: 'bg-[#EA4335]',
            href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
        }
    ];

    return (
        <>
            <Button 
                variant="outline" 
                onClick={() => setIsOpen(true)}
                className="h-12 px-6 rounded-xl border-gray-200 text-gray-600 font-bold flex items-center gap-2 hover:border-primary hover:text-primary transition-all"
            >
                <Share2 className="w-4 h-4" /> Share
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <Card className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300 border-0">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Share <span className="text-primary italic">Job</span></h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            {shareLinks.map((link) => (
                                <a 
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-3 p-5 rounded-3xl border border-gray-50 hover:bg-gray-50 transition-all group"
                                >
                                    <div className={`${link.color} text-white p-3.5 rounded-2xl shadow-lg shadow-black/5 group-hover:scale-110 group-hover:-rotate-3 transition-transform`}>
                                        {link.icon}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{link.name}</span>
                                </a>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Link Copier</p>
                            <div className="flex items-center gap-2 p-2 rounded-2xl bg-gray-50 border border-gray-100 group-hover:border-primary/20 transition-colors">
                                <input 
                                    readOnly 
                                    value={shareUrl} 
                                    className="flex-1 bg-transparent border-0 text-[10px] font-bold text-gray-400 px-3 outline-none truncate"
                                />
                                <Button 
                                    onClick={copyToClipboard}
                                    className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-100 shadow-sm text-[10px] rounded-xl"
                                >
                                    {copied ? (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <Check className="w-3 h-3" /> Copied
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Copy className="w-3 h-3" /> Copy
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
