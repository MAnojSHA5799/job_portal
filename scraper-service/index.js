const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Update this with your actual frontend Vercel URL
const allowedOrigins = [
  // 'http://localhost:3000',
  'https://job-portal-seven-rosy.vercel.app' 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Job Scraper Service is Running 🚀');
});

app.get('/scrape', (req, res) => {
  res.send('Use POST to trigger scraper, or wait... I will trigger it for you now! 🚀');
  triggerScraper();
});

app.post('/scrape', (req, res) => {
  triggerScraper();
  res.json({
    success: true,
    message: 'Scraper started successfully in the background.'
  });
});

function triggerScraper() {
  console.log('📡 Scrape request received...');
  const scraper = spawn('node', ['scraper.js'], {
    detached: true,
    stdio: 'inherit'
  });
  scraper.unref();
}

app.listen(PORT, () => {
  console.log(`🚀 Scraper service listening on port ${PORT}`);
});
