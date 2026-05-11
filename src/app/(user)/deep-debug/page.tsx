import { supabase } from '@/lib/supabase';

export default async function DeepDebug() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, url_slug, location, is_approved');

  return (
    <div className="p-10 font-mono text-[10px] bg-white">
      <h1 className="text-xl font-bold mb-4">Deep Database Audit (35 Jobs)</h1>
      {error && <p className="text-red-500">{error.message}</p>}
      
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Title</th>
            <th className="border p-2">URL Slug</th>
            <th className="border p-2">Approved</th>
          </tr>
        </thead>
        <tbody>
          {jobs?.map(job => (
            <tr key={job.id}>
              <td className="border p-2 font-bold text-gray-900">{job.title}</td>
              <td className="border p-2 text-blue-600">"{job.url_slug}"</td>
              <td className="border p-2">{String(job.is_approved)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
