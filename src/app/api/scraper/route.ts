import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // IMPORTANT: Replace this with your actual Render service URL after deployment
    // Example: 'https://job-scraper-service.onrender.com/scrape'
    const RENDER_SCRAPER_URL = 'https://job-portal-ve23.onrender.com/scrape';
    // const RENDER_SCRAPER_URL = 'http://localhost:4000/scrape';

    console.log(`📡 Triggering remote scraper on Render: ${RENDER_SCRAPER_URL}`);

    // Trigger the scraper asynchronously (don't wait for it to finish)
    // We use a background fetch to avoid blocking the main thread
    fetch(RENDER_SCRAPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => console.error('⚠️ Remote Trigger Error:', err.message));

    return NextResponse.json({ 
      success: true, 
      message: 'Scraper triggered on Render successfully. Monitoring will continue via logs.' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
