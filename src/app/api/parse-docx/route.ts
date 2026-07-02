import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require('mammoth');

    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim() || '';

    if (!text) {
      return NextResponse.json({ error: 'No text could be extracted from this document.' }, { status: 422 });
    }

    console.log('✅ DOCX parsed successfully, text length:', text.length);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('❌ DOCX parsing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse DOCX' }, { status: 500 });
  }
}
