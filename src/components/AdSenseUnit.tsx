"use client";

import React, { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  publisherId: string;
  slotId: string;
  className?: string;
}

export function AdSenseUnit({ publisherId, slotId, className = '' }: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    // Only push if the element exists and hasn't been filled yet
    if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
      try {
        const w = window as any;
        (w.adsbygoogle = w.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  return (
    <div className={`overflow-hidden flex justify-center items-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      {/* Dev placeholder for localhost */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute inset-0 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center -z-10 text-gray-400 font-medium text-sm">
          AdSense Unit ({slotId})
        </div>
      )}
    </div>
  );
}
