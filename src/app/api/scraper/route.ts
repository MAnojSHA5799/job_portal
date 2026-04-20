import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    // Use exec with a shell command string to bypass Turbopack's static analyzer entirely
    // Use process.execPath to get the current node executable path dynamically
    const nodePath = process.execPath;
    const scriptPath = path.join(process.cwd(), 'scripts', 'scraper.js');
    
    console.log(`📡 Triggering scraper hub with: ${nodePath} ${scriptPath}`);
    
    const scraperProcess = spawn(nodePath, [scriptPath], { 
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore' 
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
