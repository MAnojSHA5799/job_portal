import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'blogs';
    const folder = (formData.get('folder') as string) || 'blog-images';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name || 'image.png';
    const cleanExt = originalName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
    const filePath = `${folder}/${fileName}`;

    let targetBucket = bucket;
    let targetPath = filePath;

    // Try target bucket first
    let { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(targetPath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    // If target bucket fails (e.g. RLS policy violation or missing bucket), fallback to 'resumes' bucket
    if (error) {
      console.warn(`Upload to '${targetBucket}' failed: ${error.message}. Falling back to 'resumes' bucket.`);
      targetBucket = 'resumes';
      targetPath = `${bucket}/${folder}/${fileName}`;

      const fallbackResult = await supabase.storage
        .from(targetBucket)
        .upload(targetPath, buffer, {
          contentType: file.type || 'image/png',
          upsert: true,
        });

      if (fallbackResult.error) {
        console.error('Fallback upload failed:', fallbackResult.error);
        return NextResponse.json({
          success: false,
          error: `Upload failed: ${fallbackResult.error.message}`
        }, { status: 500 });
      }
    }

    const { data: urlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(targetPath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      bucket: targetBucket,
      path: targetPath,
    });
  } catch (error: any) {
    console.error('API Admin Upload Exception:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Server error uploading file'
    }, { status: 500 });
  }
}
