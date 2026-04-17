import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    // Use exec with a shell command string to bypass Turbopack's static analyzer entirely
    // Use absolute path to modern node version (v18+) because system default (v16) is incompatible with Playwright
    const nodePath = '/opt/homebrew/bin/node';
    const cmd = `${nodePath} ./scripts/scraper.js`;
    // Use spawn instead of exec to avoid maxBuffer errors leading to incomplete runs
    console.log(`📡 Triggering scraper hub with: ${nodePath} ./scripts/scraper.js`);
    
    const scraperProcess = spawn(nodePath, ['./scripts/scraper.js'], { 
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore' // We ignore output to let it run fully in the background without tying up streams
    });

    // Unref so the Next.js process doesn't wait for the child
    scraperProcess.unref();

    console.log(`✅ Scraper Process Launched.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Scraper started in the background.' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
