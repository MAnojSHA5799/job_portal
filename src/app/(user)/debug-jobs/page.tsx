import { supabase } from '@/lib/supabase';

export default async function DebugJobs({ searchParams }: { searchParams: any }) {
  const query = (await searchParams).q;
  
  let dbQuery = supabase
    .from('jobs')
    .select('id, title, url_slug, is_approved, location, created_at')
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`);
  } else {
    dbQuery = dbQuery.limit(50);
  }
  
  const { data: jobs, error } = await dbQuery;
  const { count: totalJobs } = await supabase.from('jobs').select('id', { count: 'exact', head: true });
  
  return (
    <div className="p-10 font-mono text-xs bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Database Debugger</h1>
      <p className="text-gray-500 mb-8">Total Jobs in Database: <span className="text-black font-bold">{totalJobs || 0}</span></p>

      <form action="/debug-jobs" method="GET" className="mb-10 flex gap-2">
        <input 
          name="q" 
          defaultValue={query} 
          placeholder="Search title..." 
          className="border px-4 py-2 rounded w-64"
        />
        <button type="submit" className="bg-black text-white px-6 py-2 rounded font-bold">SEARCH</button>
        <a href="/debug-jobs" className="px-4 py-2 border rounded">RESET</a>
      </form>
      
      {error && <div className="p-4 bg-red-50 text-red-600 mb-6 rounded">DB Error: {error.message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs?.map(job => (
          <div key={job.id} className={`p-4 border rounded shadow-sm ${job.is_approved ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${job.is_approved ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                {job.is_approved ? 'APPROVED' : 'PENDING'}
              </span>
              <span className="text-gray-400">{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm font-black mb-1">{job.title}</p>
            <p className="text-blue-600 mb-2 font-bold break-all">Slug: {job.url_slug || 'NULL'}</p>
            <p className="text-gray-500">Loc: {job.location}</p>
            <p className="text-gray-400 mt-2 text-[10px]">ID: {job.id}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
               <a href={`/jobs/${job.url_slug || job.id}`} target="_blank" className="text-primary hover:underline font-bold">View Page →</a>
            </div>
          </div>
        ))}
      </div>
      
      {jobs?.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
          <p className="text-gray-400 text-lg">No jobs found in database.</p>
        </div>
      )}
    </div>
  );
}
