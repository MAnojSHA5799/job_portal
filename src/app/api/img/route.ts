import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q) return new NextResponse('Missing query', { status: 400 });
  
  try {
    // Decrypt (decode base64) to get original URL
    const decodedUrl = Buffer.from(q, 'base64').toString('utf-8');
    
    // Security check: Only proxy urls from our Supabase instance
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!decodedUrl.startsWith(supabaseUrl) || !decodedUrl.includes('/storage/v1/object/public/')) {
      return new NextResponse('Unauthorized domain', { status: 403 });
    }
    
    // Fetch image from original source
    const response = await fetch(decodedUrl);
    if (!response.ok) return new NextResponse('Image not found', { status: 404 });
    
    // Get image data
    const arrayBuffer = await response.arrayBuffer();
    
    // Proxy it back to the client with correct headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        // Cache the image for 1 year in the user's browser since these logos rarely change
        'Cache-Control': 'public, max-age=31536000, immutable', 
      }
    });
  } catch (e) {
    return new NextResponse('Invalid request', { status: 400 });
  }
}
