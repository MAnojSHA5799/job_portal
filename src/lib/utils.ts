import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProxiedImageUrl(url: string | null | undefined) {
  if (!url) return '';
  // Only proxy Supabase storage URLs
  if (!url.includes('supabase.co/storage')) return url;
  
  try {
    // Safely encode to base64 for both client and server (Node 18+ supports btoa)
    const base64Url = typeof btoa === 'function' 
      ? btoa(url)
      : typeof Buffer !== 'undefined' 
        ? Buffer.from(url).toString('base64') 
        : '';
        
    if (!base64Url) return url;
      
    // Return our encrypted proxy endpoint
    return `/api/img?q=${encodeURIComponent(base64Url)}`;
  } catch (e) {
    console.error('Failed to proxy image URL:', e);
    return url;
  }
}
