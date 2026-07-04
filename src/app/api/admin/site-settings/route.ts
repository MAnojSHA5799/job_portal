import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all site settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    // If table doesn't exist yet, return empty settings gracefully
    if (error) {
      console.warn('[site-settings] Table may not exist yet:', error.message);
      return NextResponse.json({ settings: {} });
    }

    // Convert array to key-value object
    const settings: Record<string, string> = {};
    (data || []).forEach(({ key, value }: { key: string; value: string }) => {
      settings[key] = value;
    });

    return NextResponse.json({ settings });
  } catch (err: any) {
    // Return empty settings on any error — never crash the app
    console.error('[site-settings] GET error:', err.message);
    return NextResponse.json({ settings: {} });
  }
}

// PUT: Update site settings
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    // Upsert each key
    const upsertData = Object.entries(settings).map(([key, value]) => ({ key, value }));

    const { error } = await supabase
      .from('site_settings')
      .upsert(upsertData, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ message: 'Settings saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
