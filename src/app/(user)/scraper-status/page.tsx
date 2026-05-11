import { supabase } from '@/lib/supabase';

export default async function ScraperStatus() {
  const { data: logs } = await supabase
    .from('scraper_logs')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="p-10 font-mono text-xs bg-gray-900 text-green-400 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white border-b border-green-900 pb-2">SCRAPER SYSTEM LOGS</h1>
      
      <div className="space-y-2">
        {logs?.map(log => (
          <div key={log.id} className="p-3 border border-green-900 bg-black/50 rounded flex justify-between items-center">
            <div className="flex-1">
              <span className="text-gray-500 mr-4">[{new Date(log.created_at).toLocaleString()}]</span>
              <span className={`font-bold mr-4 ${log.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
                {log.status.toUpperCase()}
              </span>
              <span className="text-white font-bold">{log.companies?.name || 'Unknown'}</span>
              <p className="text-[10px] text-gray-500 mt-1 truncate max-w-xl">{log.error_message}</p>
            </div>
            <div className="text-right">
              <span className="bg-green-900/30 px-3 py-1 rounded-full text-green-400 font-bold">
                {log.jobs_found} JOBS
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {!logs?.length && <p className="text-amber-500">No scraper logs found. Is the scraper running?</p>}

      <div className="mt-10 p-6 bg-black border border-green-900 rounded-2xl">
         <h2 className="text-white font-bold mb-4">Quick Diagnostic</h2>
         <p className="text-gray-400">If "JOBS" is always 0, the scraper is failing to find elements on the target sites.</p>
      </div>
    </div>
  );
}
