"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { 
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  // AdSense state
  const [publisherId, setPublisherId] = useState('');
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [adsenseSaving, setAdsenseSaving] = useState(false);
  const [adsenseSuccess, setAdsenseSuccess] = useState<string | null>(null);
  const [adsenseError, setAdsenseError] = useState<string | null>(null);
  const [adsenseLoading, setAdsenseLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setPublisherId(data.settings.adsense_publisher_id || '');
          setSlot1(data.settings.adsense_slot_job_list_1 || '');
          setSlot2(data.settings.adsense_slot_job_list_2 || '');
          setSlot3(data.settings.adsense_slot_job_list_3 || '');
        }
      })
      .catch(() => {})
      .finally(() => setAdsenseLoading(false));
  }, []);

  const handleSaveAdsense = async () => {
    setAdsenseSaving(true);
    setAdsenseSuccess(null);
    setAdsenseError(null);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            adsense_publisher_id: publisherId.trim(),
            adsense_slot_job_list_1: slot1.trim(),
            adsense_slot_job_list_2: slot2.trim(),
            adsense_slot_job_list_3: slot3.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdsenseSuccess('AdSense settings saved! Jobs page will now show ads.');
    } catch (err: any) {
      setAdsenseError(err.message || 'Failed to save settings');
    } finally {
      setAdsenseSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your AdSense monetization settings.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 border-0 shadow-sm bg-white max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Google AdSense</h3>
              <p className="text-xs text-gray-400 font-medium">Jobs page par ads automatically apply ho jaayenge</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
            💡 <strong>Kahan se milega?</strong> Google AdSense dashboard → Sites → Ad Units mein jaake Publisher ID aur Slot IDs milenge.
          </div>

          {adsenseSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {adsenseSuccess}
            </div>
          )}
          {adsenseError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {adsenseError}
            </div>
          )}

          {adsenseLoading ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {/* Publisher ID */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Publisher ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={publisherId}
                  onChange={e => setPublisherId(e.target.value)}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXXX"
                  className="w-full h-[46px] border-2 border-gray-200 focus:border-blue-400 rounded-xl font-mono font-medium px-4 text-sm outline-none bg-transparent transition-colors"
                />
                <p className="text-[10px] text-gray-400 font-medium">Format: ca-pub-XXXXXXXXXXXXXXXXX</p>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Ad Slot IDs</p>
                <div className="space-y-4">

                  {/* Slot 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-black text-indigo-500">1</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 block">Job List Slot 1 (1st job ke baad)</label>
                      <input
                        type="text"
                        value={slot1}
                        onChange={e => setSlot1(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="w-full h-[42px] border-2 border-gray-200 focus:border-blue-400 rounded-xl font-mono font-medium px-4 text-sm outline-none bg-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Slot 2 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-black text-purple-500">2</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 block">Job List Slot 2 (5th job ke baad)</label>
                      <input
                        type="text"
                        value={slot2}
                        onChange={e => setSlot2(e.target.value)}
                        placeholder="e.g. 0987654321"
                        className="w-full h-[42px] border-2 border-gray-200 focus:border-blue-400 rounded-xl font-mono font-medium px-4 text-sm outline-none bg-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Slot 3 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-black text-emerald-500">3</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 block">Job List Slot 3 (page ke end mein)</label>
                      <input
                        type="text"
                        value={slot3}
                        onChange={e => setSlot3(e.target.value)}
                        placeholder="e.g. 1122334455"
                        className="w-full h-[42px] border-2 border-gray-200 focus:border-blue-400 rounded-xl font-mono font-medium px-4 text-sm outline-none bg-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Current Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${publisherId ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className="text-xs font-bold text-gray-600">
                    {publisherId ? `Active — ${publisherId.slice(0, 20)}...` : 'Not configured — ads nahi dikhenge'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveAdsense}
                disabled={adsenseSaving}
                className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-black rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
              >
                {adsenseSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><Check className="w-4 h-4" /> Save AdSense Settings</>
                }
              </button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
