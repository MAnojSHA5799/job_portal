import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const role = formData.get('role') as string;
    const resume = formData.get('resume') as File | null;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 2. Upload Resume if exists
    let resumeUrl = null;
    if (resume) {
      const fileName = `${Date.now()}_${resume.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resume);

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
        resumeUrl = publicData.publicUrl;
      }
    }

    // 3. Hash Password with Bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert into public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: fullName,
        password_hash: passwordHash,
        phone,
        location,
        resume_url: resumeUrl,
        role: role || ((email === 'admin@gmail.com' || email.endsWith('@admin.com')) ? 'admin' : 'user')
      });

    if (insertError) throw insertError;

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
