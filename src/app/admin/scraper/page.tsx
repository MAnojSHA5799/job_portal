"use client";

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Play, 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCcw,
  Zap,
  Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ScraperLog {
  id: string;
  status: 'running' | 'completed' | 'failed';
  jobs_found: number;
  error_message: string;
  created_at: string;
}

export default function ScraperManager() {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scraper_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleTriggerScraper = async () => {
    setTriggering(true);
    try {
      const response = await fetch('/api/scraper', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert('Scraper triggered successfully!');
        fetchLogs();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error triggering scraper: ' + error.message);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="space-y-2">
            <Badge variant="info" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest">System Automation</Badge>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Scraper Engine</h1>
            <p className="text-gray-500 font-medium">Manage and monitor automated job discovery across 10+ career portals.</p>
        </div>
        <Button 
          size="lg" 
          className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 font-black text-sm uppercase tracking-widest gap-2"
          onClick={handleTriggerScraper}
          disabled={triggering}
        >
          {triggering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
          Run Global Scrape
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-0 overflow-hidden border-0 shadow-xl shadow-gray-100 bg-white rounded-[32px]">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Execution History
            </h3>
            <Button variant="ghost" size="sm" onClick={fetchLogs} className="text-gray-400 hover:text-primary">
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Jobs Found</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      {log.status === 'completed' && <Badge variant="success" className="gap-1.5"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>}
                      {log.status === 'running' && <Badge variant="warning" className="gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Processing</Badge>}
                      {log.status === 'failed' && <Badge variant="danger" className="gap-1.5"><XCircle className="w-3 h-3" /> Failed</Badge>}
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-gray-900">
                      {log.jobs_found}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {log.error_message ? (
                        <span className="text-[10px] text-danger font-bold line-clamp-1 max-w-[150px] ml-auto">{log.error_message}</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold italic">Healthy Sync</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="p-8 border-0 shadow-lg shadow-gray-100 bg-gray-900 text-white rounded-[32px] relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-black mb-2 leading-none">Global Reach</h4>
              <p className="text-sm text-gray-400 font-medium mb-6">Connected to 10 industry major career portals including Unilever, Siemens, and Mercedes-Benz.</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Node Cluster Active</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <RefreshCcw className="w-24 h-24 rotate-12" />
            </div>
          </Card>

          <Card className="p-8 border-0 shadow-lg shadow-gray-100 bg-primary/5 rounded-[32px]">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" fill="currentColor" /> Optimization Tips
            </h4>
            <ul className="space-y-4">
              {[
                'Run full scrapes during off-peak hours (10 PM - 4 AM).',
                'Verify new companies before bulk approving jobs.',
                'Use "AI Fix" in Jobs Queue to optimize SEO for pending posts.',
                'Ensure your Supabase connection limits are monitored.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs font-medium text-gray-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
