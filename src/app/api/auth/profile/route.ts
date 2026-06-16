import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

// GET: Fetch user by ID
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, location, resume_url, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get('id') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const newPassword = formData.get('newPassword') as string | null;
    const resume = formData.get('resume') as File | null;

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const updatePayload: any = {
      full_name: fullName,
      phone,
      location,
    };

    // Handle resume upload
    if (resume && resume.size > 0) {
      const fileName = `${Date.now()}_${resume.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, resume, { upsert: true });
      if (!uploadError) {
        const { data: publicData } = supabase.storage.from('resumes').getPublicUrl(fileName);
        updatePayload.resume_url = publicData.publicUrl;
      }
    }

    // Handle password change
    if (newPassword && newPassword.trim().length >= 8) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.password_hash = await bcrypt.hash(newPassword, salt);
    }

    const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);
    if (error) throw error;

    // Return updated user
    const { data: updated } = await supabase
      .from('users')
      .select('id, email, full_name, phone, location, resume_url, role, created_at')
      .eq('id', userId)
      .single();

    return NextResponse.json({ message: 'Profile updated successfully', user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
