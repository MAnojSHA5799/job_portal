import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    // Use exec with a shell command string to bypass Turbopack's static analyzer entirely
    const cmd = `node ./scripts/scraper.js`;
    
    // Trigger the scraper in the background
    const { exec } = require('child_process');
    exec(cmd, { cwd: process.cwd() }, (error: any) => {
      if (error) console.error(`Scraper start error: ${error.message}`);
    });

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
