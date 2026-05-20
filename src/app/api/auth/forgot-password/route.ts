import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
    }

    // 2. Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    // 3. Save token to user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: resetExpires
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating reset token:', updateError);
      return NextResponse.json({ error: 'Failed to generate reset token. Did you run the SQL migration to add reset_token columns?' }, { status: 500 });
    }

    // 4. "Send" the email
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    // In a real app, you would use Resend, SendGrid, NodeMailer here.
    // For development, we log it to the server console.
    console.log('\n\n=========================================');
    console.log('🔒 PASSWORD RESET LINK GENERATED 🔒');
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log('=========================================\n\n');

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' }, { status: 200 });

  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
