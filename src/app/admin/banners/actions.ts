'use server';

import { supabase } from '@/lib/supabase';

export async function uploadMedia(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'banners';
    const folder = (formData.get('folder') as string) || 'media';
    
    if (!file) throw new Error('No file provided');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    let targetBucket = bucket;
    let targetPath = `${folder}/${fileName}`;

    let { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(targetPath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.warn(`Direct upload to '${targetBucket}' failed: ${error.message}. Using fallback storage.`);
      targetBucket = 'resumes';
      targetPath = `${bucket}/${folder}/${fileName}`;
      const fallback = await supabase.storage
        .from(targetBucket)
        .upload(targetPath, buffer, {
          contentType: file.type || 'image/png',
          upsert: true,
        });

      if (fallback.error) {
        throw fallback.error;
      }
    }

    const { data: urlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(targetPath);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Server Upload error:', error);
    return { success: false, error: error.message };
  }
}
