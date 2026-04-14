'use server';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.SUPABASE_S3_ENDPOINT || 'https://jwmjqlgoettrifzskrtw.storage.supabase.co/storage/v1/s3',
  forcePathStyle: true,
});

export async function uploadMedia(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'banners';
    const folder = (formData.get('folder') as string) || 'media';
    
    if (!file) throw new Error('No file provided');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct Public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwmjqlgoettrifzskrtw.supabase.co';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Server S3 Upload error:', error);
    return { success: false, error: error.message };
  }
}
