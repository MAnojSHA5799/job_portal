import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('jobs').select('location').ilike('location', '%Delhi%').limit(10);
  const { data: d2, error: e2 } = await supabase.from('jobs').select('location').ilike('location', '%delhi ncr%').limit(10);
  const { data: d3, error: e3 } = await supabase.from('jobs').select('location').ilike('location', '%bangalore%').limit(10);

  return NextResponse.json({ delhi: data, delhiNcr: d2, bangalore: d3, error, e2 });
}
